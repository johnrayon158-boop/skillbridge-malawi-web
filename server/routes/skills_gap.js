const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: map percent to proficiency level id
function percentToLevel(percent){
  if (percent >= 80) return 30;
  if (percent >= 50) return 20;
  return 10;
}

// Compute skills gap for authenticated user vs career
router.get('/:careerId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; const careerId = req.params.careerId;
    // fetch career required skills
    const careerSkills = (await db.query('SELECT cs.skill_id, s.name as skill_name, COALESCE(cs.required_level,10) as required_level FROM career_skills cs JOIN skills s ON cs.skill_id = s.id WHERE cs.career_id = $1 ORDER BY cs.importance DESC', [careerId])).rows;

    if (!careerSkills.length) return res.status(404).json({ error: 'Career not found or has no skills' });

    const skillIds = careerSkills.map(s=>s.skill_id);

    // fetch declared user skills
    const declaredRes = await db.query('SELECT us.skill_id, us.proficiency, us.verified, us.years_experience FROM user_skills us WHERE us.user_id = $1 AND us.skill_id = ANY($2)', [userId, skillIds]);
    const declaredMap = {};
    for (const r of declaredRes.rows) declaredMap[r.skill_id] = r;

    // fetch best assessment skill scores for this user across attempts
    const assessRes = await db.query(`SELECT ass.skill_id, MAX(ass.score) as best_score
      FROM assessment_skill_scores ass
      JOIN assessment_attempts a ON a.id = ass.attempt_id
      WHERE a.user_id = $1 AND ass.skill_id = ANY($2)
      GROUP BY ass.skill_id`, [userId, skillIds]);
    const assessMap = {};
    for (const r of assessRes.rows) assessMap[r.skill_id] = parseFloat(r.best_score);

    // learning resources for skills
    const resourcesRes = await db.query('SELECT rs.skill_id, lr.id, lr.title, lr.provider, lr.url, rs.relevance FROM resource_skills rs JOIN learning_resources lr ON rs.resource_id = lr.id WHERE rs.skill_id = ANY($1) ORDER BY rs.relevance DESC LIMIT 5', [skillIds]);
    const resourcesMap = {};
    for (const r of resourcesRes.rows){ resourcesMap[r.skill_id] = resourcesMap[r.skill_id]||[]; resourcesMap[r.skill_id].push(r); }

    // compute per-skill effective proficiency and classification
    const matched = [], partial = [], missing = [];
    const details = [];

    let totalScoreRatio = 0;
    for (const cs of careerSkills){
      const sid = cs.skill_id; const sname = cs.skill_name; const req = cs.required_level || 10;
      const declared = declaredMap[sid] ? declaredMap[sid].proficiency : null;
      const verified = declaredMap[sid] ? !!declaredMap[sid].verified : false;
      const years = declaredMap[sid] ? declaredMap[sid].years_experience : null;
      const assessPercent = assessMap[sid] || null;
      const assessLevel = assessPercent!==null ? percentToLevel(assessPercent) : null;

      // effective: prefer verified declared, otherwise max(declared, assessLevel)
      let effective = 0; let source = [];
      if (verified && declared) { effective = declared; source.push({type:'declared_verified', value:declared}); }
      else {
        if (declared){ effective = declared; source.push({type:'declared', value:declared}); }
        if (assessLevel){ if (assessLevel > effective) { effective = assessLevel; } source.push({type:'assessment', percent:assessPercent, mapped:assessLevel}); }
      }

      // classification
      const ratio = req ? Math.min(1, effective / req) : 0; // 0..1
      totalScoreRatio += ratio;

      const recs = resourcesMap[sid] || [];

      const note = [];
      if (verified) note.push('Skill marked verified by platform admin');
      if (declared) note.push(`User-declared proficiency: ${declared}`);
      if (assessPercent!==null) note.push(`Best assessment score: ${assessPercent}% mapped to level ${assessLevel}`);
      if (!declared && assessPercent===null) note.push('No evidence (declaration or assessment) found');

      const item = { skill_id: sid, skill_name: sname, required_level: req, declared_proficiency: declared, verified: verified, assessment_percent: assessPercent, assessment_mapped: assessLevel, effective_proficiency: effective, ratio: ratio, resources: recs, notes: note };
      details.push(item);

      if (effective >= req) matched.push(item);
      else if (effective > 0) partial.push(item);
      else missing.push(item);
    }

    const readiness = careerSkills.length ? Math.round((totalScoreRatio / careerSkills.length) * 100) : 0;

    const result = { user_id: userId, career_id: careerId, readiness_percent: readiness, counts: { matched: matched.length, partial: partial.length, missing: missing.length }, matched: matched.map(s=>({ skill_id:s.skill_id, skill_name:s.skill_name })), partially_matched: partial.map(s=>({ skill_id:s.skill_id, skill_name:s.skill_name })), missing: missing.map(s=>({ skill_id:s.skill_id, skill_name:s.skill_name, resources: s.resources })), details };

    // store in skills_gap_results
    await db.query('INSERT INTO skills_gap_results (user_id, career_id, gap, computed_at) VALUES ($1,$2,$3,now())', [userId, careerId, result]);

    // notify user
    try{ const { createNotification } = require('../utils/notifications'); await createNotification(userId, 'skills_gap_updated', 'Skills gap updated', `Your skills gap analysis for career ${careerId} is ready.`); } catch(e){ console.error('notify skills gap failed', e); }

    return res.json(result);
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
