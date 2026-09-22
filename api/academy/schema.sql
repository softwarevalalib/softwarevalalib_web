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

CREATE TABLE IF NOT EXISTS academy_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academy_admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES academy_admins(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS academy_admin_sessions_token_idx ON academy_admin_sessions (token);

CREATE TABLE IF NOT EXISTS academy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  path TEXT,
  course_id TEXT,
  course_code TEXT,
  source TEXT,
  visitor_id TEXT,
  session_id TEXT,
  referrer TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS academy_events_name_created_idx ON academy_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS academy_events_created_idx ON academy_events (created_at DESC);
CREATE INDEX IF NOT EXISTS academy_events_visitor_idx ON academy_events (visitor_id, created_at DESC);

-- AI Assistant / admissions (see Neon migrations applied live)
-- academy_chat_sessions, academy_chat_messages, academy_chat_events
-- academy_enrollment_drafts, academy_unanswered_questions
-- academy_knowledge_articles, academy_admission_documents
-- academy_assistant_settings
