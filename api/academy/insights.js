import {
  getSql,
  setCors,
  cleanText,
  requireAdmin,
  parseBody,
  getClientGeo,
} from "./_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();

    if (req.method === "POST") {
      const body = parseBody(req);
      if (body.website) return res.status(200).json({ ok: true });

      const eventName = cleanText(body.eventName || body.name || "", 80);
      if (!eventName) return res.status(400).json({ error: "eventName is required." });

      const geo = getClientGeo(req);
      const ua = cleanText(req.headers["user-agent"] || "", 180);

      await sql`
        INSERT INTO academy_events (
          event_name, path, course_id, course_code, source,
          visitor_id, session_id, referrer, country, region, city,
          timezone, user_agent, metadata
        ) VALUES (
          ${eventName},
          ${cleanText(body.path, 240) || null},
          ${cleanText(body.courseId, 80) || null},
          ${cleanText(body.courseCode || body.course, 40) || null},
          ${cleanText(body.source, 80) || null},
          ${cleanText(body.visitorId, 80) || null},
          ${cleanText(body.sessionId, 80) || null},
          ${cleanText(body.referrer, 300) || null},
          ${cleanText(body.country, 40) || geo.country},
          ${cleanText(body.region, 80) || geo.region},
          ${cleanText(body.city, 80) || geo.city},
          ${cleanText(body.timezone, 80) || null},
          ${ua || null},
          ${JSON.stringify(body.metadata && typeof body.metadata === "object" ? body.metadata : {})}
        )
      `;

      return res.status(201).json({ ok: true });
    }

    if (req.method === "GET") {
      const admin = await requireAdmin(req, sql);
      if (!admin) return res.status(401).json({ error: "Unauthorized" });

      const days = Math.min(Math.max(Number(req.query?.days) || 30, 1), 90);
      const limit = Math.min(Math.max(Number(req.query?.limit) || 100, 1), 500);

      const [totals, byDay, byEvent, byCountry, byCourse, recent, returning] =
        await Promise.all([
          sql`
            SELECT
              COUNT(*)::int AS total_events,
              COUNT(DISTINCT visitor_id)::int AS unique_visitors,
              COUNT(*) FILTER (WHERE event_name = 'academy_page_view')::int AS page_views,
              COUNT(*) FILTER (WHERE event_name = 'course_view')::int AS course_views,
              COUNT(*) FILTER (WHERE event_name = 'enroll_click')::int AS enroll_clicks,
              COUNT(*) FILTER (WHERE event_name = 'enrollment_submitted')::int AS enrollments_tracked,
              COUNT(*) FILTER (WHERE event_name = 'course_rating')::int AS rating_events
            FROM academy_events
            WHERE created_at >= NOW() - make_interval(days => ${days})
          `,
          sql`
            SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
                   COUNT(*)::int AS events,
                   COUNT(*) FILTER (WHERE event_name = 'academy_page_view')::int AS page_views,
                   COUNT(*) FILTER (WHERE event_name = 'course_view')::int AS course_views,
                   COUNT(*) FILTER (WHERE event_name = 'enroll_click')::int AS enroll_clicks
            FROM academy_events
            WHERE created_at >= NOW() - make_interval(days => ${days})
            GROUP BY 1
            ORDER BY 1 ASC
          `,
          sql`
            SELECT event_name, COUNT(*)::int AS count
            FROM academy_events
            WHERE created_at >= NOW() - make_interval(days => ${days})
            GROUP BY event_name
            ORDER BY count DESC
            LIMIT 20
          `,
          sql`
            SELECT COALESCE(NULLIF(country, ''), 'Unknown') AS country,
                   COUNT(*)::int AS count,
                   COUNT(DISTINCT visitor_id)::int AS visitors
            FROM academy_events
            WHERE created_at >= NOW() - make_interval(days => ${days})
            GROUP BY 1
            ORDER BY count DESC
            LIMIT 15
          `,
          sql`
            SELECT COALESCE(NULLIF(course_code, ''), course_id, 'Unknown') AS course,
                   COUNT(*) FILTER (WHERE event_name = 'course_view')::int AS views,
                   COUNT(*) FILTER (WHERE event_name = 'enroll_click')::int AS enroll_clicks
            FROM academy_events
            WHERE created_at >= NOW() - make_interval(days => ${days})
              AND (course_code IS NOT NULL OR course_id IS NOT NULL)
            GROUP BY 1
            ORDER BY views DESC
            LIMIT 15
          `,
          sql`
            SELECT id, event_name, path, course_code, source, visitor_id,
                   country, region, city, timezone, referrer, created_at
            FROM academy_events
            ORDER BY created_at DESC
            LIMIT ${limit}
          `,
          sql`
            SELECT COUNT(*)::int AS returning_visitors
            FROM (
              SELECT visitor_id
              FROM academy_events
              WHERE visitor_id IS NOT NULL
                AND created_at >= NOW() - make_interval(days => ${days})
              GROUP BY visitor_id
              HAVING COUNT(DISTINCT DATE_TRUNC('day', created_at)) > 1
            ) t
          `,
        ]);

      return res.status(200).json({
        days,
        totals: {
          ...totals[0],
          returning_visitors: returning[0]?.returning_visitors || 0,
        },
        byDay,
        byEvent,
        byCountry,
        byCourse,
        recent,
      });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("academy insights error:", error);
    return res.status(500).json({ error: "Unable to process insights request." });
  }
}
