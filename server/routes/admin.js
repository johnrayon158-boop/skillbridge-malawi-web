const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticate, authorize(['admin']), async (req, res) => {
  try{
    const counts = {};
    const r1 = await db.query('SELECT COUNT(*) FROM users'); counts.total_users = parseInt(r1.rows[0].count,10);
    const r2 = await db.query("SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'student'"); counts.students = parseInt(r2.rows[0].count,10);
    const r3 = await db.query("SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'graduate'"); counts.graduates = parseInt(r3.rows[0].count,10);
    const r4 = await db.query("SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'employer'"); counts.employers = parseInt(r4.rows[0].count,10);
    const r5 = await db.query("SELECT COUNT(*) FROM jobs WHERE status = 'published'"); counts.jobs = parseInt(r5.rows[0].count,10);
    const r6 = await db.query("SELECT COUNT(*) FROM jobs WHERE type ILIKE 'Internship'"); counts.internships = parseInt(r6.rows[0].count,10);
    const r7 = await db.query('SELECT COUNT(*) FROM applications'); counts.applications = parseInt(r7.rows[0].count,10);
    const r8 = await db.query('SELECT COUNT(*) FROM assessments'); counts.assessments = parseInt(r8.rows[0].count,10);
    const r9 = await db.query('SELECT COUNT(*) FROM careers'); counts.active_careers = parseInt(r9.rows[0].count,10);
    const r10 = await db.query('SELECT COUNT(*) FROM skills'); counts.skills = parseInt(r10.rows[0].count,10);
    return res.json(counts);
  } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Users: list, search, filter by role
router.get('/users', authenticate, authorize(['admin']), async (req,res)=>{
  try{
    const q = (req.query.q||'').trim(); const role = req.query.role || null; const params = [];
    let sql = `SELECT u.id,u.email,u.status,u.created_at, r.name as role FROM users u JOIN roles r ON u.role_id = r.id`;
    const where = [];
    if (role){ params.push(role); where.push(`r.name = $${params.length}`); }
    if (q){ params.push(`%${q}%`); where.push(`(u.email ILIKE $${params.length})`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY u.created_at DESC LIMIT 200';
    const rows = (await db.query(sql, params)).rows;
    return res.json(rows);
  } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/users/:id/activate', authenticate, authorize(['admin']), async (req,res)=>{
  try{ const id = req.params.id; await db.query("UPDATE users SET status='active', updated_at=now() WHERE id=$1",[id]); return res.json({ ok:true }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/users/:id/deactivate', authenticate, authorize(['admin']), async (req,res)=>{
  try{ const id = req.params.id; await db.query("UPDATE users SET status='inactive', updated_at=now() WHERE id=$1",[id]); return res.json({ ok:true }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Employers
router.get('/employers', authenticate, authorize(['admin']), async (req,res)=>{
  try{ const rows = (await db.query('SELECT ep.user_id, ep.company_id, c.name as company_name, u.email, ep.title, ep.created_at FROM employer_profiles ep JOIN users u ON ep.user_id = u.id LEFT JOIN companies c ON ep.company_id = c.id ORDER BY ep.created_at DESC LIMIT 200')).rows; return res.json(rows);}catch(err){console.error(err);return res.status(500).json({error:'Server error'});}
});

router.post('/employers/:companyId/approve', authenticate, authorize(['admin']), async (req,res)=>{
  try{ const cid = req.params.companyId; await db.query('UPDATE companies SET verified = true WHERE id = $1',[cid]); return res.json({ ok:true }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/employers/:companyId/reject', authenticate, authorize(['admin']), async (req,res)=>{
  try{ const cid = req.params.companyId; await db.query('UPDATE companies SET verified = false WHERE id = $1',[cid]); return res.json({ ok:true }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Careers CRUD
router.get('/careers', authenticate, authorize(['admin']), async (req,res)=>{ try{ const rows=(await db.query('SELECT * FROM careers ORDER BY created_at DESC')).rows; return res.json(rows);}catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.post('/careers', authenticate, authorize(['admin']), async (req,res)=>{ try{ const { title, category_id, description } = req.body; const r = await db.query('INSERT INTO careers (title, category_id, description, created_at) VALUES ($1,$2,$3,now()) RETURNING *',[title||null, category_id||null, description||null]); return res.json(r.rows[0]); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.put('/careers/:id', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; const { title, category_id, description }=req.body; await db.query('UPDATE careers SET title=$1, category_id=$2, description=$3, created_at=now() WHERE id=$4',[title||null,category_id||null,description||null,id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.delete('/careers/:id', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; await db.query('DELETE FROM careers WHERE id=$1',[id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });

// Skills CRUD
router.get('/skills', authenticate, authorize(['admin']), async (req,res)=>{ try{ const rows=(await db.query('SELECT s.*, sc.name as category_name FROM skills s LEFT JOIN skill_categories sc ON s.category_id = sc.id ORDER BY s.name')).rows; return res.json(rows);}catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.post('/skills', authenticate, authorize(['admin']), async (req,res)=>{ try{ const { name, category_id } = req.body; const r = await db.query('INSERT INTO skills (name, category_id, created_at) VALUES ($1,$2,now()) RETURNING *',[name, category_id||null]); return res.json(r.rows[0]); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.put('/skills/:id', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; const { name, category_id }=req.body; await db.query('UPDATE skills SET name=$1, category_id=$2 WHERE id=$3',[name, category_id||null, id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.delete('/skills/:id', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; await db.query('DELETE FROM skills WHERE id=$1',[id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });

// Assessments: list, publish/unpublish
router.get('/assessments', authenticate, authorize(['admin']), async (req,res)=>{ try{ const rows=(await db.query('SELECT * FROM assessments ORDER BY created_at DESC')).rows; return res.json(rows);}catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.post('/assessments/:id/publish', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; await db.query("UPDATE assessments SET created_at = now() WHERE id=$1",[id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });

// Learning resources CRUD
router.get('/resources', authenticate, authorize(['admin']), async (req,res)=>{ try{ const rows=(await db.query('SELECT * FROM learning_resources ORDER BY created_at DESC')).rows; return res.json(rows);}catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.post('/resources', authenticate, authorize(['admin']), async (req,res)=>{ try{ const { title, provider, url, kind, duration_minutes } = req.body; const r = await db.query('INSERT INTO learning_resources (title, provider, url, kind, duration_minutes, created_at) VALUES ($1,$2,$3,$4,$5,now()) RETURNING *',[title,provider,url,kind,duration_minutes||null]); return res.json(r.rows[0]); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.put('/resources/:id', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; const { title, provider, url, kind, duration_minutes }=req.body; await db.query('UPDATE learning_resources SET title=$1, provider=$2, url=$3, kind=$4, duration_minutes=$5 WHERE id=$6',[title,provider,url,kind,duration_minutes||null,id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.delete('/resources/:id', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; await db.query('DELETE FROM learning_resources WHERE id=$1',[id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });

// Job moderation
router.get('/jobs/pending', authenticate, authorize(['admin']), async (req,res)=>{ try{ const rows=(await db.query("SELECT j.*, c.name as company_name FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE j.status <> 'published' ORDER BY j.posted_at DESC")).rows; return res.json(rows);}catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.post('/jobs/:id/approve', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; await db.query("UPDATE jobs SET status='published', posted_at=now() WHERE id=$1",[id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.post('/jobs/:id/reject', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; await db.query("UPDATE jobs SET status='draft' WHERE id=$1",[id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });
router.post('/jobs/:id/close', authenticate, authorize(['admin']), async (req,res)=>{ try{ const id=req.params.id; await db.query("UPDATE jobs SET status='closed' WHERE id=$1",[id]); return res.json({ ok:true }); }catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });

// Reports: simple aggregates
router.get('/reports/users', authenticate, authorize(['admin']), async (req,res)=>{ try{ const rows=(await db.query("SELECT r.name as role, COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id GROUP BY r.name")).rows; return res.json(rows);}catch(e){console.error(e);return res.status(500).json({error:'Server error'});} });

module.exports = router;
