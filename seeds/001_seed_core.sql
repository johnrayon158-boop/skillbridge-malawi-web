-- Core seed data for development
-- Run with: psql $DATABASE_URL -f seeds/001_seed_core.sql

-- Roles
INSERT INTO roles (name, description) VALUES
('student','Student or undergraduate'),
('graduate','Graduate / alumni'),
('employer','Employer / company representative'),
('admin','Platform administrator')
ON CONFLICT (name) DO NOTHING;

-- Proficiency levels (id,name)
INSERT INTO proficiency_levels (id,name,description) VALUES
(10,'Beginner','Basic familiarity'),
(20,'Intermediate','Can perform tasks with guidance'),
(30,'Advanced','Independent and experienced')
ON CONFLICT (id) DO NOTHING;

-- Skill categories
INSERT INTO skill_categories (id,name) VALUES
 (gen_random_uuid(),'Programming'),
 (gen_random_uuid(),'Data & Analytics'),
 (gen_random_uuid(),'Networking'),
 (gen_random_uuid(),'Healthcare'),
 (gen_random_uuid(),'Teaching'),
 (gen_random_uuid(),'Construction'),
 (gen_random_uuid(),'Design'),
 (gen_random_uuid(),'Business')
ON CONFLICT (name) DO NOTHING;

-- Basic skills
INSERT INTO skills (id,name) VALUES
 (gen_random_uuid(),'JavaScript'),
 (gen_random_uuid(),'React'),
 (gen_random_uuid(),'SQL'),
 (gen_random_uuid(),'Linux'),
 (gen_random_uuid(),'Accounting'),
 (gen_random_uuid(),'Clinical Care'),
 (gen_random_uuid(),'Patient Assessment'),
 (gen_random_uuid(),'AutoCAD')
ON CONFLICT (name) DO NOTHING;

-- Career categories
INSERT INTO career_categories (id,name) VALUES
 (gen_random_uuid(),'Technology & ICT'),
 (gen_random_uuid(),'Data & Analytics'),
 (gen_random_uuid(),'Health & Medical'),
 (gen_random_uuid(),'Business & Finance'),
 (gen_random_uuid(),'Education')
ON CONFLICT (name) DO NOTHING;

-- Example careers
INSERT INTO careers (id,title,description) VALUES
 (gen_random_uuid(),'Software Developer','Frontend and fullstack development roles'),
 (gen_random_uuid(),'Data Analyst','Data analysis and reporting roles'),
 (gen_random_uuid(),'Accountant','Financial reporting and accounting roles'),
 (gen_random_uuid(),'Nurse','Clinical nursing and patient care roles')
ON CONFLICT (title) DO NOTHING;
