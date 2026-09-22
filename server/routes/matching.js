const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

function tokenOverlapScore(a,b){ if(!a||!b) return 0; const ta=a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); const tb=new Set(b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)); if(!ta.length) return 0; const matched = ta.filter(t=>tb.has(t)).length; return matched/ta.length; }

function percentToLevel(percent){ if(percent>=80) return 30; if(percent>=50) return 20; return 10; }

// Compute match for a single candidate against a job
async function computeMatchForCandidate(job, jobSkills, candidateId){
  // gather candidate data
  const userR = (await db.query('SELECT u.id,u.email,sp.full_name,sp.programme,sp.career_interests,sp.preferred_locations,sp.preferred_industries FROM users u LEFT JOIN student_profiles sp ON u.id = sp.user_id WHERE u.id = $1',[candidateId])).rows[0];
  const userSkillsRes = await db.query('SELECT us.skill_id, s.name as skill_name, us.proficiency, us.years_experience, us.verified FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1',[candidateId]);
  const userSkillsMap = {}; for (const r of userSkillsRes.rows) userSkillsMap[r.skill_id]=r;
  const assessRes = await db.query(`SELECT ass.skill_id, MAX(ass.score) as best_score FROM assessment_skill_scores ass JOIN assessment_attempts a ON a.id = ass.attempt_id WHERE a.user_id = $1 GROUP BY ass.skill_id`, [candidateId]);
  const assessMap = {}; for (const r of assessRes.rows) assessMap[r.skill_id]=parseFloat(r.best_score);
  const projectsRes = await db.query('SELECT p.id, p.title, (SELECT array_agg(ps.skill_id) FROM project_skills ps WHERE ps.project_id = p.id) as skills FROM projects p WHERE p.user_id = $1 AND p.published = true', [candidateId]);
  const projectSkills = []; for (const p of projectsRes.rows) if (p.skills) projectSkills.push(...p.skills);
  const experiencesRes = await db.query('SELECT years_experience FROM user_skills us WHERE us.user_id = $1', [candidateId]);
  const totalYears = experiencesRes.rows.reduce((s,r)=>s+(r.years_experience||0),0);

  // Component computations
  const requiredSkillIds = jobSkills.map(js=>js.skill_id);

  // 1. required skill overlap: fraction of job skills present (declared or assessment)
  let matchedCount = 0; for (const js of jobSkills){ const sid=js.skill_id; const declared = userSkillsMap[sid] ? userSkillsMap[sid].proficiency : null; const assess = assessMap[sid] || null; if (declared || assess) matchedCount++; }
  const skillOverlap = jobSkills.length? matchedCount / jobSkills.length : 0;

  // 2. proficiency: average of effective/required
  let ratios = [];
  const skillDetails = [];
  for (const js of jobSkills){ const sid=js.skill_id; const req = js.importance? js.importance : js.required_level || 10; const declared = userSkillsMap[sid] ? userSkillsMap[sid].proficiency : null; const verified = userSkillsMap[sid] ? !!userSkillsMap[sid].verified : false; const assessPercent = assessMap[sid]||null; const assessLevel = assessPercent!==null? percentToLevel(assessPercent):null; let effective=0; if (verified && declared){ effective=declared; } else { if (declared) effective=declared; if (assessLevel && assessLevel>effective) effective=assessLevel; } const ratio = req? Math.min(1, effective / req):0; ratios.push(ratio); skillDetails.push({ skill_id:sid, skill_name: js.skill_name, required_level: req, declared, verified, assessPercent, assessLevel, effective, ratio }); }
  const proficiencyScore = ratios.length? (ratios.reduce((a,b)=>a+b,0)/ratios.length):0;

  // 3. education compatibility
  const educationScore = tokenOverlapScore((userR && userR.programme) || '', `${job.title} ${job.description||''}`);

  // 4. assessment results: average mapped assessment ratio similar to proficiency
  const assessRatios = []; for (const js of jobSkills){ const sid=js.skill_id; const ap = assessMap[sid]||0; const al = percentToLevel(ap); const req = js.required_level||10; assessRatios.push(req? Math.min(1, al/req):0); }
  const assessmentScore = assessRatios.length? (assessRatios.reduce((a,b)=>a+b,0)/assessRatios.length):0;

  // 5. portfolio evidence: fraction of job skills represented in published projects
  const projSet = new Set(projectSkills || []); let projMatch=0; for (const sid of requiredSkillIds) if (projSet.has(sid)) projMatch++; const portfolioScore = requiredSkillIds.length? (projMatch / requiredSkillIds.length) : 0;

  // 6. experience: map totalYears to a 0..1 via simple sigmoid-ish scaling, cap at 10 years
  const experienceScore = Math.min(1, totalYears / 5);

  // 7. preferences: location/type match (simple token overlap)
  const prefText = `${userR && userR.preferred_locations||''} ${userR && userR.preferred_industries||''}`;
  const prefScore = tokenOverlapScore(prefText, `${job.title} ${job.description||''} ${job.location||''}`);

  // weights (configurable later)
  const weights = { skillOverlap: 0.30, proficiency: 0.25, education: 0.10, assessment: 0.15, portfolio: 0.10, experience: 0.05, preferences: 0.05 };
  const total = (weights.skillOverlap*skillOverlap + weights.proficiency*proficiencyScore + weights.education*educationScore + weights.assessment*assessmentScore + weights.portfolio*portfolioScore + weights.experience*experienceScore + weights.preferences*prefScore);
  const score = Math.round(total * 100);

  const explanation = { skillOverlap, proficiencyScore, educationScore, assessmentScore, portfolioScore, experienceScore, prefScore, weights, skillDetails };

  return { candidateId, score, explanation, candidate: userR };
}

// Student: get match for self vs job
router.get('/job/:jobId/self', authenticate, async (req, res) => {
  try{
    const userId = req.user.id; const jobId = req.params.jobId;
    const job = (await db.query('SELECT * FROM jobs WHERE id = $1',[jobId])).rows[0]; if(!job) return res.status(404).json({ error: 'Job not found' });
    const jobSkills = (await db.query('SELECT js.skill_id, s.name as skill_name, js.importance, js.required_level FROM job_skills js JOIN skills s ON js.skill_id = s.id WHERE js.job_id = $1',[jobId])).rows;
    const result = await computeMatchForCandidate(job, jobSkills, userId);
    // store
    await db.query('INSERT INTO job_match_results (user_id, job_id, score, computed_at, explanation) VALUES ($1,$2,$3,now(),$4)', [userId, jobId, result.score, result.explanation]);
    return res.json(result);
  } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Employer: get recommended candidates (applicants) for a job
router.get('/job/:jobId/recommendations', authenticate, authorize(['employer','admin']), async (req, res) => {
  try{
    const jobId = req.params.jobId;
    const job = (await db.query('SELECT * FROM jobs WHERE id = $1',[jobId])).rows[0]; if(!job) return res.status(404).json({ error: 'Job not found' });
    // get applicants
    const apps = (await db.query('SELECT user_id FROM applications WHERE job_id = $1',[jobId])).rows;
    const jobSkills = (await db.query('SELECT js.skill_id, s.name as skill_name, js.importance, js.required_level FROM job_skills js JOIN skills s ON js.skill_id = s.id WHERE js.job_id = $1',[jobId])).rows;
    const results = [];
    for (const a of apps){ const r = await computeMatchForCandidate(job, jobSkills, a.user_id); results.push(r); }
    results.sort((x,y)=>y.score-x.score);
    // persist top N
    for (const r of results.slice(0,20)){ await db.query('INSERT INTO job_match_results (user_id, job_id, score, computed_at, explanation) VALUES ($1,$2,$3,now(),$4)', [r.candidateId, jobId, r.score, r.explanation]); }
    // notify employer user(s) that recommendations were computed
    try{
      const jobOwner = (await db.query('SELECT j.company_id FROM jobs j WHERE j.id=$1',[jobId])).rows[0];
      if (jobOwner && jobOwner.company_id){ const owners = (await db.query('SELECT user_id FROM employer_profiles WHERE company_id=$1',[jobOwner.company_id])).rows; const { createNotification } = require('../utils/notifications'); for (const o of owners){ await createNotification(o.user_id, 'candidate_recommendations', 'Candidate recommendations ready', `Recommendations for job ${job.title} are available.`); } }
    } catch(e){ console.error('notify employers recommendations failed', e); }
    return res.json({ job_id: jobId, recommendations: results });
  } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Employer: view candidate detail and explanation
router.get('/job/:jobId/candidate/:candidateId', authenticate, authorize(['employer','admin']), async (req, res) => {
  try{
    const { jobId, candidateId } = req.params;
    const job = (await db.query('SELECT * FROM jobs WHERE id = $1',[jobId])).rows[0]; if(!job) return res.status(404).json({ error: 'Job not found' });
    const jobSkills = (await db.query('SELECT js.skill_id, s.name as skill_name, js.importance, js.required_level FROM job_skills js JOIN skills s ON js.skill_id = s.id WHERE js.job_id = $1',[jobId])).rows;
    const match = await computeMatchForCandidate(job, jobSkills, candidateId);
    // include profile details
    const profile = (await db.query('SELECT u.id,u.email,sp.* FROM users u LEFT JOIN student_profiles sp ON u.id = sp.user_id WHERE u.id = $1',[candidateId])).rows[0];
    const skills = (await db.query('SELECT us.*, s.name as skill_name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1',[candidateId])).rows;
    const assessments = (await db.query('SELECT a.* FROM assessment_attempts a WHERE a.user_id = $1 ORDER BY a.started_at DESC',[candidateId])).rows;
    const projects = (await db.query('SELECT p.* FROM projects p WHERE p.user_id = $1 AND p.published = true',[candidateId])).rows;
    const education = (await db.query('SELECT ue.*,(select name from academic_programs where id=ue.program_id) as program_name FROM user_education ue WHERE ue.user_id = $1',[candidateId])).rows;
    const experience = (await db.query('SELECT * FROM user_experiences WHERE user_id = $1',[candidateId])).rows;
    return res.json({ match, profile, skills, assessments, projects, education, experience });
  } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
