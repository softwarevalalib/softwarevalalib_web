import http from "node:http";
import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const PORT = Number(process.env.FEEDBACK_API_PORT || 3001);

function cleanText(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    company: row.company || "",
    location: row.location || "",
    rating: Number(row.rating),
    review: row.review,
    createdAt: row.created_at,
  };
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolveBody({});
      try {
        resolveBody(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (req.url?.split("?")[0] !== "/api/feedback") {
    return sendJson(res, 404, { error: "Not found" });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return sendJson(res, 500, { error: "DATABASE_URL is not configured in .env.local" });
    }
    const sql = neon(process.env.DATABASE_URL);

    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, name, company, location, rating, review, created_at
        FROM client_feedback
        ORDER BY created_at DESC
        LIMIT 60
      `;
      return sendJson(res, 200, { reviews: rows.map(mapRow) });
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      if (body.website) return sendJson(res, 200, { ok: true });

      const name = cleanText(body.name, 80);
      const company = cleanText(body.company, 100) || null;
      const location = cleanText(body.location, 100) || null;
      const review = cleanText(body.review, 1000);
      const rating = Number(body.rating);

      if (name.length < 2) return sendJson(res, 400, { error: "Please enter your name." });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return sendJson(res, 400, { error: "Please choose a rating from 1 to 5 stars." });
      }
      if (review.length < 10) {
        return sendJson(res, 400, { error: "Please write a review of at least 10 characters." });
      }

      const rows = await sql`
        INSERT INTO client_feedback (name, company, location, rating, review)
        VALUES (${name}, ${company}, ${location}, ${rating}, ${review})
        RETURNING id, name, company, location, rating, review, created_at
      `;
      return sendJson(res, 201, { review: mapRow(rows[0]) });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: "Unable to process feedback right now. Please try again shortly.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Feedback API listening on http://localhost:${PORT}/api/feedback`);
});
