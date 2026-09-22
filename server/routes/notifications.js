const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// List notifications for user (most recent first)
router.get('/', authenticate, async (req, res) => {
  try{
    const userId = req.user.id;
    const rows = (await db.query('SELECT id,type,title,body,read,created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId])).rows;
    return res.json(rows);
  } catch (err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.get('/unread/count', authenticate, async (req, res) => {
  try{ const userId=req.user.id; const r = await db.query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read = false',[userId]); return res.json({ count: parseInt(r.rows[0].count,10) }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/mark-read/:id', authenticate, async (req, res) => {
  try{ const userId = req.user.id; const id = req.params.id; await db.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [id, userId]); return res.json({ ok: true }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/mark-all-read', authenticate, async (req, res) => {
  try{ const userId = req.user.id; await db.query('UPDATE notifications SET read = true WHERE user_id = $1', [userId]); return res.json({ ok: true }); } catch(err){ console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
