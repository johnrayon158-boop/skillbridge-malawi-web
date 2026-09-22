const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// default weights
const DEFAULT_WEIGHTS = {
  academic_programme: 0.25,
  skills: 0.30,
  interests: 0.20,
  assessments: 0.15,
  preferences: 0.10
};

function clamp(v){ return Math.max(0, Math.min(1, v)); }

// utility to compute text token overlap
function tokenOverlapScore(a, b){
  if (!a || !b) return 0;
  const ta = a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const tb = b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (!ta.length || !tb.length) return 0;
  const setb = new Set(tb);
  const matched = ta.filter(t=>setb.has(t)).length;
  return matched / ta.length; // fraction of user tokens found in career text
}

// Recommend careers for authenticated user. Accept optional weights in body.
router.post('/recommend', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const weights = { ...DEFAULT_WEIGHTS, ...(req.body.weights || {}) };

    // fetch user profile, education, skills, assessments
    const profileR = await db.query('SELECT sp.* FROM student_profiles sp WHERE sp.user_id = $1', [userId]);
    const profile = profileR.rows[0] || {};

    const eduR = await db.query('SELECT ue.*, (select name from academic_programs where id=ue.program_id) as program_name FROM user_education ue WHERE ue.user_id = $1 ORDER BY start_date DESC', [userId]);
    const education = eduR.rows;

    const userSkillsR = await db.query('SELECT us.skill_id, s.name as skill_name, us.proficiency, us.verified FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId]);
    const userSkills = {};
    for (const r of userSkillsR.rows) userSkills[r.skill_id] = r;

    // assessment best scores per skill
    const assessR = await db.query(`SELECT ass.skill_id, MAX(ass.score) as best_score
      FROM assessment_skill_scores ass
      JOIN assessment_attempts a ON a.id = ass.attempt_id
      WHERE a.user_id = $1
      GROUP BY ass.skill_id`, [userId]);
    const assessMap = {};
    for (const r of assessR.rows) assessMap[r.skill_id] = parseFloat(r.best_score);

    // fetch careers linked explicitly to user's programs first, then fallback to all careers
    let careers = [];
    if (education.length){
      const progIds = education.map(e=>e.program_id).filter(Boolean);
      if (progIds.length){
        const q = `SELECT c.id,c.title,c.description, cc.name as category FROM careers c LEFT JOIN career_categories cc ON c.category_id = cc.id JOIN career_programs cp ON cp.career_id = c.id WHERE cp.program_id = ANY($1::uuid[])`;
        const r = await db.query(q, [progIds]); careers = r.rows;
      }
    }
    if (!careers.length){ const careersRes = await db.query('SELECT c.id,c.title,c.description, cc.name as category FROM careers c LEFT JOIN career_categories cc ON c.category_id = cc.id'); careers = careersRes.rows; }

    const results = [];

    for (const career of careers){
      // fetch career skills
      const cs = (await db.query('SELECT cs.skill_id, s.name as skill_name, COALESCE(cs.required_level,10) as required_level FROM career_skills cs JOIN skills s ON cs.skill_id = s.id WHERE cs.career_id = $1', [career.id])).rows;

      // Academic programme score: check if user's latest program_name or profile.programme overlaps with career title/description
      const userProgram = (education[0] && education[0].program_name) || profile.programme || '';
      const careerText = `${career.title} ${career.description || ''} ${career.category || ''}`;
      const academicScore = clamp(tokenOverlapScore(userProgram, careerText));

      // Skills score: average of min(effective/required,1) across career skills
      let skillRatios = [];
      const skillExplanations = [];
      for (const req of cs){
        const sid = req.skill_id; const reqLevel = req.required_level || 10;
        const declared = userSkills[sid] ? userSkills[sid].proficiency : null;
        const verified = userSkills[sid] ? !!userSkills[sid].verified : false;
        const assessPercent = assessMap[sid] || null;
        // map assessment percent to level ids (same mapping as skills_gap)
        let assessLevel = null;
        if (assessPercent !== null){ assessLevel = assessPercent >= 80 ? 30 : (assessPercent >=50 ? 20 : 10); }
        let effective = 0; let sources = [];
        if (verified && declared){ effective = declared; sources.push({type:'declared_verified', value:declared}); }
        else {
          if (declared){ effective = declared; sources.push({type:'declared', value:declared}); }
          if (assessLevel !== null && assessLevel > effective){ effective = assessLevel; sources.push({type:'assessment', mapped:assessLevel, percent:assessPercent}); }
        }
        const ratio = reqLevel ? Math.min(1, effective / reqLevel) : 0;
        skillRatios.push(ratio);
        skillExplanations.push({ skill_id: sid, skill_name: req.skill_name, required_level: reqLevel, declared, verified, assessPercent, assessLevel, effective, ratio });
      }
      const skillsScore = skillRatios.length ? (skillRatios.reduce((a,b)=>a+b,0)/skillRatios.length) : 0;

      // Interests score: based on token overlap of profile.career_interests with career text
      const interestsScore = clamp(tokenOverlapScore(profile.career_interests || '', careerText));

      // Assessments score: similar to skills but using raw assessment percent mapped relative to required
      let assessRatios = [];
      for (const req of cs){ const sid=req.skill_id; const assessPercent=assessMap[sid]||0; const assessLevel = assessPercent >= 80 ? 30 : (assessPercent >=50 ? 20 : 10); const r = req.required_level? Math.min(1, assessLevel / req.required_level):0; assessRatios.push(r); }
      const assessmentsScore = assessRatios.length ? (assessRatios.reduce((a,b)=>a+b,0)/assessRatios.length) : 0;

      // Preferences score: match preferred_industries or preferred_locations to career.category/title/desc
      let prefScore = 0;
      if (profile.preferred_industries){ prefScore = Math.max(prefScore, tokenOverlapScore(profile.preferred_industries, career.category || careerText)); }
      if (profile.preferred_locations){ prefScore = Math.max(prefScore, tokenOverlapScore(profile.preferred_locations, careerText)); }

      // Weighted sum
      const totalWeight = weights.academic_programme + weights.skills + weights.interests + weights.assessments + weights.preferences;
      const normalized = { academic: weights.academic_programme / totalWeight, skills: weights.skills / totalWeight, interests: weights.interests / totalWeight, assessments: weights.assessments / totalWeight, preferences: weights.preferences / totalWeight };

      const score = Math.round(100 * (normalized.academic * academicScore + normalized.skills * skillsScore + normalized.interests * interestsScore + normalized.assessments * assessmentsScore + normalized.preferences * prefScore));

      const explanation = {
        academicScore, skillsScore, interestsScore, assessmentsScore, prefScore, normalizedWeights: normalized, skill_details: skillExplanations
      };

      results.push({ career_id: career.id, career_title: career.title, career_category: career.category, score, explanation });
    }

    // sort by score desc
    results.sort((a,b)=>b.score-a.score);

    // persist top results to career_recommendations
    const now = new Date();
    for (const r of results.slice(0,10)){
      await db.query('INSERT INTO career_recommendations (user_id, career_id, score, computed_at, explanation) VALUES ($1,$2,$3,now(),$4)', [userId, r.career_id, r.score, r.explanation]);
    }

    return res.json({ recommendations: results.slice(0,10) });
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
