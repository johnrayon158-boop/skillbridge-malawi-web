const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// List careers with optional search/category
router.get('/', async (req, res) => {
  try {
    const { q, category } = req.query;
    let sql = `SELECT c.id, c.title, c.category_id, cc.name as category_name, c.description FROM careers c LEFT JOIN career_categories cc ON c.category_id = cc.id`;
    const params = []; const where = [];
    if (q) { params.push('%'+q+'%'); where.push(`c.title ILIKE $${params.length} OR c.description ILIKE $${params.length}`); }
    if (category) { params.push(category); where.push(`cc.name = $${params.length}`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY c.title ASC LIMIT 500';
    const { rows } = await db.query(sql, params);
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Get career details including required and preferred skills
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const careerRes = await db.query('SELECT c.id,c.title,c.description,c.category_id,cc.name as category_name FROM careers c LEFT JOIN career_categories cc ON c.category_id = cc.id WHERE c.id = $1', [id]);
    if (!careerRes.rows[0]) return res.status(404).json({ error: 'Not found' });
    const career = careerRes.rows[0];
    const skills = (await db.query('SELECT cs.id, s.id as skill_id, s.name as skill_name, cs.required_level, cs.importance FROM career_skills cs JOIN skills s ON cs.skill_id = s.id WHERE cs.career_id = $1 ORDER BY cs.importance DESC', [id])).rows;
    const related = (await db.query('SELECT rc.related_career_id, c2.title FROM (SELECT career_id, skill_id FROM career_skills WHERE career_id = $1) base JOIN career_skills cs2 ON base.skill_id = cs2.skill_id AND cs2.career_id != $1 JOIN careers c2 ON c2.id = cs2.career_id GROUP BY rc.related_career_id, c2.title, base.career_id, cs2.career_id', [id]).catch(()=>({ rows: [] }))).rows;
    return res.json({ career, skills, related: related.length?related:[] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Create career (admin)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { title, categoryName, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    let category_id = null;
    if (categoryName) {
      const r = await db.query('SELECT id FROM career_categories WHERE name = $1', [categoryName]);
      if (r.rows[0]) category_id = r.rows[0].id; else {
        const ci = await db.query('INSERT INTO career_categories (name) VALUES ($1) RETURNING id', [categoryName]); category_id = ci.rows[0].id;
      }
    }
    const ins = await db.query('INSERT INTO careers (title, category_id, description) VALUES ($1,$2,$3) RETURNING *', [title, category_id, description||null]);
    return res.json(ins.rows[0]);
  } catch (err) { if(err.code==='23505') return res.status(400).json({ error:'Already exists' }); console.error(err); return res.status(500).json({ error:'Server error' }); }
});

// Add skill requirement to career (admin)
router.post('/:id/skills', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const careerId = req.params.id;
    const { skillName, required_level, importance } = req.body;
    if (!skillName) return res.status(400).json({ error: 'Missing skillName' });
    const s = await db.query('SELECT id FROM skills WHERE name = $1', [skillName]);
    if (!s.rows[0]) return res.status(400).json({ error: 'Skill not found' });
    const skillId = s.rows[0].id;
    const ins = await db.query('INSERT INTO career_skills (career_id, skill_id, required_level, importance) VALUES ($1,$2,$3,$4) ON CONFLICT (career_id, skill_id) DO UPDATE SET required_level=EXCLUDED.required_level, importance=EXCLUDED.importance RETURNING *', [careerId, skillId, required_level||null, importance||50]);
    return res.json(ins.rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
