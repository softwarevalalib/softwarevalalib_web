import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SESSION_DAYS = 7;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

let portalSchemaReady = false;

/** Create Academy Portal tables if missing (safe to call repeatedly). */
export async function ensurePortalSchema(sql) {
  if (portalSchemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS academy_portal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    enrollment_id UUID,
    course_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS academy_portal_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES academy_portal_users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS academy_portal_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    tuition NUMERIC(10,2) DEFAULT 0,
    registration_fee NUMERIC(10,2) DEFAULT 0,
    instructor_id UUID REFERENCES academy_portal_users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS academy_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES academy_portal_users(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    assessment_type TEXT NOT NULL DEFAULT 'assignment',
    title TEXT NOT NULL,
    score NUMERIC(5,2),
    max_score NUMERIC(5,2) DEFAULT 100,
    grade_letter TEXT,
    notes TEXT,
    recorded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS academy_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES academy_portal_users(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    session_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'present',
    notes TEXT,
    recorded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS academy_fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES academy_portal_users(id) ON DELETE CASCADE,
    enrollment_id UUID,
    course_code TEXT,
    amount NUMERIC(10,2) NOT NULL,
    installment_number SMALLINT,
    payment_method TEXT,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    notes TEXT,
    recorded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS academy_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT NOT NULL UNIQUE,
    student_id UUID REFERENCES academy_portal_users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    course_code TEXT,
    course_title TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    file_name TEXT,
    file_base64 TEXT,
    file_mime TEXT DEFAULT 'application/pdf',
    status TEXT NOT NULL DEFAULT 'issued',
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE academy_enrollments ADD COLUMN IF NOT EXISTS portal_user_id UUID`;
  await sql`ALTER TABLE academy_enrollments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`;
  await sql`ALTER TABLE academy_enrollments ADD COLUMN IF NOT EXISTS approved_by UUID`;
  await sql`ALTER TABLE academy_grades ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'`;
  await sql`ALTER TABLE academy_grades ADD COLUMN IF NOT EXISTS submitted_by UUID`;
  await sql`ALTER TABLE academy_grades ADD COLUMN IF NOT EXISTS reviewed_by UUID`;
  await sql`ALTER TABLE academy_grades ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`;
  await sql`ALTER TABLE academy_portal_courses ADD COLUMN IF NOT EXISTS category TEXT`;
  await sql`ALTER TABLE academy_portal_courses ADD COLUMN IF NOT EXISTS level TEXT`;
  await sql`ALTER TABLE academy_portal_courses ADD COLUMN IF NOT EXISTS slug TEXT`;
  await sql`ALTER TABLE academy_portal_courses ADD COLUMN IF NOT EXISTS image TEXT`;
  await sql`ALTER TABLE academy_portal_courses ADD COLUMN IF NOT EXISTS programme_type TEXT`;
  await sql`ALTER TABLE academy_portal_courses ADD COLUMN IF NOT EXISTS long_description TEXT`;
  await sql`CREATE TABLE IF NOT EXISTS academy_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ,
    attachment_name TEXT,
    attachment_base64 TEXT,
    attachment_mime TEXT,
    created_by UUID REFERENCES academy_portal_users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS academy_assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES academy_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES academy_portal_users(id) ON DELETE CASCADE,
    content TEXT,
    attachment_name TEXT,
    attachment_base64 TEXT,
    attachment_mime TEXT,
    score NUMERIC(5,2),
    max_score NUMERIC(5,2) DEFAULT 100,
    feedback TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    graded_by UUID,
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS academy_classroom_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    meeting_url TEXT NOT NULL,
    platform TEXT,
    created_by UUID REFERENCES academy_portal_users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  portalSchemaReady = true;
}

export function setCors(res, extraHeaders = "") {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,OPTIONS");
  const base = "Content-Type, Authorization, x-academy-admin-key";
  res.setHeader(
    "Access-Control-Allow-Headers",
    extraHeaders ? `${base}, ${extraHeaders}` : base
  );
}

export function cleanText(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const next = scryptSync(password, salt, SCRYPT_KEYLEN);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export async function ensureAdminBootstrap(sql) {
  const rows = await sql`SELECT COUNT(*)::int AS count FROM academy_admins`;
  if (Number(rows[0]?.count || 0) > 0) return;

  const email = cleanText(process.env.ACADEMY_ADMIN_EMAIL || "", 120).toLowerCase();
  const password = process.env.ACADEMY_ADMIN_PASSWORD || "";
  if (!email.includes("@") || password.length < 8) {
    throw new Error(
      "No academy admin exists. Set ACADEMY_ADMIN_EMAIL and ACADEMY_ADMIN_PASSWORD (min 8 chars) to bootstrap."
    );
  }

  await sql`
    INSERT INTO academy_admins (email, password_hash, name)
    VALUES (${email}, ${hashPassword(password)}, ${"Academy Admin"})
  `;
}

export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return cleanText(req.headers["x-academy-session"] || "", 128);
}

export async function requireAdmin(req, sql) {
  await ensureAdminBootstrap(sql);
  const token = getBearerToken(req);
  if (!token) return null;

  const rows = await sql`
    SELECT a.id, a.email, a.name, s.expires_at
    FROM academy_admin_sessions s
    JOIN academy_admins a ON a.id = s.admin_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sql`DELETE FROM academy_admin_sessions WHERE token = ${token}`;
    return null;
  }
  return { id: row.id, email: row.email, name: row.name || "Admin" };
}

export async function createSession(sql, adminId) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO academy_admin_sessions (admin_id, token, expires_at)
    VALUES (${adminId}, ${token}, ${expires.toISOString()})
  `;
  return { token, expiresAt: expires.toISOString() };
}

export function getClientGeo(req) {
  const country =
    cleanText(req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || "", 8) ||
    null;
  const region =
    cleanText(req.headers["x-vercel-ip-country-region"] || "", 40) || null;
  const city = cleanText(req.headers["x-vercel-ip-city"] || "", 80) || null;
  return { country, region, city };
}

export function parseBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }
  return req.body || {};
}
