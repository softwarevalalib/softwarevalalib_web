-- SVL Training Academy — Neon schema
-- Project: softwarevalalib-web

CREATE TABLE IF NOT EXISTS academy_course_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  reviewer_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, reviewer_key)
);

CREATE INDEX IF NOT EXISTS academy_course_ratings_course_idx
  ON academy_course_ratings (course_id);

CREATE TABLE IF NOT EXISTS academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  county TEXT,
  country TEXT,
  education_level TEXT,
  occupation TEXT,
  employer TEXT,
  course_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  programme_type TEXT,
  preferred_session TEXT,
  has_laptop BOOLEAN,
  has_internet BOOLEAN,
  basic_computer_knowledge BOOLEAN,
  heard_about TEXT,
  motivation TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS academy_enrollments_created_idx
  ON academy_enrollments (created_at DESC);

CREATE SEQUENCE IF NOT EXISTS academy_enrollment_seq START 1;
