-- Add many-to-many table to link careers with academic programs
CREATE TABLE IF NOT EXISTS career_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES academic_programs(id) ON DELETE CASCADE,
  UNIQUE(career_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_career_programs_career ON career_programs(career_id);
CREATE INDEX IF NOT EXISTS idx_career_programs_program ON career_programs(program_id);
