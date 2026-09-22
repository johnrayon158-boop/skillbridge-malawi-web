const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const skillsRoutes = require('./routes/skills');
const careersRoutes = require('./routes/careers');
const employerRoutes = require('./routes/employer');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const assessmentsRoutes = require('./routes/assessments');
const skillsGapRoutes = require('./routes/skills_gap');
const careerGuidanceRoutes = require('./routes/career_guidance');
const learningResourcesRoutes = require('./routes/learning_resources');
const portfolioRoutes = require('./routes/portfolio');
const matchingRoutes = require('./routes/matching');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/skills-gap', skillsGapRoutes);
app.use('/api/career-guidance', careerGuidanceRoutes);
app.use('/api/learning-resources', learningResourcesRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const DEFAULT_PORT = 4001;
const SAFE_PORT = 4002;
const port = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;

const startServer = (p) => {
  const server = app.listen(p, () => {
    console.log(`Server listening on ${p}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${p} is busy, trying ${SAFE_PORT} instead`);
      if (p === DEFAULT_PORT) {
        startServer(SAFE_PORT);
        return;
      }
      process.exit(1);
    }

    console.error(`Failed to start on port ${p}: ${err.message}`);
    process.exit(1);
  });
};

startServer(port);
