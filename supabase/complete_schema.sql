-- SkillBridge Malawi complete Supabase PostgreSQL schema
-- Run this file first in a new Supabase project's SQL Editor.
-- Run supabase/seed.sql second. This schema stores AI outputs; it does not implement AI.

begin;

-- SECTION 1: EXTENSIONS
create extension if not exists pgcrypto;
create extension if not exists citext;

-- SECTION 2: TYPES / ENUMS
DO $$ begin
  create type public.user_role as enum ('student', 'graduate', 'employer', 'admin');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.verification_status as enum ('pending', 'submitted', 'verified', 'rejected', 'expired');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.proficiency_level as enum ('beginner', 'intermediate', 'advanced', 'expert');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.job_status as enum ('draft', 'pending_review', 'published', 'paused', 'closed', 'archived');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.employment_type as enum ('full_time', 'part_time', 'internship', 'contract', 'temporary', 'remote', 'hybrid');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.application_status as enum ('submitted', 'under_review', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.assessment_question_type as enum ('multiple_choice', 'true_false', 'short_answer');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.assessment_attempt_status as enum ('in_progress', 'submitted', 'graded', 'expired');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.resource_type as enum ('course', 'tutorial', 'video', 'book', 'article', 'certification', 'training_programme');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.recommendation_type as enum ('career', 'job', 'internship', 'learning_resource', 'skill');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.notification_type as enum ('job_recommendation', 'application_update', 'assessment_result', 'career_recommendation', 'skills_gap', 'employer_message', 'system');
exception when duplicate_object then null; end $$;
DO $$ begin
  create type public.education_level as enum ('secondary', 'certificate', 'diploma', 'undergraduate', 'postgraduate', 'masters', 'doctoral', 'any');
exception when duplicate_object then null; end $$;

-- SECTION 3: CORE USER / PROFILE TABLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text,
  email citext,
  phone text,
  gender text,
  date_of_birth date,
  profile_photo_url text,
  location text,
  district text,
  region text,
  bio text,
  institution text,
  programme text,
  study_level public.education_level,
  graduation_year integer check (graduation_year is null or graduation_year between 1900 and 2200),
  career_interests text[] not null default '{}',
  profile_completion smallint not null default 0 check (profile_completion between 0 and 100),
  company_name text,
  company_type text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists district text;
alter table public.profiles add column if not exists region text;
alter table public.profiles add column if not exists study_level text;
alter table public.profiles add column if not exists profile_completion smallint default 0;
alter table public.profiles add column if not exists status text default 'active';

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.locations(id) on delete restrict,
  name text not null,
  location_type text not null check (location_type in ('region', 'district', 'city', 'town', 'other')),
  country_code char(2) not null default 'MW',
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now(),
  unique(parent_id, name, location_type)
);

create table if not exists public.profile_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  bucket_name text not null,
  storage_path text not null,
  file_kind text not null check (file_kind in ('profile_photo', 'cv', 'certificate', 'portfolio_image', 'project_file', 'other')),
  original_name text,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  unique(bucket_name, storage_path)
);

-- SECTION 4: INSTITUTIONS / EDUCATION
create table if not exists public.institution_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  institution_type_id uuid references public.institution_types(id) on delete set null,
  name text not null unique,
  abbreviation text,
  description text,
  location_id uuid references public.locations(id) on delete set null,
  website text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faculties (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique(institution_id, name)
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique(faculty_id, name)
);

create table if not exists public.programme_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.qualifications (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  level public.education_level not null,
  description text
);

create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  institution_id uuid references public.institutions(id) on delete set null,
  category_id uuid references public.programme_categories(id) on delete set null,
  qualification_id uuid references public.qualifications(id) on delete set null,
  name text not null,
  code text,
  description text,
  duration_years numeric(3,1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id, name)
);

create table if not exists public.programme_requirements (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  requirement_type text not null check (requirement_type in ('subject', 'grade', 'document', 'experience', 'other')),
  description text not null,
  minimum_value text,
  created_at timestamptz not null default now()
);

create table if not exists public.education_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  programme_id uuid references public.programmes(id) on delete set null,
  institution_name text,
  programme_name text,
  qualification_id uuid references public.qualifications(id) on delete set null,
  start_date date,
  end_date date,
  grade text,
  is_current boolean not null default false,
  evidence_file_id uuid references public.profile_files(id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

-- SECTION 5: SKILLS
create table if not exists public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.skill_categories(id) on delete set null,
  name text not null unique,
  description text,
  skill_type text not null default 'technical' check (skill_type in ('technical', 'soft', 'business', 'communication', 'leadership', 'digital', 'creative', 'professional', 'other')),
  difficulty_level public.proficiency_level,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  proficiency_level public.proficiency_level,
  proficiency_score numeric(5,2) check (proficiency_score is null or proficiency_score between 0 and 100),
  verification_status public.verification_status not null default 'pending',
  verified_by uuid references public.profiles(user_id) on delete set null,
  years_experience numeric(4,1),
  evidence text,
  evidence_file_id uuid references public.profile_files(id) on delete set null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, skill_id)
);

create table if not exists public.programme_skills (
  programme_id uuid not null references public.programmes(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  required_level public.proficiency_level,
  importance smallint not null default 50 check (importance between 0 and 100),
  primary key (programme_id, skill_id)
);

-- SECTION 6: CAREERS / GUIDANCE
create table if not exists public.career_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.career_categories(id) on delete set null,
  title text not null unique,
  description text,
  industry text,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary_currency char(3) default 'MWK',
  demand_level text check (demand_level is null or demand_level in ('low', 'medium', 'high', 'very_high')),
  required_education public.education_level,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.career_skills (
  career_id uuid not null references public.careers(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  required_level public.proficiency_level,
  required_score numeric(5,2) check (required_score is null or required_score between 0 and 100),
  importance smallint not null default 50 check (importance between 0 and 100),
  primary key (career_id, skill_id)
);

create table if not exists public.career_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  preferred_industries text[] not null default '{}',
  preferred_locations uuid[] not null default '{}',
  preferred_work_types public.employment_type[] not null default '{}',
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  interests text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.career_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  career_id uuid not null references public.careers(id) on delete cascade,
  match_score numeric(5,2) not null check (match_score between 0 and 100),
  reasons jsonb not null default '[]',
  matched_skills uuid[] not null default '{}',
  missing_skills uuid[] not null default '{}',
  model_name text,
  model_version text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(user_id, career_id, generated_at)
);

create table if not exists public.career_recommendation_factors (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.career_recommendations(id) on delete cascade,
  factor_type text not null,
  factor_name text not null,
  factor_value numeric(8,3),
  explanation text,
  created_at timestamptz not null default now()
);

-- SECTION 7: ASSESSMENTS
create table if not exists public.assessment_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.assessment_categories(id) on delete set null,
  title text not null,
  description text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  passing_score numeric(5,2),
  published boolean not null default false,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_sections (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 1,
  unique(assessment_id, position)
);

create table if not exists public.assessment_skills (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  weight numeric(6,3) not null default 1,
  primary key (assessment_id, skill_id)
);

create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  section_id uuid references public.assessment_sections(id) on delete set null,
  skill_id uuid references public.skills(id) on delete set null,
  question_text text not null,
  question_type public.assessment_question_type not null default 'multiple_choice',
  points numeric(7,2) not null default 1,
  difficulty public.proficiency_level,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique(assessment_id, position)
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  position integer not null default 1,
  unique(question_id, position)
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  status public.assessment_attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  score numeric(5,2) check (score is null or score between 0 and 100),
  attempt_number integer not null default 1,
  unique(assessment_id, user_id, attempt_number)
);

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete restrict,
  selected_option_id uuid references public.question_options(id) on delete set null,
  answer_text text,
  is_correct boolean,
  points_awarded numeric(7,2),
  answered_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.assessment_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100),
  passed boolean,
  summary text,
  generated_at timestamptz not null default now()
);

create table if not exists public.assessment_result_skills (
  result_id uuid not null references public.assessment_results(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  score numeric(5,2) not null check (score between 0 and 100),
  proficiency_level public.proficiency_level,
  primary key(result_id, skill_id)
);

-- SECTION 8: SKILLS VERIFICATION / GAP ANALYSIS
create table if not exists public.skill_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  source_type text not null check (source_type in ('assessment', 'project', 'certificate', 'employer', 'portfolio')),
  source_id uuid,
  status public.verification_status not null default 'pending',
  verified_by uuid references public.profiles(user_id) on delete set null,
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.verification_evidence (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.skill_verifications(id) on delete cascade,
  file_id uuid references public.profile_files(id) on delete set null,
  url text,
  description text,
  created_at timestamptz not null default now(),
  check (file_id is not null or url is not null)
);

create table if not exists public.verified_projects (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.skill_verifications(id) on delete cascade,
  project_id uuid not null,
  reviewer_id uuid references public.profiles(user_id) on delete set null,
  result text,
  created_at timestamptz not null default now(),
  unique(verification_id, project_id)
);

create table if not exists public.verification_results (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null unique references public.skill_verifications(id) on delete cascade,
  score numeric(5,2) check (score between 0 and 100),
  level public.proficiency_level,
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists public.skills_gap_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  target_career_id uuid references public.careers(id) on delete set null,
  target_job_id uuid,
  overall_score numeric(5,2) check (overall_score is null or overall_score between 0 and 100),
  generated_by text,
  model_name text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.skills_gap_items (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.skills_gap_analyses(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  current_score numeric(5,2) not null default 0 check (current_score between 0 and 100),
  required_score numeric(5,2) not null check (required_score between 0 and 100),
  gap_score numeric(5,2) generated always as (greatest(required_score - current_score, 0)) stored,
  priority smallint not null default 50 check (priority between 0 and 100),
  recommendation text,
  unique(analysis_id, skill_id)
);

-- SECTION 9: LEARNING
create table if not exists public.learning_resource_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.learning_resource_categories(id) on delete set null,
  title text not null,
  description text,
  provider text,
  url text,
  resource_type public.resource_type not null default 'course',
  duration_minutes integer,
  difficulty public.proficiency_level,
  cost numeric(12,2),
  currency char(3) default 'MWK',
  published boolean not null default false,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_resource_skills (
  resource_id uuid not null references public.learning_resources(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  relevance smallint not null default 50 check (relevance between 0 and 100),
  primary key(resource_id, skill_id)
);

create table if not exists public.user_learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  resource_id uuid not null references public.learning_resources(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved', 'in_progress', 'completed')), 
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, resource_id)
);

create table if not exists public.recommended_learning_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  resource_id uuid not null references public.learning_resources(id) on delete cascade,
  gap_item_id uuid references public.skills_gap_items(id) on delete set null,
  score numeric(5,2) check (score between 0 and 100),
  explanation text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz
);

-- SECTION 10: PORTFOLIO
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  title text,
  bio text,
  is_public boolean not null default false,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  title text not null,
  description text,
  technologies text[] not null default '{}',
  project_url text,
  github_url text,
  completion_date date,
  role text,
  outcome text,
  verification_status public.verification_status not null default 'pending',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_skills (
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  primary key(project_id, skill_id)
);

create table if not exists public.portfolio_project_files (
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  file_id uuid not null references public.profile_files(id) on delete cascade,
  position integer not null default 1,
  primary key(project_id, file_id)
);

create table if not exists public.portfolio_certificates (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  title text not null,
  issuer text,
  issued_date date,
  credential_url text,
  file_id uuid references public.profile_files(id) on delete set null,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_links (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.work_experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  organization text,
  description text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

-- SECTION 11: EMPLOYERS
create table if not exists public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  company_name text not null,
  description text,
  industry text,
  company_size text,
  location_id uuid references public.locations(id) on delete set null,
  location_text text,
  website text,
  logo_file_id uuid references public.profile_files(id) on delete set null,
  contact_information jsonb not null default '{}',
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SECTION 12: JOBS / INTERNSHIPS
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles(id) on delete restrict,
  title text not null,
  description text not null,
  employment_type public.employment_type not null,
  industry text,
  location_id uuid references public.locations(id) on delete set null,
  location_text text,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary_currency char(3) not null default 'MWK',
  application_deadline date,
  status public.job_status not null default 'draft',
  experience_level public.proficiency_level,
  education_level public.education_level,
  vacancy_count integer not null default 1 check (vacancy_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  check (salary_max is null or salary_min is null or salary_max >= salary_min)
);

create table if not exists public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  required_level public.proficiency_level,
  required_score numeric(5,2) check (required_score is null or required_score between 0 and 100),
  importance smallint not null default 50 check (importance between 0 and 100),
  primary key(job_id, skill_id)
);

create table if not exists public.job_qualifications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  qualification_id uuid references public.qualifications(id) on delete set null,
  description text,
  required boolean not null default true
);

create table if not exists public.job_locations (
  job_id uuid not null references public.jobs(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete restrict,
  primary key(job_id, location_id)
);

create table if not exists public.job_benefits (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  benefit text not null
);

create table if not exists public.saved_jobs (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key(user_id, job_id)
);

-- SECTION 13: APPLICATIONS
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(user_id) on delete restrict,
  job_id uuid not null references public.jobs(id) on delete restrict,
  cover_letter text,
  cv_file_id uuid references public.profile_files(id) on delete set null,
  portfolio_id uuid references public.portfolios(id) on delete set null,
  status public.application_status not null default 'submitted',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(applicant_id, job_id)
);

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  status public.application_status not null,
  note text,
  changed_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

-- SECTION 14: AI MATCHING / RECOMMENDATIONS
create table if not exists public.candidate_job_matches (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(user_id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  overall_match_score numeric(5,2) not null check (overall_match_score between 0 and 100),
  skills_match_score numeric(5,2) check (skills_match_score between 0 and 100),
  education_match_score numeric(5,2) check (education_match_score between 0 and 100),
  experience_match_score numeric(5,2) check (experience_match_score between 0 and 100),
  portfolio_match_score numeric(5,2) check (portfolio_match_score between 0 and 100),
  matched_skills uuid[] not null default '{}',
  missing_skills uuid[] not null default '{}',
  explanation jsonb not null default '{}',
  model_name text,
  model_version text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(candidate_id, job_id, generated_at)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  recommendation_type public.recommendation_type not null,
  target_id uuid not null,
  score numeric(5,2) check (score between 0 and 100),
  explanation text,
  reasons jsonb not null default '[]',
  model_name text,
  model_version text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- SECTION 15: NOTIFICATIONS / MESSAGING / FEEDBACK
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(user_id) on delete restrict,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.employer_feedback (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(user_id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  rating smallint check (rating between 1 and 5),
  comments text,
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_feedback (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(user_id) on delete cascade,
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  rating smallint check (rating between 1 and 5),
  comments text,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete set null,
  rating smallint check (rating between 1 and 5),
  category text,
  comments text,
  created_at timestamptz not null default now()
);

-- SECTION 16: ADMIN / AUDIT
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(user_id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.moderation_records (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  admin_user_id uuid references public.profiles(user_id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(user_id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Deferred relationships whose parent tables are declared later in this file.
DO $$ begin
  if not exists (select 1 from pg_constraint where conname = 'verified_projects_project_id_fkey') then
    alter table public.verified_projects add constraint verified_projects_project_id_fkey
      foreign key (project_id) references public.portfolio_projects(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'skills_gap_analyses_target_job_id_fkey') then
    alter table public.skills_gap_analyses add constraint skills_gap_analyses_target_job_id_fkey
      foreign key (target_job_id) references public.jobs(id) on delete set null;
  end if;
end $$;

-- SECTION 17: INDEXES
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists locations_parent_idx on public.locations(parent_id);
create index if not exists skills_name_idx on public.skills(name);
create index if not exists careers_title_idx on public.careers(title);
create index if not exists programmes_institution_idx on public.programmes(institution_id);
create index if not exists user_skills_user_idx on public.user_skills(user_id);
create index if not exists user_skills_skill_idx on public.user_skills(skill_id);
create index if not exists career_skills_career_idx on public.career_skills(career_id);
create index if not exists assessments_published_idx on public.assessments(published);
create index if not exists assessment_attempts_user_idx on public.assessment_attempts(user_id);
create index if not exists assessment_attempts_assessment_idx on public.assessment_attempts(assessment_id);
create index if not exists learning_resources_published_idx on public.learning_resources(published);
create index if not exists learning_progress_user_idx on public.user_learning_progress(user_id);
create index if not exists jobs_employer_idx on public.jobs(employer_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_industry_idx on public.jobs(industry);
create index if not exists applications_applicant_idx on public.applications(applicant_id);
create index if not exists applications_job_idx on public.applications(job_id);
create index if not exists notifications_user_idx on public.notifications(user_id, read);
create index if not exists candidate_matches_candidate_idx on public.candidate_job_matches(candidate_id);
create index if not exists candidate_matches_job_idx on public.candidate_job_matches(job_id);
create index if not exists recommendations_user_idx on public.recommendations(user_id, recommendation_type);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

-- SECTION 18: FUNCTIONS / TRIGGERS
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin');
$$;

create or replace function public.prevent_public_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'admin' and old.role is distinct from 'admin' and (select auth.uid()) is not null then
    if not public.is_admin() then raise exception 'Only an administrator can assign the admin role'; end if;
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare requested_role text := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
begin
  if requested_role not in ('student', 'graduate', 'employer') then requested_role := 'student'; end if;
  insert into public.profiles (id, user_id, role, full_name, email, institution, programme, career_interests, company_name, company_type)
  values (new.id, new.id, requested_role::public.user_role, nullif(new.raw_user_meta_data->>'full_name',''), new.email,
    nullif(new.raw_user_meta_data->>'institution',''), nullif(new.raw_user_meta_data->>'programme',''),
    case when jsonb_typeof(new.raw_user_meta_data->'career_interests') = 'array' then array(select jsonb_array_elements_text(new.raw_user_meta_data->'career_interests')) else '{}' end,
    nullif(new.raw_user_meta_data->>'company_name',''), nullif(new.raw_user_meta_data->>'company_type',''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.log_profile_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role is distinct from new.role then
    insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    values ((select auth.uid()), 'role_changed', 'profile', new.user_id, jsonb_build_object('old_role', old.role, 'new_role', new.role));
  end if;
  return new;
end;
$$;

create or replace function public.log_application_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    values ((select auth.uid()), 'application_status_changed', 'application', new.id, jsonb_build_object('old_status', old.status, 'new_status', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.prevent_public_role_escalation();
drop trigger if exists profiles_audit_role_change on public.profiles;
create trigger profiles_audit_role_change after update on public.profiles for each row execute function public.log_profile_role_change();
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
drop trigger if exists applications_audit_status_change on public.applications;
create trigger applications_audit_status_change after update on public.applications for each row execute function public.log_application_status_change();

DO $$ declare t text; begin
  foreach t in array array['institutions','programmes','skills','careers','assessments','learning_resources','user_learning_progress','portfolios','portfolio_projects','employer_profiles','jobs','applications','conversations'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    begin execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t); exception when undefined_column then null; end;
  end loop;
end $$;

-- SECTION 19: RLS
DO $$ declare t text; begin
  foreach t in array array['profiles','locations','profile_files','institution_types','institutions','faculties','departments','programme_categories','qualifications','programmes','programme_requirements','education_history','skill_categories','skills','user_skills','programme_skills','career_categories','careers','career_skills','career_preferences','career_recommendations','career_recommendation_factors','assessment_categories','assessments','assessment_sections','assessment_skills','assessment_questions','question_options','assessment_attempts','assessment_answers','assessment_results','assessment_result_skills','skill_verifications','verification_evidence','verified_projects','verification_results','skills_gap_analyses','skills_gap_items','learning_resource_categories','learning_resources','learning_resource_skills','user_learning_progress','recommended_learning_resources','portfolios','portfolio_projects','project_skills','portfolio_project_files','portfolio_certificates','portfolio_links','work_experience','employer_profiles','jobs','job_skills','job_qualifications','job_locations','job_benefits','saved_jobs','applications','application_events','candidate_job_matches','recommendations','notifications','conversations','conversation_participants','messages','employer_feedback','candidate_feedback','platform_feedback','system_settings','moderation_records','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Public catalogue data is readable; writes are admin-only.
create policy "public read active locations" on public.locations for select using (true);
create policy "authenticated read catalogue institutions" on public.institutions for select to authenticated using (true);
create policy "authenticated read catalogue faculties" on public.faculties for select to authenticated using (true);
create policy "authenticated read catalogue departments" on public.departments for select to authenticated using (true);
create policy "authenticated read catalogue programmes" on public.programmes for select to authenticated using (active or public.is_admin());
create policy "authenticated read catalogue skills" on public.skills for select to authenticated using (active or public.is_admin());
create policy "authenticated read catalogue careers" on public.careers for select to authenticated using (active or public.is_admin());
create policy "public read published jobs" on public.jobs for select using (status = 'published' or public.is_admin() or exists (select 1 from public.employer_profiles ep where ep.id = employer_id and ep.user_id = (select auth.uid())));
create policy "authenticated read published resources" on public.learning_resources for select to authenticated using (published or public.is_admin());

create policy "own profile select" on public.profiles for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "own profile insert" on public.profiles for insert to authenticated with check (user_id = (select auth.uid()) and role <> 'admin');
create policy "own profile update" on public.profiles for update to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check ((user_id = (select auth.uid()) and role <> 'admin') or public.is_admin());
create policy "own profile files" on public.profile_files for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "own education" on public.education_history for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "own skills" on public.user_skills for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "own preferences" on public.career_preferences for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "own career recommendations" on public.career_recommendations for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "own assessment attempts" on public.assessment_attempts for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "own assessment answers" on public.assessment_answers for all to authenticated using (exists (select 1 from public.assessment_attempts a where a.id = attempt_id and (a.user_id = (select auth.uid()) or public.is_admin()))) with check (exists (select 1 from public.assessment_attempts a where a.id = attempt_id and (a.user_id = (select auth.uid()) or public.is_admin())));
create policy "own assessment results" on public.assessment_results for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "own gap analyses" on public.skills_gap_analyses for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "own gap items" on public.skills_gap_items for select to authenticated using (exists (select 1 from public.skills_gap_analyses a where a.id = analysis_id and (a.user_id = (select auth.uid()) or public.is_admin())));
create policy "own learning progress" on public.user_learning_progress for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "own portfolios" on public.portfolios for all to authenticated using (user_id = (select auth.uid()) or is_public or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "portfolio projects access" on public.portfolio_projects for all to authenticated using (exists (select 1 from public.portfolios p where p.id = portfolio_id and (p.user_id = (select auth.uid()) or p.is_public or public.is_admin()))) with check (exists (select 1 from public.portfolios p where p.id = portfolio_id and (p.user_id = (select auth.uid()) or public.is_admin())));
create policy "portfolio project skills access" on public.project_skills for all to authenticated using (exists (select 1 from public.portfolio_projects pp join public.portfolios p on p.id = pp.portfolio_id where pp.id = project_id and (p.user_id = (select auth.uid()) or p.is_public or public.is_admin()))) with check (exists (select 1 from public.portfolio_projects pp join public.portfolios p on p.id = pp.portfolio_id where pp.id = project_id and (p.user_id = (select auth.uid()) or public.is_admin())));
create policy "own work experience" on public.work_experience for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "own employer profile" on public.employer_profiles for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "employer manages jobs" on public.jobs for all to authenticated using (public.is_admin() or exists (select 1 from public.employer_profiles ep where ep.id = employer_id and ep.user_id = (select auth.uid()))) with check (public.is_admin() or exists (select 1 from public.employer_profiles ep where ep.id = employer_id and ep.user_id = (select auth.uid())));
create policy "employer job skills" on public.job_skills for all to authenticated using (public.is_admin() or exists (select 1 from public.jobs j join public.employer_profiles ep on ep.id = j.employer_id where j.id = job_id and ep.user_id = (select auth.uid()))) with check (public.is_admin() or exists (select 1 from public.jobs j join public.employer_profiles ep on ep.id = j.employer_id where j.id = job_id and ep.user_id = (select auth.uid())));
create policy "own saved jobs" on public.saved_jobs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own applications" on public.applications for all to authenticated using (applicant_id = (select auth.uid()) or public.is_admin() or exists (select 1 from public.jobs j join public.employer_profiles ep on ep.id = j.employer_id where j.id = job_id and ep.user_id = (select auth.uid()))) with check (applicant_id = (select auth.uid()) or public.is_admin());
create policy "application events access" on public.application_events for select to authenticated using (exists (select 1 from public.applications a where a.id = application_id and (a.applicant_id = (select auth.uid()) or public.is_admin() or exists (select 1 from public.jobs j join public.employer_profiles ep on ep.id = j.employer_id where j.id = a.job_id and ep.user_id = (select auth.uid())))));
create policy "own matches or employer matches" on public.candidate_job_matches for select to authenticated using (candidate_id = (select auth.uid()) or public.is_admin() or exists (select 1 from public.jobs j join public.employer_profiles ep on ep.id = j.employer_id where j.id = job_id and ep.user_id = (select auth.uid())));
create policy "own recommendations" on public.recommendations for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "own notifications" on public.notifications for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "conversation participant read" on public.conversations for select to authenticated using (exists (select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = (select auth.uid())) or public.is_admin());
create policy "conversation participant manage" on public.conversation_participants for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "conversation messages" on public.messages for all to authenticated using (sender_id = (select auth.uid()) or exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = (select auth.uid())) or public.is_admin()) with check (sender_id = (select auth.uid()) and exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = (select auth.uid())));
create policy "own platform feedback" on public.platform_feedback for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());

-- Admin-only writes to catalogue and system tables.
create policy "admins manage institutions" on public.institutions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage faculties" on public.faculties for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage departments" on public.departments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage programmes" on public.programmes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage skills" on public.skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage careers" on public.careers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage assessments" on public.assessments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage resources" on public.learning_resources for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage settings" on public.system_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage moderation" on public.moderation_records for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit" on public.audit_logs for select to authenticated using (public.is_admin());

-- Every RLS-enabled table has an explicit administrator policy. The policy name is
-- generated per table so this remains maintainable as the catalogue grows.
DO $$ declare t text; policy_name text; begin
  foreach t in array array['institution_types','programme_categories','qualifications','programme_requirements','skill_categories','programme_skills','career_categories','career_skills','career_recommendation_factors','assessment_categories','assessment_sections','assessment_skills','assessment_questions','question_options','assessment_result_skills','skill_verifications','verification_evidence','verified_projects','verification_results','learning_resource_categories','learning_resource_skills','recommended_learning_resources','portfolio_certificates','portfolio_links','portfolio_project_files','job_qualifications','job_locations','job_benefits','employer_feedback','candidate_feedback','candidate_job_matches','application_events','recommendations','conversation_participants','messages'] loop
    policy_name := 'admins manage ' || t;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = policy_name) then
      execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', policy_name, t);
    end if;
  end loop;
end $$;

-- SECTION 20: VIEWS / ANALYTICS
create or replace view public.platform_metrics as
select
  (select count(*) from public.profiles where role = 'student') as total_students,
  (select count(*) from public.profiles where role = 'graduate') as total_graduates,
  (select count(*) from public.profiles where role = 'employer') as total_employers,
  (select count(*) from public.jobs) as total_jobs,
  (select count(*) from public.jobs where status = 'published') as active_jobs,
  (select count(*) from public.applications) as total_applications,
  (select count(*) from public.applications where status = 'accepted') as successful_applications,
  (select count(*) from public.assessment_attempts) as assessment_participation;

create or replace view public.popular_skills as
select s.id, s.name, count(us.user_id)::bigint as user_count
from public.skills s left join public.user_skills us on us.skill_id = s.id
group by s.id, s.name order by user_count desc;

create or replace view public.popular_careers as
select c.id, c.title, count(cr.user_id)::bigint as recommendation_count
from public.careers c left join public.career_recommendations cr on cr.career_id = c.id
group by c.id, c.title order by recommendation_count desc;

commit;
