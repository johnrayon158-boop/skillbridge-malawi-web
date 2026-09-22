const db = require('../db');

async function createNotification(userId, type, title, body, meta = {}){
  try{
    if(!userId) return;
    await db.query('INSERT INTO notifications (user_id, type, title, body, read, created_at) VALUES ($1,$2,$3,$4,$5,now())', [userId, type, title, body, false]);
  } catch (err){ console.error('createNotification error', err); }
}

module.exports = { createNotification };
