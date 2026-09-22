const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// List resources, optional filter by skill_id
router.get('/', async (req, res) => {
  try {
    const { skill_id, active } = req.query;
    let sql = 'SELECT lr.*, array_remove(array_agg(rs.skill_id), NULL) as skills FROM learning_resources lr LEFT JOIN resource_skills rs ON rs.resource_id = lr.id';
    const params = [];
    if (skill_id) { sql += ' WHERE lr.id IN (SELECT resource_id FROM resource_skills WHERE skill_id = $1)'; params.push(skill_id); }
    if (active === 'true') { if (!params.length) sql += ' WHERE lr.active = true'; else sql += ' AND lr.active = true'; }
    sql += ' GROUP BY lr.id ORDER BY lr.created_at DESC';
    const r = await db.query(sql, params);
    return res.json(r.rows);
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Get resource detail
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const r = await db.query('SELECT * FROM learning_resources WHERE id = $1', [id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    const skills = (await db.query('SELECT s.id, s.name FROM resource_skills rs JOIN skills s ON rs.skill_id = s.id WHERE rs.resource_id = $1', [id])).rows;
    return res.json({ resource: r.rows[0], skills });
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Admin: create resource
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try{
    const { title, description, provider, url, duration_minutes, kind, difficulty, active=true, skills=[] } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const ins = await db.query('INSERT INTO learning_resources (title, provider, url, duration_minutes, kind, description, created_at) VALUES ($1,$2,$3,$4,$5,$6,now()) RETURNING *', [title, provider||null, url||null, duration_minutes||null, kind||null, description||null]);
    const id = ins.rows[0].id;
    for (const s of skills){ await db.query('INSERT INTO resource_skills (resource_id, skill_id, relevance) VALUES ($1,$2,$3) ON CONFLICT (resource_id, skill_id) DO UPDATE SET relevance=EXCLUDED.relevance', [id, s.skill_id, s.relevance||50]); }
    return res.json(ins.rows[0]);
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// User: save resource
router.post('/:id/save', authenticate, async (req, res) => {
  try{
    const userId = req.user.id; const id = req.params.id; const { notes } = req.body;
    const up = await db.query('INSERT INTO user_resources (user_id, resource_id, status, notes, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now()) ON CONFLICT (user_id, resource_id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = now() RETURNING *', [userId, id, 'saved', notes||null]);
    return res.json(up.rows[0]);
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// User: mark completed
router.post('/:id/complete', authenticate, async (req, res) => {
  try{
    const userId = req.user.id; const id = req.params.id; const { notes } = req.body;
    const up = await db.query('INSERT INTO user_resources (user_id, resource_id, status, notes, created_at, updated_at) VALUES ($1,$2,$3,$4,now(),now()) ON CONFLICT (user_id, resource_id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = now() RETURNING *', [userId, id, 'completed', notes||null]);
    return res.json(up.rows[0]);
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Get user's saved/completed resources
router.get('/user/me', authenticate, async (req, res) => {
  try{
    const userId = req.user.id;
    const r = await db.query('SELECT ur.*, lr.title, lr.provider, lr.url FROM user_resources ur JOIN learning_resources lr ON ur.resource_id = lr.id WHERE ur.user_id = $1 ORDER BY ur.updated_at DESC', [userId]);
    return res.json(r.rows);
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
