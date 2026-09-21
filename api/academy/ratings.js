import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
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

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress || "anon";
  const ua = (req.headers["user-agent"] || "ua").slice(0, 80);
  return `${ip}|${ua}`;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();

    if (req.method === "GET") {
      const courseId = cleanText(req.query?.courseId || "", 80);
      if (courseId) {
        const rows = await sql`
          SELECT
            COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average,
            COUNT(*)::int AS count
          FROM academy_course_ratings
          WHERE course_id = ${courseId}
        `;
        return res.status(200).json({
          courseId,
          averageRating: Number(rows[0]?.average || 0),
          ratingCount: Number(rows[0]?.count || 0),
        });
      }

      const rows = await sql`
        SELECT
          course_id,
          COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average,
          COUNT(*)::int AS count
        FROM academy_course_ratings
        GROUP BY course_id
      `;
      const ratings = {};
      for (const row of rows) {
        ratings[row.course_id] = {
          averageRating: Number(row.average || 0),
          ratingCount: Number(row.count || 0),
        };
      }
      return res.status(200).json({ ratings });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      if (body.website) return res.status(200).json({ ok: true });

      const courseId = cleanText(body.courseId, 80);
      const rating = Number(body.rating);
      if (!courseId) return res.status(400).json({ error: "Course is required." });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Choose a rating from 1 to 5." });
      }

      const reviewerKey = cleanText(body.reviewerKey, 120) || getClientKey(req);

      await sql`
        INSERT INTO academy_course_ratings (course_id, rating, reviewer_key)
        VALUES (${courseId}, ${rating}, ${reviewerKey})
        ON CONFLICT (course_id, reviewer_key)
        DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
      `;

      const rows = await sql`
        SELECT
          COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average,
          COUNT(*)::int AS count
        FROM academy_course_ratings
        WHERE course_id = ${courseId}
      `;

      return res.status(200).json({
        courseId,
        averageRating: Number(rows[0]?.average || 0),
        ratingCount: Number(rows[0]?.count || 0),
        message: "Thank you for your rating.",
      });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("academy ratings error:", error);
    return res.status(500).json({ error: "Unable to process rating right now." });
  }
}
