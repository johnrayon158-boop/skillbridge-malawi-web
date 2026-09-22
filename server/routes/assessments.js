const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// List assessments (public)
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id,title,category,questions_count,duration_minutes,created_at FROM assessments ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Get assessment details (hide correct answers for non-admin)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const a = (await db.query('SELECT * FROM assessments WHERE id = $1', [id])).rows[0];
    if (!a) return res.status(404).json({ error: 'Not found' });
    const qs = (await db.query('SELECT q.id,q.text,q.position,q.skill_id,q.difficulty FROM questions q WHERE q.assessment_id = $1 ORDER BY q.position ASC', [id])).rows;
    // fetch options but hide is_correct
    for (const q of qs){ const opts = (await db.query('SELECT id,text FROM options WHERE question_id = $1', [q.id])).rows; q.options = opts; }
    return res.json({ assessment: a, questions: qs });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Admin: create assessment
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { title, category, duration_minutes, time_limit_seconds } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const ins = await db.query('INSERT INTO assessments (title,category,questions_count,duration_minutes,created_at) VALUES ($1,$2,0,$3,now()) RETURNING *', [title, category||null, duration_minutes||null]);
    if (time_limit_seconds) await db.query('UPDATE assessments SET time_limit_seconds=$1 WHERE id=$2', [time_limit_seconds, ins.rows[0].id]);
    return res.json(ins.rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Admin: add question
router.post('/:id/questions', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const assessmentId = req.params.id; const { text, position, skill_id, difficulty } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });
    const ins = await db.query('INSERT INTO questions (assessment_id,text,type,position,created_at,skill_id,difficulty) VALUES ($1,$2,$3,$4,now(),$5,$6) RETURNING *', [assessmentId, text, 'single_choice', position||0, skill_id||null, difficulty||null]);
    // increment questions_count
    await db.query('UPDATE assessments SET questions_count = COALESCE(questions_count,0)+1 WHERE id = $1', [assessmentId]);
    return res.json(ins.rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Admin: add option
router.post('/questions/:qid/options', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const qid = req.params.qid; const { text, is_correct } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });
    const ins = await db.query('INSERT INTO options (question_id,text,is_correct) VALUES ($1,$2,$3) RETURNING *', [qid, text, !!is_correct]);
    return res.json(ins.rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Student: start attempt
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; const assessmentId = req.params.id;
    // create attempt
    const ins = await db.query('INSERT INTO assessment_attempts (assessment_id,user_id,started_at,status) VALUES ($1,$2,now(),$3) RETURNING *', [assessmentId, userId, 'in_progress']);
    return res.json({ attempt: ins.rows[0] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Student: submit attempt with answers array
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; const assessmentId = req.params.id; const { attemptId, answers } = req.body; // answers: [{question_id, option_id, answer_text}]
    if (!attemptId || !Array.isArray(answers)) return res.status(400).json({ error: 'Missing attemptId or answers' });
    // validate attempt
    const at = (await db.query('SELECT * FROM assessment_attempts WHERE id = $1 AND user_id = $2', [attemptId, userId])).rows[0];
    if (!at) return res.status(404).json({ error: 'Attempt not found' });
    if (at.completed_at) return res.status(400).json({ error: 'Attempt already submitted' });

    // fetch correct answers map
    const qids = answers.map(a=>a.question_id);
    const optsRes = await db.query('SELECT o.id, o.question_id, o.is_correct FROM options o WHERE o.question_id = ANY($1)', [qids]);
    const correctMap = {};
    for (const o of optsRes.rows) if (o.is_correct) correctMap[o.question_id] = correctMap[o.question_id] || new Set(), correctMap[o.question_id].add(o.id);

    let correctCount = 0;
    // insert answers
    for (const a of answers){ const isCorrect = correctMap[a.question_id] && correctMap[a.question_id].has(a.option_id); if (isCorrect) correctCount++; await db.query('INSERT INTO assessment_answers (attempt_id,question_id,option_id,answer_text,is_correct,answered_at) VALUES ($1,$2,$3,$4,$5,now())', [attemptId,a.question_id,a.option_id||null,a.answer_text||null,!!isCorrect]); }

    // compute score
    const totalQuestions = qids.length || (await db.query('SELECT COUNT(*) FROM questions WHERE assessment_id = $1',[assessmentId])).rows[0].count;
    const scorePercent = totalQuestions ? (correctCount / totalQuestions) * 100 : 0;

    // compute per-skill scores
    const skillScores = {};
    // map question->skill
    const qMapRes = await db.query('SELECT id,skill_id FROM questions WHERE id = ANY($1)', [qids]);
    const qSkill = {}; for (const q of qMapRes.rows) qSkill[q.id] = q.skill_id;
    for (const a of answers){ const skillId = qSkill[a.question_id]; if (!skillId) continue; skillScores[skillId] = skillScores[skillId] || { correct:0, total:0 }; skillScores[skillId].total++; if (correctMap[a.question_id] && correctMap[a.question_id].has(a.option_id)) skillScores[skillId].correct++; }

    // insert skill scores and update user_skills proficiency
    for (const [skillId, stats] of Object.entries(skillScores)){
      const per = stats.total ? (stats.correct / stats.total) * 100 : 0;
      await db.query('INSERT INTO assessment_skill_scores (attempt_id, skill_id, score) VALUES ($1,$2,$3) ON CONFLICT (attempt_id, skill_id) DO UPDATE SET score = EXCLUDED.score', [attemptId, skillId, per]);
      // map percent to proficiency level ids: <50 -> 10, 50-79 ->20, >=80 ->30
      const level = per >= 80 ? 30 : (per >= 50 ? 20 : 10);
      // upsert user_skills
      const us = await db.query('SELECT id FROM user_skills WHERE user_id = $1 AND skill_id = $2', [userId, skillId]);
      if (us.rows[0]){
        await db.query('UPDATE user_skills SET proficiency=$1, created_at=COALESCE(created_at,now()) WHERE id = $2', [level, us.rows[0].id]);
      } else {
        await db.query('INSERT INTO user_skills (user_id, skill_id, proficiency, created_at) VALUES ($1,$2,$3,now())', [userId, skillId, level]);
      }
    }

    // finalize attempt
    await db.query('UPDATE assessment_attempts SET completed_at=now(), score=$1, status=$2 WHERE id=$3', [scorePercent, 'completed', attemptId]);

    // notify user that assessment completed
    try{ const { createNotification } = require('../utils/notifications'); await createNotification(userId, 'assessment_completed', 'Assessment completed', `Your assessment scored ${scorePercent.toFixed(2)}%`); } catch(e){ console.error('notify assessment failed', e); }

    return res.json({ totalQuestions, correctCount, scorePercent, skillScores });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
