const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const router = express.Router();

const JWT_EXP = process.env.JWT_EXP || '7d';

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, accountType, acceptTerms } = req.body;
    if (!email || !password || !fullName || !accountType) return res.status(400).json({ error: 'Missing fields' });
    if (!acceptTerms) return res.status(400).json({ error: 'Terms must be accepted' });
    // basic validations
    const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRe.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (password.length < 8) return res.status(400).json({ error: 'Password too short' });

    // map accountType to role id
    const roleRes = await db.query('SELECT id FROM roles WHERE name = $1', [accountType.toLowerCase()]);
    if (!roleRes.rows[0]) return res.status(400).json({ error: 'Invalid account type' });
    const roleId = roleRes.rows[0].id;

    const hashed = await bcrypt.hash(password, 10);
    const insert = await db.query('INSERT INTO users (email, password_hash, role_id) VALUES ($1,$2,$3) RETURNING id,email,role_id', [email, hashed, roleId]);
    const user = insert.rows[0];

    // create profile rows depending on role
    if (accountType.toLowerCase() === 'employer') {
      await db.query('INSERT INTO employer_profiles (user_id, title) VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, '']);
    } else {
      await db.query('INSERT INTO student_profiles (user_id, full_name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, fullName]);
    }

    // issue token and return role name for consistent client shape
    const roleName = accountType.toLowerCase();
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    const token = jwt.sign({ sub: user.id, role: roleName }, process.env.JWT_SECRET, { expiresIn: JWT_EXP });
    return res.json({ token, user: { id: user.id, email: user.email, role: roleName } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const { rows } = await db.query('SELECT id, password_hash, role_id FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    // get role name
    const r = await db.query('SELECT name FROM roles WHERE id = $1', [user.role_id]);
    const roleName = r.rows[0] && r.rows[0].name;
    if (!process.env.JWT_SECRET) { console.error('JWT_SECRET not set'); return res.status(500).json({ error: 'Server misconfiguration' }); }
    const token = jwt.sign({ sub: user.id, role: roleName }, process.env.JWT_SECRET, { expiresIn: JWT_EXP });
    return res.json({ token, user: { id: user.id, email, role: roleName } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query('SELECT id,email,role_id FROM users WHERE id = $1', [decoded.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'Invalid token' });
    const roleRes = await db.query('SELECT name FROM roles WHERE id = $1', [rows[0].role_id]);
    return res.json({ id: rows[0].id, email: rows[0].email, role: roleRes.rows[0].name });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
