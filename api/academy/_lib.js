import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SESSION_DAYS = 7;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
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
