-- Seed representative institutions, programs, career categories and careers across many fields

-- Institutions
INSERT INTO institutions (id,name,location) VALUES
  (gen_random_uuid(),'DMI-St John the Baptist University','Lilongwe'),
  (gen_random_uuid(),'Malawi College of Health Sciences','Blantyre'),
  (gen_random_uuid(),'Malawi Technical College','Lilongwe')
ON CONFLICT (name) DO NOTHING;

-- Academic programs (representative)
WITH inst AS (SELECT id,name FROM institutions)
INSERT INTO academic_programs (id,institution_id,name,level)
SELECT gen_random_uuid(), i.id, v.name, v.level FROM (
  VALUES
    ('BSc Computer Science','Bachelors'),
    ('BSc Accounting','Bachelors'),
    ('Diploma in Nursing','Diploma'),
    ('Diploma in Civil Engineering','Diploma'),
    ('Certificate in Hospitality','Certificate'),
    ('BA Journalism','Bachelors')
) AS v(name, level)
CROSS JOIN (SELECT id FROM institutions LIMIT 1) i
ON CONFLICT (institution_id, name) DO NOTHING;

-- Add broader career categories
INSERT INTO career_categories (id,name) VALUES
  (gen_random_uuid(),'Health & Medical'),
  (gen_random_uuid(),'Business & Finance'),
  (gen_random_uuid(),'Education'),
  (gen_random_uuid(),'Engineering & Construction'),
  (gen_random_uuid(),'Hospitality & Tourism'),
  (gen_random_uuid(),'Media & Communications')
ON CONFLICT (name) DO NOTHING;

-- Seed a few non-tech careers
INSERT INTO careers (id,title,description,category_id)
SELECT gen_random_uuid(), v.title, v.desc, c.id FROM (
  VALUES
    ('Accountant','Prepare financial statements, manage accounts and ensure compliance.'),
    ('Nurse','Provide patient care, administer treatments and support clinical teams.'),
    ('Civil Engineer','Plan and supervise construction, design and infrastructure projects.'),
    ('Hospitality Manager','Manage hotel/restaurant operations and guest services.'),
    ('Journalist','Research, write and report news stories across media channels.')
) AS v(title, desc)
JOIN career_categories c ON c.name = CASE WHEN v.title='Accountant' THEN 'Business & Finance' WHEN v.title='Nurse' THEN 'Health & Medical' WHEN v.title='Civil Engineer' THEN 'Engineering & Construction' WHEN v.title='Hospitality Manager' THEN 'Hospitality & Tourism' ELSE 'Media & Communications' END
ON CONFLICT (title) DO NOTHING;

-- Map some careers to programs by linking via career_programs (simple heuristic for seeds)
WITH p AS (SELECT id,name FROM academic_programs), ca AS (SELECT id,title FROM careers)
INSERT INTO career_programs (id, career_id, program_id)
SELECT gen_random_uuid(), ca.id, p.id FROM ca JOIN p ON (
  (ca.title='Accountant' AND p.name ILIKE '%Accounting%') OR
  (ca.title='Nurse' AND p.name ILIKE '%Nursing%') OR
  (ca.title='Civil Engineer' AND p.name ILIKE '%Civil%') OR
  (ca.title='Hospitality Manager' AND p.name ILIKE '%Hospitality%') OR
  (ca.title='Journalist' AND p.name ILIKE '%Journalism%')
)
ON CONFLICT (career_id, program_id) DO NOTHING;
