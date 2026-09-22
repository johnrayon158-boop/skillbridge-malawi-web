const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// list skills with optional category filter and search
router.get('/', async (req, res) => {
  try {
    const { q, category } = req.query;
    let sql = 'SELECT s.id, s.name, s.category_id, sc.name as category_name, s.created_at FROM skills s LEFT JOIN skill_categories sc ON s.category_id = sc.id';
    const params = [];
    const where = [];
    if (q) { params.push('%' + q + '%'); where.push(`s.name ILIKE $${params.length}`); }
    if (category) { params.push(category); where.push(`sc.name = $${params.length}`); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY s.name ASC LIMIT 500';
    const { rows } = await db.query(sql, params);
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT s.id, s.name, s.category_id, sc.name as category_name, s.created_at FROM skills s LEFT JOIN skill_categories sc ON s.category_id = sc.id WHERE s.id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// create skill (admin/authorized)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, categoryName } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    let category_id = null;
    if (categoryName) {
      const cr = await db.query('SELECT id FROM skill_categories WHERE name = $1', [categoryName]);
      if (cr.rows[0]) category_id = cr.rows[0].id; else {
        const ci = await db.query('INSERT INTO skill_categories (name) VALUES ($1) RETURNING id', [categoryName]); category_id = ci.rows[0].id;
      }
    }
    const ins = await db.query('INSERT INTO skills (name, category_id) VALUES ($1,$2) RETURNING *', [name, category_id]);
    return res.json(ins.rows[0]);
  } catch (err) { if(err.code==='23505') return res.status(400).json({ error:'Already exists' }); console.error(err); return res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
