-- Add skill link and difficulty to questions and time limit to assessments
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS difficulty SMALLINT;

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER;
