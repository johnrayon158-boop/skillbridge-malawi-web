const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    if (!process.env.JWT_SECRET) { console.error('JWT_SECRET not set'); return res.status(500).json({ error: 'Server misconfiguration' }); }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query('SELECT id,email,role_id FROM users WHERE id = $1', [decoded.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'Invalid token' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (allowedRoles = []) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  // fetch role name
  const { rows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
  const roleName = rows[0] && rows[0].name;
  if (!allowedRoles.length || allowedRoles.includes(roleName)) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

module.exports = { authenticate, authorize };
