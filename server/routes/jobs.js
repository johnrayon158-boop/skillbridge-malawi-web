const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public: list jobs with filters
router.get('/', async (req, res) => {
  try {
    const { q, location, type, company } = req.query;
    const params = [];
    const where = ['j.status = $1']; params.push('published');
    if (q) { params.push('%'+q+'%'); where.push(`(j.title ILIKE $${params.length} OR j.description ILIKE $${params.length})`); }
    if (location) { params.push(location); where.push(`j.location = $${params.length}`); }
    if (type) { params.push(type); where.push(`j.type = $${params.length}`); }
    if (company) { params.push(company); where.push(`c.name ILIKE $${params.length}`); }
    const sql = `SELECT j.id,j.title,j.description,j.location,j.type,j.min_experience,j.status,j.posted_at,j.deadline, c.name as company_name FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE ${where.join(' AND ')} ORDER BY j.posted_at DESC LIMIT 200`;
    const { rows } = await db.query(sql, params);
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Public: job detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT j.*, c.name as company_name, c.website as company_website FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE j.id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Employer: create job (draft by default)
router.post('/', authenticate, authorize(['employer','admin']), async (req, res) => {
  try {
    const userId = req.user.id;
    // get employer's company id
    const er = await db.query('SELECT company_id FROM employer_profiles WHERE user_id = $1', [userId]);
    const companyId = er.rows[0] && er.rows[0].company_id;
    const { title, description, type, location, salary_min, salary_max, deadline, required_education, required_skills, preferred_skills, experience_requirement, responsibilities, qualifications, duration, is_internship } = req.body;
    const status = req.body.status || 'draft';
    const insert = await db.query('INSERT INTO jobs (company_id,title,description,type,location,min_experience,status,posted_at,deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[companyId,title,description||null,type||null,location||null,experience_requirement||null,status, new Date(), deadline||null]);
    const job = insert.rows[0];
    // save skills into job_skills
    if (Array.isArray(required_skills)){
      for (const s of required_skills){
        const sr = await db.query('SELECT id FROM skills WHERE name = $1', [s]); if (sr.rows[0]) await db.query('INSERT INTO job_skills (job_id, skill_id, importance) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [job.id, sr.rows[0].id, 100]);
      }
    }
    if (Array.isArray(preferred_skills)){
      for (const s of preferred_skills){ const sr = await db.query('SELECT id FROM skills WHERE name = $1', [s]); if (sr.rows[0]) await db.query('INSERT INTO job_skills (job_id, skill_id, importance) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [job.id, sr.rows[0].id, 50]); }
    }
    return res.json({ job });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Employer: update job
router.put('/:id', authenticate, authorize(['employer','admin']), async (req, res) => {
  try {
    const userId = req.user.id; const id = req.params.id;
    // ensure job belongs to employer
    const j = await db.query('SELECT j.* FROM jobs j JOIN companies c ON j.company_id = c.id JOIN employer_profiles ep ON ep.company_id = c.id WHERE j.id = $1 AND ep.user_id = $2', [id,userId]);
    if (!j.rows[0]) return res.status(404).json({ error: 'Not found or not authorized' });
    const { title, description, type, location, salary_min, salary_max, deadline, required_skills, preferred_skills, experience_requirement, responsibilities, qualifications } = req.body;
    await db.query('UPDATE jobs SET title=$1,description=$2,type=$3,location=$4,min_experience=$5,deadline=$6 WHERE id=$7', [title,description,type,location,experience_requirement||null,deadline||null,id]);
    // update skills: simple approach delete existing and re-insert
    if (Array.isArray(required_skills) || Array.isArray(preferred_skills)){
      await db.query('DELETE FROM job_skills WHERE job_id = $1', [id]);
      if (Array.isArray(required_skills)){
        for (const s of required_skills){ const sr = await db.query('SELECT id FROM skills WHERE name = $1', [s]); if (sr.rows[0]) await db.query('INSERT INTO job_skills (job_id, skill_id, importance) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',[id,sr.rows[0].id,100]); }
      }
      if (Array.isArray(preferred_skills)){
        for (const s of preferred_skills){ const sr = await db.query('SELECT id FROM skills WHERE name = $1', [s]); if (sr.rows[0]) await db.query('INSERT INTO job_skills (job_id, skill_id, importance) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',[id,sr.rows[0].id,50]); }
      }
    }
    const updated = (await db.query('SELECT * FROM jobs WHERE id = $1', [id])).rows[0];
    return res.json({ job: updated });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Employer: publish job
router.post('/:id/publish', authenticate, authorize(['employer','admin']), async (req, res) => {
  try { const userId=req.user.id; const id=req.params.id; const r = await db.query('UPDATE jobs SET status=$1,posted_at=$2 WHERE id=$3 RETURNING *', ['published', new Date(), id]); if(!r.rows[0]) return res.status(404).json({ error:'Not found' }); return res.json({ job: r.rows[0] }); } catch(err){console.error(err);return res.status(500).json({ error:'Server error' }); }
});

// Employer: close job
router.post('/:id/close', authenticate, authorize(['employer','admin']), async (req, res) => { try{ const id=req.params.id; const r=await db.query('UPDATE jobs SET status=$1 WHERE id=$2 RETURNING *',['closed',id]); if(!r.rows[0]) return res.status(404).json({ error:'Not found' }); return res.json({ job: r.rows[0] }); }catch(err){console.error(err);return res.status(500).json({ error:'Server error' }); } });

// Employer: delete job
router.delete('/:id', authenticate, authorize(['employer','admin']), async (req, res) => { try{ const id=req.params.id; await db.query('DELETE FROM jobs WHERE id=$1', [id]); return res.json({ ok:true }); }catch(err){console.error(err);return res.status(500).json({ error:'Server error' }); } });

// Employer: view applicants for job
router.get('/:id/applicants', authenticate, authorize(['employer','admin']), async (req, res) => {
  try { const id=req.params.id; const rows = (await db.query('SELECT a.id, a.user_id, a.cover_letter, a.applied_at, u.email FROM applications a JOIN users u ON a.user_id = u.id WHERE a.job_id = $1', [id])).rows; return res.json(rows); } catch(err){console.error(err);return res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
