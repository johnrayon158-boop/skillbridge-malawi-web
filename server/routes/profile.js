const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Get full profile for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileRes = await db.query('SELECT u.id as user_id, u.email, sp.* FROM users u LEFT JOIN student_profiles sp ON u.id = sp.user_id WHERE u.id = $1', [userId]);
    const profile = profileRes.rows[0] || null;

    const edu = (await db.query('SELECT ue.*,(select name from institutions where id=ue.institution_id) as institution_name,(select name from academic_programs where id=ue.program_id) as program_name FROM user_education ue WHERE ue.user_id = $1 ORDER BY start_date DESC', [userId])).rows;

    const skills = (await db.query('SELECT us.id, s.id as skill_id, s.name as skill_name, us.proficiency, us.evidence_url, us.years_experience FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1 ORDER BY us.created_at DESC', [userId])).rows;

    const ex = (await db.query('SELECT * FROM user_experiences WHERE user_id = $1 ORDER BY start_date DESC', [userId])).rows;

    const certs = (await db.query('SELECT * FROM certificates WHERE user_id = $1 ORDER BY issued_date DESC', [userId])).rows;

    return res.json({ profile, education: edu, skills, experiences: ex, certificates: certs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Upsert basic profile info
router.put('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const fields = ['full_name','bio','location','phone','photo_url','career_interests','preferred_industries','preferred_locations','employment_type','career_goals','completion_percent'];
    const updates = [];
    const values = [userId];
    let idx = 2;
    fields.forEach(f=>{
      if (req.body[f] !== undefined) { updates.push(`${f} = $${idx}`); values.push(req.body[f]); idx++; }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    const sql = `INSERT INTO student_profiles (user_id, ${fields.filter(f=>req.body[f]!==undefined).join(',')}) VALUES ($1, ${values.slice(1).map((_,i)=>'$'+(i+2)).join(',')}) ON CONFLICT (user_id) DO UPDATE SET ${updates.join(',')}`;
    await db.query(sql, values);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Education CRUD
router.post('/education', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { institution, program, degree, start_date, end_date, notes } = req.body;
    // create institution if provided as name
    let institution_id = null;
    if (institution) {
      const r = await db.query('SELECT id FROM institutions WHERE name = $1', [institution]);
      if (r.rows[0]) institution_id = r.rows[0].id; else {
        const ins = await db.query('INSERT INTO institutions (name, location) VALUES ($1,$2) RETURNING id', [institution, null]);
        institution_id = ins.rows[0].id;
      }
    }
    let program_id = null;
    if (program && institution_id) {
      const p = await db.query('SELECT id FROM academic_programs WHERE institution_id = $1 AND name = $2', [institution_id, program]);
      if (p.rows[0]) program_id = p.rows[0].id; else {
        const np = await db.query('INSERT INTO academic_programs (institution_id, name) VALUES ($1,$2) RETURNING id', [institution_id, program]);
        program_id = np.rows[0].id;
      }
    }
    const insert = await db.query('INSERT INTO user_education (user_id, institution_id, program_id, start_date, end_date, degree, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [userId,institution_id,program_id,start_date || null,end_date || null,degree || null,notes || null]);
    return res.json({ education: insert.rows[0] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.put('/education/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; const id = req.params.id;
    const { start_date,end_date,degree,notes } = req.body;
    const upd = await db.query('UPDATE user_education SET start_date=$1,end_date=$2,degree=$3,notes=$4 WHERE id=$5 AND user_id=$6 RETURNING *', [start_date||null,end_date||null,degree||null,notes||null,id,userId]);
    if (!upd.rows[0]) return res.status(404).json({ error: 'Not found' });
    return res.json({ education: upd.rows[0] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.delete('/education/:id', authenticate, async (req, res) => {
  try { const userId=req.user.id; const id=req.params.id; await db.query('DELETE FROM user_education WHERE id=$1 AND user_id=$2', [id,userId]); return res.json({ ok: true }); } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Skills CRUD
router.post('/skills', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillName, categoryName, proficiency, years_experience, evidence_url } = req.body;
    if (!skillName) return res.status(400).json({ error: 'Missing skillName' });
    let category_id = null;
    if (categoryName) {
      const cr = await db.query('SELECT id FROM skill_categories WHERE name=$1', [categoryName]);
      if (cr.rows[0]) category_id = cr.rows[0].id; else {
        const ci = await db.query('INSERT INTO skill_categories (name) VALUES ($1) RETURNING id', [categoryName]); category_id = ci.rows[0].id;
      }
    }
    let skill_id = null;
    const sr = await db.query('SELECT id FROM skills WHERE name = $1', [skillName]);
    if (sr.rows[0]) skill_id = sr.rows[0].id; else {
      const si = await db.query('INSERT INTO skills (name,category_id) VALUES ($1,$2) RETURNING id', [skillName,category_id]); skill_id = si.rows[0].id;
    }
    const ins = await db.query('INSERT INTO user_skills (user_id, skill_id, proficiency, years_experience, evidence_url) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency=EXCLUDED.proficiency, years_experience=EXCLUDED.years_experience, evidence_url=EXCLUDED.evidence_url RETURNING *', [userId,skill_id,proficiency||null,years_experience||null,evidence_url||null]);
    return res.json({ skill: ins.rows[0] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.delete('/skills/:id', authenticate, async (req, res) => {
  try { const userId=req.user.id; const id=req.params.id; await db.query('DELETE FROM user_skills WHERE id=$1 AND user_id=$2', [id,userId]); return res.json({ ok: true }); } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Experiences CRUD
router.post('/experiences', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, organization, description, start_date, end_date } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const ins = await db.query('INSERT INTO user_experiences (user_id,title,organization,description,start_date,end_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [userId,title,organization||null,description||null,start_date||null,end_date||null]);
    return res.json({ experience: ins.rows[0] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.put('/experiences/:id', authenticate, async (req, res) => {
  try { const userId=req.user.id; const id=req.params.id; const { title,organization,description,start_date,end_date } = req.body; const u = await db.query('UPDATE user_experiences SET title=$1,organization=$2,description=$3,start_date=$4,end_date=$5 WHERE id=$6 AND user_id=$7 RETURNING *',[title,organization,description,start_date,end_date,id,userId]); if(!u.rows[0]) return res.status(404).json({error:'Not found'}); return res.json({ experience: u.rows[0] }); } catch(err){console.error(err);return res.status(500).json({ error: 'Server error' });}
});

router.delete('/experiences/:id', authenticate, async (req, res) => { try{ const userId=req.user.id; const id=req.params.id; await db.query('DELETE FROM user_experiences WHERE id=$1 AND user_id=$2',[id,userId]); return res.json({ ok:true }); } catch(err){console.error(err);return res.status(500).json({ error: 'Server error' }); } });

// Certificates CRUD (uses existing certificates table)
router.post('/certificates', authenticate, async (req, res) => {
  try { const userId=req.user.id; const { title, issuer, url, issued_date } = req.body; if(!title) return res.status(400).json({ error: 'Title required' }); const ins = await db.query('INSERT INTO certificates (user_id,title,issuer,url,issued_date) VALUES ($1,$2,$3,$4,$5) RETURNING *',[userId,title,issuer||null,url||null,issued_date||null]); return res.json({ certificate: ins.rows[0] }); } catch(err){console.error(err);return res.status(500).json({ error: 'Server error' }); }
});

router.put('/certificates/:id', authenticate, async (req, res) => { try{ const userId=req.user.id; const id=req.params.id; const { title,issuer,url,issued_date } = req.body; const u = await db.query('UPDATE certificates SET title=$1,issuer=$2,url=$3,issued_date=$4 WHERE id=$5 AND user_id=$6 RETURNING *',[title,issuer,url,issued_date,id,userId]); if(!u.rows[0]) return res.status(404).json({ error:'Not found' }); return res.json({ certificate: u.rows[0] }); } catch(err){console.error(err);return res.status(500).json({ error: 'Server error' }); } });

router.delete('/certificates/:id', authenticate, async (req, res) => { try{ const userId=req.user.id; const id=req.params.id; await db.query('DELETE FROM certificates WHERE id=$1 AND user_id=$2',[id,userId]); return res.json({ ok:true }); } catch(err){console.error(err);return res.status(500).json({ error: 'Server error' }); } });

module.exports = router;
