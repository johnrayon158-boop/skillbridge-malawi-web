-- Demo users and related demo data for SkillBridge Malawi
-- Idempotent: will not create duplicates if emails exist

-- Create demo users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'student@skillbridge.mw') THEN
    INSERT INTO users (id,email,password_hash,role_id,created_at,updated_at)
    VALUES (
      gen_random_uuid(), 'student@skillbridge.mw', crypt('Student@123', gen_salt('bf')), (SELECT id FROM roles WHERE name='student'), now(), now()
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'graduate@skillbridge.mw') THEN
    INSERT INTO users (id,email,password_hash,role_id,created_at,updated_at)
    VALUES (gen_random_uuid(), 'graduate@skillbridge.mw', crypt('Graduate@123', gen_salt('bf')), (SELECT id FROM roles WHERE name='graduate'), now(), now());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'employer@skillbridge.mw') THEN
    INSERT INTO users (id,email,password_hash,role_id,created_at,updated_at)
    VALUES (gen_random_uuid(), 'employer@skillbridge.mw', crypt('Employer@123', gen_salt('bf')), (SELECT id FROM roles WHERE name='employer'), now(), now());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@skillbridge.mw') THEN
    INSERT INTO users (id,email,password_hash,role_id,created_at,updated_at)
    VALUES (gen_random_uuid(), 'admin@skillbridge.mw', crypt('Admin@123', gen_salt('bf')), (SELECT id FROM roles WHERE name='admin'), now(), now());
  END IF;
END $$;

-- Create profiles for demo users
DO $$ BEGIN
  -- student profile
  INSERT INTO student_profiles (user_id, full_name, programme, institution, completion_percent, bio, location)
  SELECT u.id, 'John Banda', 'BSc Computer Science', 'DMI-St John the Baptist University', 72, 'Third year Computer Science student interested in web development and AI.', 'Lilongwe' FROM users u WHERE u.email='student@skillbridge.mw' ON CONFLICT (user_id) DO UPDATE SET full_name=EXCLUDED.full_name;

  -- graduate profile
  INSERT INTO student_profiles (user_id, full_name, programme, institution, completion_percent, bio, location)
  SELECT u.id, 'Mary Phiri', 'BCom Accounting', 'University of Malawi', 100, 'Recent graduate in Accounting seeking roles in finance and accounting.', 'Blantyre' FROM users u WHERE u.email='graduate@skillbridge.mw' ON CONFLICT (user_id) DO UPDATE SET full_name=EXCLUDED.full_name;

  -- employer profile and company
  INSERT INTO companies (id,name,description,website,location,verified) SELECT gen_random_uuid(),'Malawi Digital Solutions','A Malawi-based technology company providing software development, digital services and consulting.','https://malawids.example','Lilongwe',true WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='Malawi Digital Solutions');
  INSERT INTO employer_profiles (user_id, company_id, title, about) SELECT u.id, c.id, 'CTO', c.description FROM users u JOIN companies c ON c.name='Malawi Digital Solutions' WHERE u.email='employer@skillbridge.mw' ON CONFLICT (user_id) DO UPDATE SET company_id=EXCLUDED.company_id;

  -- admin profile
  INSERT INTO student_profiles (user_id, full_name, programme, institution, completion_percent) SELECT u.id, 'System Administrator', 'N/A', 'SkillBridge', 100 FROM users u WHERE u.email='admin@skillbridge.mw' ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Add skills for student and graduate and link them
DO $$ BEGIN
  -- ensure skills exist
  INSERT INTO skill_categories (id,name) SELECT gen_random_uuid(),'Demo' WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE name='Demo');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'HTML', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='HTML');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'CSS', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='CSS');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'JavaScript', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='JavaScript');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'React', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='React');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'Database Fundamentals', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Database Fundamentals');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'Problem Solving', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Problem Solving');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'Communication', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Communication');

  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'Financial Accounting', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Financial Accounting');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'Excel', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Excel');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'Financial Analysis', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Financial Analysis');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'Bookkeeping', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Bookkeeping');
  INSERT INTO skills (id,name,category_id) SELECT gen_random_uuid(),'Data Analysis', (SELECT id FROM skill_categories WHERE name='Demo') WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name='Data Analysis');

  -- link skills to student
  INSERT INTO user_skills (id,user_id,skill_id,proficiency,verified) SELECT gen_random_uuid(), u.id, s.id, 20, true FROM users u JOIN skills s ON s.name IN ('HTML','CSS','JavaScript','React','Database Fundamentals','Problem Solving','Communication') WHERE u.email='student@skillbridge.mw' ON CONFLICT (user_id, skill_id) DO NOTHING;

  -- link skills to graduate
  INSERT INTO user_skills (id,user_id,skill_id,proficiency,verified) SELECT gen_random_uuid(), u.id, s.id, 30, true FROM users u JOIN skills s ON s.name IN ('Financial Accounting','Excel','Financial Analysis','Communication','Bookkeeping','Data Analysis') WHERE u.email='graduate@skillbridge.mw' ON CONFLICT (user_id, skill_id) DO NOTHING;
END $$;

-- Create demo careers and link to programs (ensure career categories exist)
DO $$ BEGIN
  INSERT INTO career_categories (id,name) SELECT gen_random_uuid(),'Technology & ICT' WHERE NOT EXISTS (SELECT 1 FROM career_categories WHERE name='Technology & ICT');
  INSERT INTO career_categories (id,name) SELECT gen_random_uuid(),'Business & Finance' WHERE NOT EXISTS (SELECT 1 FROM career_categories WHERE name='Business & Finance');
  INSERT INTO careers (id,title,description,category_id) SELECT gen_random_uuid(),'Software Developer','Build web and server applications', (SELECT id FROM career_categories WHERE name='Technology & ICT') WHERE NOT EXISTS (SELECT 1 FROM careers WHERE title='Software Developer');
  INSERT INTO careers (id,title,description,category_id) SELECT gen_random_uuid(),'Accountant','Manage financial records and reporting', (SELECT id FROM career_categories WHERE name='Business & Finance') WHERE NOT EXISTS (SELECT 1 FROM careers WHERE title='Accountant');
  INSERT INTO careers (id,title,description,category_id) SELECT gen_random_uuid(),'Data Analyst','Analyze datasets and generate insights', (SELECT id FROM career_categories WHERE name='Business & Finance') WHERE NOT EXISTS (SELECT 1 FROM careers WHERE title='Data Analyst');
END $$;

-- Link careers to program via career_programs where possible
DO $$ BEGIN
  INSERT INTO career_programs (id,career_id,program_id)
  SELECT gen_random_uuid(), c.id, p.id FROM careers c JOIN academic_programs p ON p.name ILIKE '%Computer Science%' WHERE c.title='Software Developer' ON CONFLICT (career_id, program_id) DO NOTHING;
  INSERT INTO career_programs (id,career_id,program_id)
  SELECT gen_random_uuid(), c.id, p.id FROM careers c JOIN academic_programs p ON p.name ILIKE '%Accounting%' WHERE c.title='Accountant' ON CONFLICT (career_id, program_id) DO NOTHING;
  INSERT INTO career_programs (id,career_id,program_id)
  SELECT gen_random_uuid(), c.id, p.id FROM careers c JOIN academic_programs p ON p.name ILIKE '%Accounting%' WHERE c.title='Data Analyst' ON CONFLICT (career_id, program_id) DO NOTHING;
END $$;

-- Create simple assessments and skill scores for demo users
DO $$ BEGIN
  INSERT INTO assessments (id,title,category,questions_count,duration_minutes) SELECT gen_random_uuid(),'JavaScript Fundamentals','Web Development',10,30 WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE title='JavaScript Fundamentals');
  INSERT INTO assessments (id,title,category,questions_count,duration_minutes) SELECT gen_random_uuid(),'Accounting Basics','Accounting',10,30 WHERE NOT EXISTS (SELECT 1 FROM assessments WHERE title='Accounting Basics');
  -- add attempt and skill scores for student
  INSERT INTO assessment_attempts (id,assessment_id,user_id,started_at,completed_at,score) SELECT gen_random_uuid(), a.id, u.id, now(), now(), 82 FROM users u JOIN assessments a ON a.title='JavaScript Fundamentals' WHERE u.email='student@skillbridge.mw' ON CONFLICT DO NOTHING;
  INSERT INTO assessment_skill_scores (id,attempt_id,skill_id,score) SELECT gen_random_uuid(), aa.id, s.id, 82 FROM assessment_attempts aa JOIN users u ON u.email='student@skillbridge.mw' JOIN assessments a ON a.title='JavaScript Fundamentals' JOIN skills s ON s.name='JavaScript' WHERE aa.user_id = u.id ON CONFLICT DO NOTHING;
  -- graduate assessment
  INSERT INTO assessment_attempts (id,assessment_id,user_id,started_at,completed_at,score) SELECT gen_random_uuid(), a.id, u.id, now(), now(), 88 FROM users u JOIN assessments a ON a.title='Accounting Basics' WHERE u.email='graduate@skillbridge.mw' ON CONFLICT DO NOTHING;
  INSERT INTO assessment_skill_scores (id,attempt_id,skill_id,score) SELECT gen_random_uuid(), aa.id, s.id, 88 FROM assessment_attempts aa JOIN users u ON u.email='graduate@skillbridge.mw' JOIN assessments a ON a.title='Accounting Basics' JOIN skills s ON s.name='Financial Accounting' WHERE aa.user_id = u.id ON CONFLICT DO NOTHING;
END $$;

-- Create demo jobs by employer
DO $$ BEGIN
  INSERT INTO jobs (id,company_id,title,description,location,type,min_experience,status,posted_at)
  SELECT gen_random_uuid(), c.id, 'Junior Software Developer', 'Entry-level role for web development using JavaScript and React.', 'Lilongwe', 'Full-time', 0, 'published', now() FROM companies c WHERE c.name='Malawi Digital Solutions' AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.title='Junior Software Developer' AND j.company_id=c.id);

  INSERT INTO jobs (id,company_id,title,description,location,type,min_experience,status,posted_at)
  SELECT gen_random_uuid(), c.id, 'ICT Intern', 'Internship for ICT support and basic programming.', 'Lilongwe', 'Internship', 0, 'published', now() FROM companies c WHERE c.name='Malawi Digital Solutions' AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.title='ICT Intern' AND j.company_id=c.id);

  INSERT INTO jobs (id,company_id,title,description,location,type,min_experience,status,posted_at)
  SELECT gen_random_uuid(), c.id, 'Data Analyst', 'Analyze data and build reports using SQL and Excel.', 'Lilongwe', 'Full-time', 1, 'published', now() FROM companies c WHERE c.name='Malawi Digital Solutions' AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.title='Data Analyst' AND j.company_id=c.id);
END $$;

-- Link job skills
DO $$ BEGIN
  -- map skills to jobs
  INSERT INTO job_skills (id,job_id,skill_id,importance) SELECT gen_random_uuid(), j.id, s.id, 100 FROM jobs j JOIN skills s ON s.name IN ('JavaScript','React','HTML','CSS','Git','Database Fundamentals') WHERE j.title='Junior Software Developer' ON CONFLICT DO NOTHING;
  INSERT INTO job_skills (id,job_id,skill_id,importance) SELECT gen_random_uuid(), j.id, s.id, 80 FROM jobs j JOIN skills s ON s.name IN ('Computer literacy','Communication','Problem Solving') WHERE j.title='ICT Intern' ON CONFLICT DO NOTHING;
  INSERT INTO job_skills (id,job_id,skill_id,importance) SELECT gen_random_uuid(), j.id, s.id, 100 FROM jobs j JOIN skills s ON s.name IN ('Excel','Data Analysis','SQL','Statistics','Data Visualization') WHERE j.title='Data Analyst' ON CONFLICT DO NOTHING;
END $$;

-- Create sample application: student applies to Junior Software Developer
DO $$ BEGIN
  INSERT INTO applications (id,job_id,user_id,status,cover_letter,applied_at)
  SELECT gen_random_uuid(), j.id, u.id, 'applied', 'I am eager to learn and contribute to your team.', now() FROM jobs j JOIN companies c ON c.id=j.company_id JOIN users u ON u.email='student@skillbridge.mw' WHERE c.name='Malawi Digital Solutions' AND j.title='Junior Software Developer' AND NOT EXISTS (SELECT 1 FROM applications a WHERE a.job_id=j.id AND a.user_id=u.id);
END $$;

-- Notifications
DO $$ BEGIN
  INSERT INTO notifications (id,user_id,type,title,body,created_at) SELECT gen_random_uuid(), u.id, 'system','Welcome to SkillBridge','Welcome John — explore career recommendations and assessments.', now() FROM users u WHERE u.email='student@skillbridge.mw' AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id=u.id AND n.title LIKE 'Welcome%');
  INSERT INTO notifications (id,user_id,type,title,body,created_at) SELECT gen_random_uuid(), u.id, 'system','Welcome to SkillBridge','Welcome Mary — check your learning recommendations and job matches.', now() FROM users u WHERE u.email='graduate@skillbridge.mw' AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id=u.id AND n.title LIKE 'Welcome%');
  INSERT INTO notifications (id,user_id,type,title,body,created_at) SELECT gen_random_uuid(), u.id, 'system','Company account created','Your employer profile has been created for Malawi Digital Solutions.', now() FROM users u WHERE u.email='employer@skillbridge.mw' AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id=u.id AND n.title LIKE 'Company account%');
END $$;
