const { Pool } = require('pg');
require('dotenv').config();

if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
  };
} else {
  console.log('WARNING: No DATABASE_URL; using in-memory mock DB for development');
  const bcrypt = require('bcrypt');

  const roles = [
    { id: 1, name: 'student' },
    { id: 2, name: 'graduate' },
    { id: 3, name: 'employer' },
    { id: 4, name: 'admin' }
  ];

  const demoUsers = [
    { id: 1, email: 'student@skillbridge.mw', password: bcrypt.hashSync('Student@123', 10), role_id: 1 },
    { id: 2, email: 'graduate@skillbridge.mw', password: bcrypt.hashSync('Graduate@123', 10), role_id: 2 },
    { id: 3, email: 'employer@skillbridge.mw', password: bcrypt.hashSync('Employer@123', 10), role_id: 3 },
    { id: 4, email: 'admin@skillbridge.mw', password: bcrypt.hashSync('Admin@123', 10), role_id: 4 }
  ];

  let users = [...demoUsers];
  let nextId = users.length + 1;

  const query = async (text, params) => {
    const t = text.toLowerCase();

    // role lookups
    if (t.includes('select id from roles where name')) {
      const name = params[0].toLowerCase();
      const r = roles.find(x => x.name === name);
      return { rows: r ? [{ id: r.id }] : [] };
    }

    if (t.includes('select name from roles where id')) {
      const id = params[0];
      const r = roles.find(x => x.id === id);
      return { rows: r ? [{ name: r.name }] : [] };
    }

    // select user by email
    if (t.includes('select id, password_hash, role_id from users where email')) {
      const email = params[0];
      const u = users.find(x => x.email === email);
      return { rows: u ? [{ id: u.id, password_hash: u.password, role_id: u.role_id }] : [] };
    }

    // insert user
    if (t.startsWith('insert into users')) {
      const email = params[0];
      const password_hash = params[1];
      const role_id = params[2];
      if (users.find(x => x.email === email)) {
        const e = new Error('duplicate');
        e.code = '23505';
        throw e;
      }
      const newUser = { id: nextId++, email, password: password_hash, role_id };
      users.push(newUser);
      return { rows: [{ id: newUser.id, email: newUser.email, role_id: newUser.role_id }] };
    }

    // inserts into student_profiles/employer_profiles — ignore
    if (t.startsWith('insert into student_profiles') || t.startsWith('insert into employer_profiles')) {
      return { rows: [] };
    }

    // select user by id
    if (t.includes('select id,email,role_id from users where id')) {
      const id = params[0];
      const u = users.find(x => x.id === id);
      return { rows: u ? [{ id: u.id, email: u.email, role_id: u.role_id }] : [] };
    }

    // fallback: return empty
    return { rows: [] };
  };

  module.exports = { query, pool: null };
}
