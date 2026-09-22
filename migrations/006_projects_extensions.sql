-- Extend projects with additional portfolio fields
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS technologies TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS completion_date DATE,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS outcome TEXT,
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;

-- Ensure images default is empty array
UPDATE projects SET images = '[]'::jsonb WHERE images IS NULL;
