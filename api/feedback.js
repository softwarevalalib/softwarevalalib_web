import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(url);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

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

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, name, company, location, rating, review, created_at
        FROM client_feedback
        ORDER BY created_at DESC
        LIMIT 60
      `;
      return res.status(200).json({ reviews: rows.map(mapRow) });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

      // Honeypot — bots fill this; humans should not
      if (body.website) {
        return res.status(200).json({ ok: true });
      }

      const name = cleanText(body.name, 80);
      const company = cleanText(body.company, 100) || null;
      const location = cleanText(body.location, 100) || null;
      const review = cleanText(body.review, 1000);
      const rating = Number(body.rating);

      if (name.length < 2) {
        return res.status(400).json({ error: "Please enter your name." });
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Please choose a rating from 1 to 5 stars." });
      }
      if (review.length < 10) {
        return res.status(400).json({ error: "Please write a review of at least 10 characters." });
      }

      const rows = await sql`
        INSERT INTO client_feedback (name, company, location, rating, review)
        VALUES (${name}, ${company}, ${location}, ${rating}, ${review})
        RETURNING id, name, company, location, rating, review, created_at
      `;

      return res.status(201).json({ review: mapRow(rows[0]) });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("feedback api error:", error);
    return res.status(500).json({
      error: "Unable to process feedback right now. Please try again shortly.",
    });
  }
}
