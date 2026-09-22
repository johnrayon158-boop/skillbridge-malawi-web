const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get employer's profile (for authenticated employer)
router.get('/me', authenticate, authorize(['employer','admin']), async (req, res) => {
  try {
    const userId = req.user.id;
    const r = await db.query('SELECT ep.*, c.name as company_name, c.website, c.location as company_location, c.description as company_description, c.id as company_id, c.logo as company_logo, c.email as company_email, c.phone as company_phone, c.size as company_size FROM employer_profiles ep LEFT JOIN companies c ON ep.company_id = c.id WHERE ep.user_id = $1', [userId]);
    const row = r.rows[0] || null;
    return res.json(row);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Upsert employer profile and company
router.put('/me', authenticate, authorize(['employer','admin']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyName, logo, description, industry, location, website, email, phone, size, title } = req.body;
    // create or update company
    let companyId = null;
    if (companyName) {
      const cr = await db.query('SELECT id FROM companies WHERE name = $1', [companyName]);
      if (cr.rows[0]) {
        companyId = cr.rows[0].id;
        await db.query('UPDATE companies SET description=$1, website=$2, location=$3, verified=COALESCE(verified,false), created_at=COALESCE(created_at, now()) WHERE id=$4', [description||null, website||null, location||null, companyId]);
      } else {
        const ci = await db.query('INSERT INTO companies (name, description, website, location, created_at) VALUES ($1,$2,$3,$4,now()) RETURNING id', [companyName, description||null, website||null, location||null]);
        companyId = ci.rows[0].id;
      }
    }
    // upsert employer_profiles
    await db.query('INSERT INTO employer_profiles (user_id, company_id, title, phone, about) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id) DO UPDATE SET company_id=EXCLUDED.company_id, title=EXCLUDED.title, phone=EXCLUDED.phone, about=EXCLUDED.about', [userId, companyId, title||null, phone||null, description||null]);
    return res.json({ ok: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
