const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply to a job (student/graduate)
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    // ensure user role is student/graduate
    const rRole = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    const roleName = rRole.rows[0] && rRole.rows[0].name;
    if (!['student','graduate'].includes(roleName)) return res.status(403).json({ error: 'Only students or graduates can apply' });

    const { jobId, cover_letter, portfolio_project_id, portfolio_certificate_id } = req.body;
    if (!jobId) return res.status(400).json({ error: 'Missing jobId' });

    // check job exists and is published
    const jr = await db.query('SELECT id,status FROM jobs WHERE id = $1', [jobId]);
    if (!jr.rows[0]) return res.status(404).json({ error: 'Job not found' });
    if (jr.rows[0].status !== 'published') return res.status(400).json({ error: 'Job not open for applications' });

    // prevent duplicate
    const ex = await db.query('SELECT id FROM applications WHERE job_id = $1 AND user_id = $2', [jobId, userId]);
    if (ex.rows[0]) return res.status(400).json({ error: 'Already applied' });

    const insert = await db.query('INSERT INTO applications (job_id, user_id, cover_letter, applied_at, status) VALUES ($1,$2,$3,now(),$4) RETURNING *', [jobId, userId, cover_letter || null, 'applied']);
    const app = insert.rows[0];
    // store portfolio refs
    await db.query('UPDATE applications SET portfolio_project_id=$1, portfolio_certificate_id=$2 WHERE id=$3', [portfolio_project_id || null, portfolio_certificate_id || null, app.id]);

    // add event
    await db.query('INSERT INTO application_events (application_id, status_text, by_user_id) VALUES ($1,$2,$3)', [app.id, 'SUBMITTED', userId]);

    // notify employer(s) for the job's company
    try{
      const job = (await db.query('SELECT company_id, title FROM jobs WHERE id = $1', [jobId])).rows[0];
      if (job && job.company_id){
        const employers = (await db.query('SELECT user_id FROM employer_profiles WHERE company_id = $1', [job.company_id])).rows;
        const { createNotification } = require('../utils/notifications');
        for (const e of employers){ await createNotification(e.user_id, 'new_application', 'New application', `A new application was submitted for ${job.title}`); }
      }
    }catch(e){ console.error('notify employers failed', e); }

    // notify applicant (confirmation)
    try{ const { createNotification } = require('../utils/notifications'); await createNotification(userId, 'application_submitted', 'Application submitted', `Your application for job ${jobId} was submitted.`); } catch(e){ console.error(e); }

    return res.json({ application: app });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Get my applications
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = (await db.query('SELECT a.*, j.title as job_title, c.name as company_name FROM applications a JOIN jobs j ON a.job_id = j.id LEFT JOIN companies c ON j.company_id = c.id WHERE a.user_id = $1 ORDER BY a.applied_at DESC', [userId])).rows;
    // fetch events per application
    for (const r of rows){ r.events = (await db.query('SELECT * FROM application_events WHERE application_id = $1 ORDER BY created_at ASC', [r.id])).rows; }
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Withdraw application (applicant)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; const id = req.params.id;
    const r = await db.query('SELECT * FROM applications WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Application not found' });
    const status = r.rows[0].status;
    // allow withdraw if not already accepted or rejected
    if (['hired','rejected'].includes(status)) return res.status(400).json({ error: 'Cannot withdraw at this stage' });
    await db.query('UPDATE applications SET status=$1, updated_at=now() WHERE id=$2', ['applied', id]);
    await db.query('INSERT INTO application_events (application_id, status_text, by_user_id) VALUES ($1,$2,$3)', [id, 'WITHDRAWN', userId]);
    return res.json({ ok: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Employer: view application detail including applicant profile and events
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    // ensure employer owns the job or admin
    const userId = req.user.id;
    const roleRow = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    const roleName = roleRow.rows[0] && roleRow.rows[0].name;
    const appRes = await db.query('SELECT a.*, j.company_id FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = $1', [id]);
    if (!appRes.rows[0]) return res.status(404).json({ error: 'Not found' });
    const app = appRes.rows[0];
    if (roleName === 'employer'){
      const owner = await db.query('SELECT 1 FROM employer_profiles ep WHERE ep.user_id = $1 AND ep.company_id = $2', [userId, app.company_id]);
      if (!owner.rows[0]) return res.status(403).json({ error: 'Forbidden' });
    }
    const applicantId = app.user_id;
    const user = (await db.query('SELECT id,email FROM users WHERE id = $1', [applicantId])).rows[0];
    const profile = (await db.query('SELECT * FROM student_profiles WHERE user_id = $1', [applicantId])).rows[0];
    const skills = (await db.query('SELECT us.*, s.name as skill_name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [applicantId])).rows;
    const education = (await db.query('SELECT ue.*, (select name from institutions where id=ue.institution_id) as institution_name FROM user_education ue WHERE ue.user_id = $1', [applicantId])).rows;
    const projects = (await db.query('SELECT * FROM projects WHERE user_id = $1', [applicantId])).rows;
    const certificates = (await db.query('SELECT * FROM certificates WHERE user_id = $1', [applicantId])).rows;
    const assessments = (await db.query('SELECT aa.*, at.score FROM assessment_answers aa JOIN assessment_attempts at ON aa.attempt_id = at.id WHERE at.user_id = $1', [applicantId])).rows;
    const events = (await db.query('SELECT * FROM application_events WHERE application_id = $1 ORDER BY created_at ASC', [id])).rows;
    return res.json({ application: app, user, profile, skills, education, projects, certificates, assessments, events });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// Employer: change application status
router.put('/:id/status', authenticate, authorize(['employer','admin']), async (req, res) => {
  try {
    const id = req.params.id; const { status, note } = req.body;
    const valid = ['SUBMITTED','UNDER_REVIEW','SHORTLISTED','INTERVIEW','ACCEPTED','REJECTED'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    // map to DB status
    const map = { SUBMITTED: 'applied', UNDER_REVIEW: 'reviewing', SHORTLISTED: 'shortlisted', INTERVIEW: 'reviewing', ACCEPTED: 'hired', REJECTED: 'rejected' };
    const dbStatus = map[status] || 'reviewing';
    await db.query('UPDATE applications SET status=$1, updated_at=now() WHERE id=$2', [dbStatus, id]);
    await db.query('INSERT INTO application_events (application_id, status_text, note, by_user_id) VALUES ($1,$2,$3,$4)', [id, status, note||null, req.user.id]);
    // notify applicant of status change
    try{
      const appRow = (await db.query('SELECT user_id, job_id FROM applications WHERE id = $1', [id])).rows[0];
      if (appRow){ const { createNotification } = require('../utils/notifications'); await createNotification(appRow.user_id, 'application_status', 'Application update', `Your application status changed to ${status}`); }
    } catch(e){ console.error('notify applicant failed', e); }
    return res.json({ ok: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
