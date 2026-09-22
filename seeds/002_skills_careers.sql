-- Seed skill categories
INSERT INTO skill_categories (id, name) VALUES
  (gen_random_uuid(), 'Programming'),
  (gen_random_uuid(), 'Web Development'),
  (gen_random_uuid(), 'Mobile Development'),
  (gen_random_uuid(), 'Database'),
  (gen_random_uuid(), 'Networking'),
  (gen_random_uuid(), 'Cybersecurity'),
  (gen_random_uuid(), 'Data Science'),
  (gen_random_uuid(), 'Artificial Intelligence'),
  (gen_random_uuid(), 'Design'),
  (gen_random_uuid(), 'Business'),
  (gen_random_uuid(), 'Communication'),
  (gen_random_uuid(), 'Leadership')
ON CONFLICT DO NOTHING;

-- Insert common skills (name, category)
-- Note: Using INSERT ... SELECT to map category ids
WITH cats AS (
  SELECT id, name FROM skill_categories
)
INSERT INTO skills (id, name, category_id)
SELECT gen_random_uuid(), v.name, c.id FROM (
  VALUES
    ('HTML','Web Development'),('CSS','Web Development'),('JavaScript','Programming'),('React','Web Development'),('Git','Programming'),('APIs','Web Development'),('Database','Database'),
    ('Excel','Business'),('SQL','Database'),('Statistics','Data Science'),('Python','Programming'),('Data Visualization','Data Science'),
    ('Networking','Networking'),('TCP/IP','Networking'),('Linux','Networking'),('Network Security','Cybersecurity'),
    ('Machine Learning','Artificial Intelligence'),('Deep Learning','Artificial Intelligence'),('Figma','Design'),('UI Design','Design'),
    ('Project Management','Leadership'),('Communication','Communication')
  ) AS v(name, cat)
JOIN cats c ON c.name = v.cat
ON CONFLICT (name) DO NOTHING;

-- Career categories
INSERT INTO career_categories (id, name) VALUES
  (gen_random_uuid(), 'Technology & ICT'),
  (gen_random_uuid(), 'Data & Analytics'),
  (gen_random_uuid(), 'Networking & Infrastructure'),
  (gen_random_uuid(), 'Creative & Design'),
  (gen_random_uuid(), 'Health & Medical'),
  (gen_random_uuid(), 'Business & Finance'),
  (gen_random_uuid(), 'Education'),
  (gen_random_uuid(), 'Engineering & Construction'),
  (gen_random_uuid(), 'Hospitality & Tourism'),
  (gen_random_uuid(), 'Media & Communications')
ON CONFLICT DO NOTHING;

-- Insert careers
WITH ccats AS (SELECT id, name FROM career_categories),
     sk AS (SELECT id, name FROM skills)
INSERT INTO careers (id, title, category_id, description)
SELECT gen_random_uuid(), v.title, c.id, v.desc FROM (
  VALUES
    ('Software Developer','Develop and maintain web applications using modern JavaScript frameworks.'),
    ('Data Analyst','Collect, process and analyze data to inform business decisions.'),
    ('Network Administrator','Maintain and secure network infrastructure and services.'),
    ('Graphic Designer','Design visual assets, UI mockups and brand materials.')
  ) AS v(title, desc)
JOIN ccats c ON c.name = CASE WHEN v.title='Software Developer' THEN 'Technology & ICT' WHEN v.title='Data Analyst' THEN 'Data & Analytics' WHEN v.title='Network Administrator' THEN 'Networking & Infrastructure' ELSE 'Creative & Design' END
ON CONFLICT (title) DO NOTHING;

-- Link careers to skills with required_level (1-5) using proficiency_levels ids
-- Map skill names to careers
WITH svc AS (
  SELECT c.id as career_id, s.id as skill_id, v.req FROM careers c JOIN (
    VALUES
      ('Software Developer','HTML',3),('Software Developer','CSS',3),('Software Developer','JavaScript',4),('Software Developer','React',4),('Software Developer','Git',3),('Software Developer','APIs',3),('Software Developer','Database',3),
      ('Data Analyst','Excel',4),('Data Analyst','SQL',4),('Data Analyst','Statistics',3),('Data Analyst','Python',3),('Data Analyst','Data Visualization',3),
      ('Network Administrator','Networking',4),('Network Administrator','TCP/IP',4),('Network Administrator','Linux',3),('Network Administrator','Network Security',3)
    ) AS v(career, skill, req)
    JOIN careers c2 ON c2.title = v.career
    JOIN skills s ON s.name = v.skill
  ) SELECT career_id, skill_id, req FROM svc
)
INSERT INTO career_skills (id, career_id, skill_id, required_level, importance)
SELECT gen_random_uuid(), career_id, skill_id, req, 80 FROM svc
ON CONFLICT (career_id, skill_id) DO NOTHING;
