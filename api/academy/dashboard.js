import { getSql, setCors, requireAdmin } from "./_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sql = getSql();
    const admin = await requireAdmin(req, sql);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });

    const days = Math.min(Math.max(Number(req.query?.days) || 30, 1), 90);

    const [
      enrollmentStats,
      enrollmentsByDay,
      enrollmentsByStatus,
      recentEnrollments,
      ratingStats,
      ratingsByDay,
      topRated,
      recentRatings,
      insightTotals,
    ] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
          COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
          COUNT(*) FILTER (WHERE status = 'enrolled')::int AS enrolled,
          COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
          COUNT(*) FILTER (WHERE created_at >= NOW() - make_interval(days => ${days}))::int AS recent
        FROM academy_enrollments
      `,
      sql`
        SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM academy_enrollments
        WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      sql`
        SELECT status, COUNT(*)::int AS count
        FROM academy_enrollments
        GROUP BY status
        ORDER BY count DESC
      `,
      sql`
        SELECT id, reference_number, full_name, email, phone, course_codes,
               programme_type, preferred_session, county, country, status, created_at
        FROM academy_enrollments
        ORDER BY created_at DESC
        LIMIT 25
      `,
      sql`
        SELECT
          COUNT(*)::int AS total_ratings,
          COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating,
          COUNT(DISTINCT course_id)::int AS rated_courses
        FROM academy_course_ratings
      `,
      sql`
        SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count,
               COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average
        FROM academy_course_ratings
        WHERE created_at >= NOW() - make_interval(days => ${days})
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      sql`
        SELECT course_id,
               COUNT(*)::int AS rating_count,
               COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating
        FROM academy_course_ratings
        GROUP BY course_id
        ORDER BY average_rating DESC, rating_count DESC
        LIMIT 10
      `,
      sql`
        SELECT id, course_id, rating, reviewer_key, created_at, updated_at
        FROM academy_course_ratings
        ORDER BY updated_at DESC
        LIMIT 25
      `,
      sql`
        SELECT
          COUNT(*)::int AS total_events,
          COUNT(DISTINCT visitor_id)::int AS unique_visitors,
          COUNT(*) FILTER (WHERE event_name = 'course_view')::int AS course_views,
          COUNT(*) FILTER (WHERE event_name = 'enroll_click')::int AS enroll_clicks,
          COUNT(*) FILTER (WHERE event_name = 'academy_page_view')::int AS page_views
        FROM academy_events
        WHERE created_at >= NOW() - make_interval(days => ${days})
      `,
    ]);

    return res.status(200).json({
      days,
      enrollments: {
        stats: enrollmentStats[0],
        byDay: enrollmentsByDay,
        byStatus: enrollmentsByStatus,
        recent: recentEnrollments,
      },
      ratings: {
        stats: ratingStats[0],
        byDay: ratingsByDay,
        topRated,
        recent: recentRatings,
      },
      insights: insightTotals[0],
    });
  } catch (error) {
    console.error("academy dashboard error:", error);
    return res.status(500).json({ error: "Unable to load dashboard data." });
  }
}
