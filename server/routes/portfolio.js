const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Create project
router.post('/', authenticate, async (req, res) => {
  try{
    const userId = req.user.id;
    const { title, description, technologies, skills, images, url, github_url, completion_date, role, outcome, published } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const ins = await db.query('INSERT INTO projects (user_id, title, description, url, created_at, technologies, images, github_url, completion_date, role, outcome, published) VALUES ($1,$2,$3,$4,now(),$5,$6,$7,$8,$9,$10,$11) RETURNING *', [userId, title, description||null, url||null, technologies||null, images? JSON.stringify(images):null, github_url||null, completion_date||null, role||null, outcome||null, published||false]);
    const project = ins.rows[0];
    if (Array.isArray(skills)){
      for (const s of skills){ await db.query('INSERT INTO project_skills (project_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [project.id, s]); }
    }
    return res.json({ project });
  }catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Update project
router.put('/:id', authenticate, async (req, res) => {
  try{
    const userId = req.user.id; const id = req.params.id;
    const { title, description, technologies, skills, images, url, github_url, completion_date, role, outcome, published } = req.body;
    const p = await db.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [id,userId]);
    if (!p.rows[0]) return res.status(404).json({ error: 'Not found' });
    await db.query('UPDATE projects SET title=$1, description=$2, url=$3, technologies=$4, images=$5, github_url=$6, completion_date=$7, role=$8, outcome=$9, published=$10 WHERE id=$11', [title||p.rows[0].title, description||p.rows[0].description, url||p.rows[0].url, technologies||p.rows[0].technologies, images? JSON.stringify(images):p.rows[0].images, github_url||p.rows[0].github_url, completion_date||p.rows[0].completion_date, role||p.rows[0].role, outcome||p.rows[0].outcome, published!==undefined?published:p.rows[0].published, id]);
    if (Array.isArray(skills)){
      await db.query('DELETE FROM project_skills WHERE project_id = $1', [id]);
      for (const s of skills){ await db.query('INSERT INTO project_skills (project_id, skill_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, s]); }
    }
    const updated = (await db.query('SELECT * FROM projects WHERE id = $1', [id])).rows[0];
    return res.json({ project: updated });
  }catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Delete project
router.delete('/:id', authenticate, async (req, res) => {
  try{ const userId = req.user.id; const id = req.params.id; await db.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id,userId]); return res.json({ ok: true }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Publish/unpublish
router.post('/:id/publish', authenticate, async (req, res) => {
  try{ const userId=req.user.id; const id=req.params.id; const { publish } = req.body; const p = await db.query('SELECT * FROM projects WHERE id=$1 AND user_id=$2',[id,userId]); if(!p.rows[0]) return res.status(404).json({ error: 'Not found' }); await db.query('UPDATE projects SET published=$1 WHERE id=$2',[!!publish,id]); const updated=(await db.query('SELECT * FROM projects WHERE id=$1',[id])).rows[0]; return res.json({ project: updated }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Get my projects
router.get('/me', authenticate, async (req, res) => {
  try{ const userId=req.user.id; const projects=(await db.query('SELECT * FROM projects WHERE user_id=$1 ORDER BY created_at DESC',[userId])).rows; return res.json(projects); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Public portfolio view
router.get('/public/:userId', async (req, res) => {
  try{
    const userId = req.params.userId;
    const user = (await db.query('SELECT u.id,u.email,sp.full_name,sp.programme,sp.institution,sp.bio,sp.location,sp.career_interests,sp.preferred_industries,sp.preferred_locations FROM users u LEFT JOIN student_profiles sp ON u.id = sp.user_id WHERE u.id = $1',[userId])).rows[0];
    if(!user) return res.status(404).json({ error: 'User not found' });
    const education = (await db.query('SELECT ue.*,(select name from institutions where id=ue.institution_id) as institution_name,(select name from academic_programs where id=ue.program_id) as program_name FROM user_education ue WHERE ue.user_id = $1 ORDER BY start_date DESC', [userId])).rows;
    const skills = (await db.query('SELECT us.proficiency,us.verified, s.id as skill_id, s.name as skill_name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId])).rows;
    const experiences = (await db.query('SELECT * FROM user_experiences WHERE user_id=$1 ORDER BY start_date DESC',[userId])).rows;
    const certificates = (await db.query('SELECT * FROM certificates WHERE user_id=$1 ORDER BY issued_date DESC',[userId])).rows;
    const projects = (await db.query(`SELECT p.*, (SELECT json_agg(json_build_object('id', ps.skill_id, 'name', s.name)) FROM project_skills ps JOIN skills s ON ps.skill_id=s.id WHERE ps.project_id = p.id) as skills FROM projects p WHERE p.user_id=$1 AND p.published = true ORDER BY p.created_at DESC`,[userId])).rows;
    // assessment summary: average score across attempts
    const assessments = (await db.query('SELECT AVG(a.score) as avg_score, COUNT(a.*) as attempts FROM assessment_attempts a WHERE a.user_id = $1',[userId])).rows[0];
    return res.json({ user, education, skills, experiences, certificates, projects, assessments });
  } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
