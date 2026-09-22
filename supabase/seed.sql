-- SkillBridge Malawi development seed data
-- Run supabase/complete_schema.sql first.
-- This file never inserts passwords or auth users.

begin;

-- Institution types and Malawi location hierarchy.
insert into public.institution_types (name, description) values
  ('University', 'Degree-awarding university'),
  ('College', 'College or higher education provider'),
  ('Technical/Vocational Institution', 'Technical, vocational or trade institution'),
  ('Training Institution', 'Professional or continuing training provider'),
  ('Other', 'Other recognized education provider')
on conflict (name) do nothing;

insert into public.locations (name, location_type, country_code) values
  ('Central Region', 'region', 'MW'),
  ('Northern Region', 'region', 'MW'),
  ('Southern Region', 'region', 'MW')
on conflict do nothing;

insert into public.locations (name, location_type, country_code, parent_id)
select x.name, 'district', 'MW', l.id
from (values
  ('Lilongwe','Central Region'), ('Dedza','Central Region'), ('Dowa','Central Region'), ('Kasungu','Central Region'), ('Mchinji','Central Region'), ('Nkhotakota','Central Region'), ('Ntcheu','Central Region'), ('Ntchisi','Central Region'), ('Salima','Central Region'),
  ('Chitipa','Northern Region'), ('Karonga','Northern Region'), ('Likoma','Northern Region'), ('Mzimba','Northern Region'), ('Nkhata Bay','Northern Region'), ('Rumphi','Northern Region'),
  ('Blantyre','Southern Region'), ('Balaka','Southern Region'), ('Chikwawa','Southern Region'), ('Chiradzulu','Southern Region'), ('Machinga','Southern Region'), ('Mangochi','Southern Region'), ('Mulanje','Southern Region'), ('Mwanza','Southern Region'), ('Nsanje','Southern Region'), ('Thyolo','Southern Region'), ('Phalombe','Southern Region'), ('Zomba','Southern Region')
) as x(name, region_name)
join public.locations l on l.name = x.region_name and l.location_type = 'region'
on conflict do nothing;

insert into public.locations (name, location_type, country_code, parent_id)
select x.name, 'city', 'MW', l.id
from (values ('Lilongwe','Lilongwe'), ('Mzuzu','Mzimba'), ('Blantyre','Blantyre'), ('Zomba','Zomba'), ('Kasungu','Kasungu'), ('Mangochi','Mangochi')) as x(name, district_name)
join public.locations l on l.name = x.district_name and l.location_type = 'district'
on conflict do nothing;

insert into public.programme_categories (name, description) values
  ('Computing and Information Technology','Computing, software, data and digital systems'),
  ('Business and Commerce','Business, management, finance and accounting'),
  ('Education','Teaching, learning and education leadership'),
  ('Health Sciences','Medicine, nursing and allied health'),
  ('Engineering and Built Environment','Engineering, construction and infrastructure'),
  ('Agriculture and Natural Resources','Agriculture, environment and natural resources'),
  ('Law and Social Sciences','Law, policy, economics and social studies'),
  ('Arts, Media and Communication','Creative arts, journalism and communication'),
  ('Hospitality and Tourism','Hospitality, travel and tourism'),
  ('Technical and Vocational','Practical, technical and trade programmes')
on conflict (name) do nothing;

insert into public.qualifications (name, level, description) values
  ('Malawi School Certificate of Education', 'secondary', 'Secondary school qualification'),
  ('Certificate', 'certificate', 'Post-secondary certificate'),
  ('Diploma', 'diploma', 'Technical or academic diploma'),
  ('Bachelor Degree', 'undergraduate', 'Undergraduate degree'),
  ('Postgraduate Diploma', 'postgraduate', 'Postgraduate diploma'),
  ('Master Degree', 'masters', 'Masters degree'),
  ('Doctoral Degree', 'doctoral', 'Doctoral degree')
on conflict (name) do nothing;

insert into public.institutions (institution_type_id, name, abbreviation, location_id, verified)
select it.id, x.name, x.abbreviation, loc.id, true
from (values
  ('University','University of Malawi','UNIMA','Zomba'),
  ('University','Lilongwe University of Agriculture and Natural Resources','LUANAR','Lilongwe'),
  ('University','Mzuzu University','MZUNI','Mzuzu'),
  ('University','Malawi University of Business and Applied Sciences','MUBAS','Blantyre'),
  ('College','Malawi College of Accountancy','MCA','Blantyre'),
  ('Technical/Vocational Institution','Technical, Entrepreneurial and Vocational Education and Training Authority','TEVETA','Lilongwe'),
  ('Training Institution','Malawi Institute of Journalism','MIJ','Blantyre')
) as x(type_name, name, abbreviation, city_name)
join public.institution_types it on it.name = x.type_name
left join public.locations loc on loc.name = x.city_name and loc.location_type = 'city'
on conflict (name) do update set abbreviation = excluded.abbreviation, location_id = excluded.location_id;

insert into public.faculties (institution_id, name)
select i.id, x.faculty_name
from (values
  ('University of Malawi','Faculty of Science and Technology'), ('University of Malawi','Faculty of Law'), ('University of Malawi','Faculty of Social Science'),
  ('Lilongwe University of Agriculture and Natural Resources','Faculty of Agriculture'), ('Lilongwe University of Agriculture and Natural Resources','Faculty of Natural Resources'),
  ('Malawi University of Business and Applied Sciences','Faculty of Engineering'), ('Malawi University of Business and Applied Sciences','Faculty of Business'),
  ('Mzuzu University','Faculty of Education'), ('Mzuzu University','Faculty of Information Science')
) as x(institution_name, faculty_name)
join public.institutions i on i.name = x.institution_name
on conflict (institution_id, name) do nothing;

insert into public.departments (faculty_id, name)
select f.id, x.department_name
from (values
  ('Faculty of Science and Technology','Computer Science'), ('Faculty of Science and Technology','Mathematics'), ('Faculty of Law','Law'), ('Faculty of Social Science','Economics'),
  ('Faculty of Agriculture','Agricultural Sciences'), ('Faculty of Natural Resources','Environmental Management'), ('Faculty of Engineering','Civil Engineering'), ('Faculty of Engineering','Electrical Engineering'),
  ('Faculty of Business','Business Administration'), ('Faculty of Education','Teacher Education'), ('Faculty of Information Science','Library and Information Science')
) as x(faculty_name, department_name)
join public.faculties f on f.name = x.faculty_name
on conflict (faculty_id, name) do nothing;

insert into public.skill_categories (name, description) values
  ('Technical','Technical and domain-specific skills'), ('Soft Skills','Interpersonal and personal effectiveness skills'), ('Business','Business and commercial skills'), ('Communication','Communication skills'), ('Leadership','Leadership and management skills'), ('Digital','Digital skills'), ('Creative','Creative skills'), ('Professional','Professional practice skills')
on conflict (name) do nothing;

insert into public.skills (category_id, name, description, skill_type, difficulty_level)
select sc.id, x.name, x.description, x.skill_type, x.level::public.proficiency_level
from (values
  ('Technical','Programming','Writing and maintaining software code','technical','intermediate'),
  ('Technical','Data Analysis','Interpreting data and producing insights','technical','intermediate'),
  ('Technical','Database Management','Designing and managing data systems','technical','intermediate'),
  ('Digital','Digital Literacy','Confident use of digital tools','digital','beginner'),
  ('Digital','Cybersecurity Awareness','Applying basic security practices','digital','intermediate'),
  ('Business','Financial Accounting','Recording and reporting financial transactions','business','intermediate'),
  ('Business','Entrepreneurship','Developing and operating a business','business','intermediate'),
  ('Communication','Written Communication','Clear professional written communication','communication','beginner'),
  ('Communication','Public Speaking','Presenting ideas to an audience','communication','intermediate'),
  ('Leadership','Leadership','Leading people and making decisions','leadership','advanced'),
  ('Professional','Project Management','Planning and delivering projects','professional','intermediate'),
  ('Creative','Graphic Design','Creating visual communication and layouts','creative','intermediate'),
  ('Professional','Research Methods','Planning and conducting structured research','professional','intermediate'),
  ('Technical','Agricultural Production','Planning sustainable agricultural production','technical','intermediate'),
  ('Technical','Clinical Care','Providing safe evidence-based patient care','technical','advanced'),
  ('Professional','Teaching Practice','Planning and facilitating effective learning','professional','advanced'),
  ('Professional','Legal Research','Finding and interpreting legal authorities','professional','advanced'),
  ('Professional','Customer Service','Supporting customers and resolving issues','professional','beginner'),
  ('Technical','Electrical Installation','Installing and maintaining electrical systems','technical','advanced'),
  ('Professional','Environmental Management','Managing environmental risks and resources','professional','intermediate')
) as x(category_name, name, description, skill_type, level)
join public.skill_categories sc on sc.name = x.category_name
on conflict (name) do update set description = excluded.description;

-- Re-run skill inserts after categories are guaranteed (the first insert above is intentionally followed by category creation for new projects).
insert into public.skills (category_id, name, description, skill_type, difficulty_level)
select sc.id, x.name, x.description, x.skill_type, x.level::public.proficiency_level
from (values
  ('Technical','Programming','Writing and maintaining software code','technical','intermediate'), ('Technical','Data Analysis','Interpreting data and producing insights','technical','intermediate'), ('Technical','Database Management','Designing and managing data systems','technical','intermediate'), ('Digital','Digital Literacy','Confident use of digital tools','digital','beginner'), ('Digital','Cybersecurity Awareness','Applying basic security practices','digital','intermediate'), ('Business','Financial Accounting','Recording and reporting financial transactions','business','intermediate'), ('Business','Entrepreneurship','Developing and operating a business','business','intermediate'), ('Communication','Written Communication','Clear professional written communication','communication','beginner'), ('Communication','Public Speaking','Presenting ideas to an audience','communication','intermediate'), ('Leadership','Leadership','Leading people and making decisions','leadership','advanced'), ('Professional','Project Management','Planning and delivering projects','professional','intermediate'), ('Creative','Graphic Design','Creating visual communication and layouts','creative','intermediate'), ('Professional','Research Methods','Planning and conducting structured research','professional','intermediate'), ('Technical','Agricultural Production','Planning sustainable agricultural production','technical','intermediate'), ('Technical','Clinical Care','Providing safe evidence-based patient care','technical','advanced'), ('Professional','Teaching Practice','Planning and facilitating effective learning','professional','advanced'), ('Professional','Legal Research','Finding and interpreting legal authorities','professional','advanced'), ('Professional','Customer Service','Supporting customers and resolving issues','professional','beginner'), ('Technical','Electrical Installation','Installing and maintaining electrical systems','technical','advanced'), ('Professional','Environmental Management','Managing environmental risks and resources','professional','intermediate')
) as x(category_name, name, description, skill_type, level)
join public.skill_categories sc on sc.name = x.category_name
on conflict (name) do update set category_id = excluded.category_id, description = excluded.description;

insert into public.career_categories (name, description) values
  ('Technology and ICT','Technology and digital careers'), ('Business and Commerce','Business and commerce careers'), ('Education','Education careers'), ('Health Sciences','Healthcare careers'), ('Engineering and Built Environment','Engineering careers'), ('Agriculture and Natural Resources','Agriculture and environment careers'), ('Law and Social Sciences','Law and social science careers'), ('Arts, Media and Communication','Creative and media careers'), ('Hospitality and Tourism','Hospitality careers'), ('Science and Technology','Science careers'), ('Technical and Vocational','Technical and trade careers')
on conflict (name) do nothing;

insert into public.careers (category_id, title, description, industry, demand_level, required_education)
select cc.id, x.title, x.description, x.industry, x.demand, x.education::public.education_level
from (values
  ('Technology and ICT','Software Developer','Builds and maintains software applications','Technology','very_high','undergraduate'),
  ('Technology and ICT','Data Analyst','Turns data into decisions and insights','Technology','high','undergraduate'),
  ('Business and Commerce','Accountant','Maintains financial records and reports','Finance','high','diploma'),
  ('Business and Commerce','Business Administrator','Coordinates business operations and services','Business','high','diploma'),
  ('Education','Teacher','Plans and facilitates learning','Education','high','undergraduate'),
  ('Health Sciences','Nurse','Provides professional nursing care','Healthcare','very_high','undergraduate'),
  ('Engineering and Built Environment','Civil Engineer','Designs and manages infrastructure projects','Engineering','high','undergraduate'),
  ('Agriculture and Natural Resources','Agricultural Extension Officer','Supports farmers with productive practices','Agriculture','high','diploma'),
  ('Law and Social Sciences','Legal Practitioner','Provides legal advice and representation','Legal','medium','undergraduate'),
  ('Arts, Media and Communication','Journalist','Researches and produces news and features','Media','medium','diploma'),
  ('Hospitality and Tourism','Hospitality Manager','Manages hospitality operations and guest experience','Hospitality','high','diploma'),
  ('Agriculture and Natural Resources','Environmental Officer','Supports environmental planning and compliance','Environment','high','undergraduate'),
  ('Technical and Vocational','Electrical Technician','Installs and maintains electrical systems','Technical Services','high','certificate'),
  ('Arts, Media and Communication','Graphic Designer','Creates visual communications and brand assets','Creative','medium','certificate'),
  ('Law and Social Sciences','Economist','Analyses economic activity and policy','Public Policy','medium','undergraduate'),
  ('Science and Technology','Laboratory Scientist','Performs scientific laboratory analysis','Science','high','undergraduate')
) as x(category_name, title, description, industry, demand, education)
join public.career_categories cc on cc.name = x.category_name
on conflict (title) do update set description = excluded.description, industry = excluded.industry;

-- Ensure careers are present when the category list was initially empty.
insert into public.careers (category_id, title, description, industry, demand_level, required_education)
select cc.id, x.title, x.description, x.industry, x.demand, x.education::public.education_level
from (values ('Technology and ICT','Software Developer','Builds and maintains software applications','Technology','very_high','undergraduate'), ('Technology and ICT','Data Analyst','Turns data into decisions and insights','Technology','high','undergraduate'), ('Business and Commerce','Accountant','Maintains financial records and reports','Finance','high','diploma'), ('Business and Commerce','Business Administrator','Coordinates business operations and services','Business','high','diploma'), ('Education','Teacher','Plans and facilitates learning','Education','high','undergraduate'), ('Health Sciences','Nurse','Provides professional nursing care','Healthcare','very_high','undergraduate'), ('Engineering and Built Environment','Civil Engineer','Designs and manages infrastructure projects','Engineering','high','undergraduate'), ('Agriculture and Natural Resources','Agricultural Extension Officer','Supports farmers with productive practices','Agriculture','high','diploma'), ('Law and Social Sciences','Legal Practitioner','Provides legal advice and representation','Legal','medium','undergraduate'), ('Arts, Media and Communication','Journalist','Researches and produces news and features','Media','medium','diploma'), ('Hospitality and Tourism','Hospitality Manager','Manages hospitality operations and guest experience','Hospitality','high','diploma'), ('Agriculture and Natural Resources','Environmental Officer','Supports environmental planning and compliance','Environment','high','undergraduate'), ('Technical and Vocational','Electrical Technician','Installs and maintains electrical systems','Technical Services','high','certificate'), ('Arts, Media and Communication','Graphic Designer','Creates visual communications and brand assets','Creative','medium','certificate'), ('Law and Social Sciences','Economist','Analyses economic activity and policy','Public Policy','medium','undergraduate'), ('Science and Technology','Laboratory Scientist','Performs scientific laboratory analysis','Science','high','undergraduate')) as x(category_name, title, description, industry, demand, education)
join public.career_categories cc on cc.name = x.category_name
on conflict (title) do nothing;

insert into public.career_skills (career_id, skill_id, required_level, importance)
select c.id, s.id, x.level::public.proficiency_level, x.importance
from (values
  ('Software Developer','Programming','advanced',100), ('Software Developer','Database Management','intermediate',75), ('Software Developer','Project Management','intermediate',50),
  ('Data Analyst','Data Analysis','advanced',100), ('Data Analyst','Database Management','intermediate',80), ('Data Analyst','Written Communication','intermediate',50),
  ('Accountant','Financial Accounting','advanced',100), ('Accountant','Data Analysis','intermediate',55), ('Accountant','Digital Literacy','intermediate',45),
  ('Teacher','Teaching Practice','advanced',100), ('Teacher','Written Communication','advanced',70), ('Teacher','Public Speaking','advanced',70),
  ('Nurse','Clinical Care','advanced',100), ('Nurse','Written Communication','intermediate',50), ('Nurse','Customer Service','intermediate',50),
  ('Civil Engineer','Project Management','advanced',75), ('Civil Engineer','Data Analysis','intermediate',40),
  ('Agricultural Extension Officer','Agricultural Production','advanced',100), ('Agricultural Extension Officer','Public Speaking','intermediate',65),
  ('Legal Practitioner','Legal Research','advanced',100), ('Legal Practitioner','Written Communication','advanced',80),
  ('Journalist','Written Communication','advanced',100), ('Journalist','Research Methods','advanced',80), ('Journalist','Public Speaking','intermediate',45),
  ('Hospitality Manager','Customer Service','advanced',90), ('Hospitality Manager','Leadership','advanced',80),
  ('Environmental Officer','Environmental Management','advanced',100), ('Environmental Officer','Research Methods','intermediate',60),
  ('Electrical Technician','Electrical Installation','advanced',100), ('Graphic Designer','Graphic Design','advanced',100), ('Economist','Data Analysis','advanced',85), ('Economist','Research Methods','advanced',80), ('Laboratory Scientist','Research Methods','advanced',80)
) as x(career_title, skill_name, level, importance)
join public.careers c on c.title = x.career_title
join public.skills s on s.name = x.skill_name
on conflict (career_id, skill_id) do update set required_level = excluded.required_level, importance = excluded.importance;

insert into public.learning_resource_categories (name, description) values
  ('Technical Skills','Technical and digital learning'), ('Business Skills','Business and finance learning'), ('Professional Skills','Transferable professional learning'), ('Health and Safety','Health and safety learning'), ('Agriculture and Environment','Agriculture and environment learning'), ('Creative and Media','Creative and communication learning')
on conflict (name) do nothing;

insert into public.learning_resources (category_id, title, description, provider, url, resource_type, difficulty, published)
select lrc.id, x.title, x.description, x.provider, x.url, x.kind::public.resource_type, x.level::public.proficiency_level, true
from (values
  ('Technical Skills','Introduction to Programming','Foundations of programming logic','SkillBridge Learning','https://example.com/programming','course','beginner'),
  ('Technical Skills','Data Analysis Fundamentals','Practical data analysis foundations','SkillBridge Learning','https://example.com/data-analysis','course','beginner'),
  ('Business Skills','Accounting Principles','Introduction to accounting and reporting','Open Learning','https://example.com/accounting','course','beginner'),
  ('Professional Skills','Project Management Basics','Planning and delivering effective projects','Open Learning','https://example.com/project-management','course','beginner'),
  ('Professional Skills','Professional Communication','Writing and presenting in the workplace','SkillBridge Learning','https://example.com/communication','course','beginner'),
  ('Agriculture and Environment','Sustainable Agriculture','Sustainable production and extension practices','Agriculture Learning Hub','https://example.com/agriculture','training_programme','intermediate'),
  ('Creative and Media','Visual Design Foundations','Design principles for communication','Creative Learning Hub','https://example.com/design','tutorial','beginner'),
  ('Health and Safety','Community Health Foundations','Foundations of community health practice','Health Learning Hub','https://example.com/health','course','intermediate')
) as x(category_name, title, description, provider, url, kind, level)
join public.learning_resource_categories lrc on lrc.name = x.category_name
where not exists (select 1 from public.learning_resources lr where lr.title = x.title);

insert into public.learning_resource_skills (resource_id, skill_id, relevance)
select lr.id, s.id, 80
from (values ('Introduction to Programming','Programming'), ('Data Analysis Fundamentals','Data Analysis'), ('Accounting Principles','Financial Accounting'), ('Project Management Basics','Project Management'), ('Professional Communication','Written Communication'), ('Sustainable Agriculture','Agricultural Production'), ('Visual Design Foundations','Graphic Design'), ('Community Health Foundations','Clinical Care')) as x(resource_title, skill_name)
join public.learning_resources lr on lr.title = x.resource_title
join public.skills s on s.name = x.skill_name
on conflict do nothing;

insert into public.assessment_categories (name, description) values
  ('Digital Skills','Digital literacy and technology assessments'), ('Business Skills','Business and accounting assessments'), ('Communication','Communication assessments'), ('Professional Skills','Professional practice assessments'), ('Technical Skills','Technical and vocational assessments')
on conflict (name) do nothing;

-- Assessment/job examples are deliberately catalogue-safe. Job rows are created only when a demo employer exists.
DO $$ declare employer_id uuid; begin
  select ep.id into employer_id from public.employer_profiles ep join auth.users au on au.id = ep.user_id where au.email = 'employer.demo@skillbridge.mw' limit 1;
  if employer_id is not null then
    insert into public.jobs (employer_id, title, description, employment_type, industry, location_text, status, education_level, published_at)
    values
      (employer_id, 'Junior Software Developer', 'Support the development and maintenance of web applications.', 'full_time', 'Technology', 'Lilongwe, Malawi', 'published', 'diploma', now()),
      (employer_id, 'Data Analysis Intern', 'Assist with reporting, data cleaning and business insights.', 'internship', 'Business and Finance', 'Blantyre, Malawi', 'published', 'undergraduate', now()),
      (employer_id, 'Community Outreach Assistant', 'Support community education and stakeholder engagement.', 'part_time', 'Social Development', 'Mzuzu, Malawi', 'published', 'certificate', now())
    on conflict do nothing;
  end if;
end $$;

commit;

-- Demo users are not seeded here. Create them in Supabase Auth first, then assign the admin role
-- only from a trusted SQL Editor session:
-- update public.profiles set role = 'admin' where user_id = '<trusted-auth-user-uuid>';
