-- Extend student_profiles and add experiences table and user_skills columns
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS career_interests TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_industries TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_locations TEXT[],
  ADD COLUMN IF NOT EXISTS employment_type TEXT,
  ADD COLUMN IF NOT EXISTS career_goals TEXT;

-- add years_experience to user_skills
ALTER TABLE user_skills
  ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- experiences table for work history
CREATE TABLE IF NOT EXISTS user_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure certificates table exists (already in v1 but safe to include)
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuer TEXT,
  url TEXT,
  issued_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add completion_percent default if missing
ALTER TABLE student_profiles
  ALTER COLUMN completion_percent SET DEFAULT 0;
