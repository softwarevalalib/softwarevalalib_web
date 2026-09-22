import {
  getSql,
  setCors,
  requireAdmin,
  parseBody,
  cleanText,
} from "./_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();
    const admin = await requireAdmin(req, sql);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      const action = cleanText(req.query?.action || "conversations", 40);
      if (action === "conversations") {
        const rows = await sql`
          SELECT id, session_key, visitor_id, page_url, status, enrollment_ref,
                 applicant_email, started_at, last_activity_at
          FROM academy_chat_sessions
          ORDER BY started_at DESC
          LIMIT 100
        `;
        return res.status(200).json({ conversations: rows });
      }
      if (action === "messages") {
        const sessionId = cleanText(req.query?.sessionId || "", 80);
        const rows = await sql`
          SELECT id, role, content, ui_payload, created_at
          FROM academy_chat_messages
          WHERE session_id = ${sessionId}
          ORDER BY created_at ASC
          LIMIT 300
        `;
        return res.status(200).json({ messages: rows });
      }
      if (action === "unanswered") {
        const rows = await sql`
          SELECT * FROM academy_unanswered_questions
          ORDER BY occurrence_count DESC, last_asked_at DESC
          LIMIT 100
        `;
        return res.status(200).json({ questions: rows });
      }
      if (action === "settings") {
        const rows = await sql`SELECT * FROM academy_assistant_settings WHERE id = 1`;
        return res.status(200).json({ settings: rows[0] });
      }
      return res.status(400).json({ error: "Unknown action" });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const action = cleanText(body.action, 40);

      if (action === "ask") {
        const q = cleanText(body.question, 500).toLowerCase();
        const today = q.includes("today");
        const week = q.includes("week");

        if (q.includes("enrollment") && (q.includes("chat") || q.includes("assistant") || q.includes("chatbot"))) {
          const rows = today
            ? await sql`
                SELECT COUNT(*)::int AS count FROM academy_chat_events
                WHERE event_type = 'ENROLLMENT_SUBMITTED' AND created_at::date = CURRENT_DATE
              `
            : week
              ? await sql`
                  SELECT COUNT(*)::int AS count FROM academy_chat_events
                  WHERE event_type = 'ENROLLMENT_SUBMITTED' AND created_at >= NOW() - interval '7 days'
                `
              : await sql`
                  SELECT COUNT(*)::int AS count FROM academy_chat_events
                  WHERE event_type = 'ENROLLMENT_SUBMITTED'
                `;
          return res.status(200).json({
            answer: `Chatbot-assisted enrollments submitted${today ? " today" : week ? " this week" : ""}: ${rows[0].count}`,
            count: rows[0].count,
            range: today ? "today" : week ? "last 7 days" : "all time",
          });
        }

        if (q.includes("conversation")) {
          const rows = week
            ? await sql`SELECT COUNT(*)::int AS count FROM academy_chat_sessions WHERE started_at >= NOW() - interval '7 days'`
            : await sql`SELECT COUNT(*)::int AS count FROM academy_chat_sessions`;
          return res.status(200).json({
            answer: `Conversations ${week ? "this week" : "total"}: ${rows[0].count}`,
            count: rows[0].count,
            range: week ? "last 7 days" : "all time",
          });
        }

        if (q.includes("admission letter")) {
          const rows = today
            ? await sql`SELECT COUNT(*)::int AS count FROM academy_admission_documents WHERE generated_at::date = CURRENT_DATE`
            : await sql`SELECT COUNT(*)::int AS count FROM academy_admission_documents`;
          return res.status(200).json({
            answer: `Admission letters generated${today ? " today" : ""}: ${rows[0].count}`,
            count: rows[0].count,
          });
        }

        if (q.includes("not answer") || q.includes("unanswered")) {
          const rows = await sql`
            SELECT sample_question, occurrence_count
            FROM academy_unanswered_questions
            WHERE status = 'open'
            ORDER BY occurrence_count DESC
            LIMIT 10
          `;
          return res.status(200).json({
            answer: `Open unanswered questions: ${rows.length} shown (top by frequency).`,
            count: rows.length,
            rows: rows.map((r) => `${r.occurrence_count}× — ${r.sample_question}`),
          });
        }

        if (q.includes("recommended") || q.includes("interest")) {
          const rows = await sql`
            SELECT course_code, COUNT(*)::int AS count
            FROM academy_chat_events
            WHERE event_type = 'COURSE_RECOMMENDED' AND course_code IS NOT NULL
            GROUP BY course_code
            ORDER BY count DESC
            LIMIT 10
          `;
          // Also parse metadata codes
          const meta = await sql`
            SELECT metadata FROM academy_chat_events
            WHERE event_type = 'COURSE_RECOMMENDED'
            ORDER BY created_at DESC LIMIT 50
          `;
          const tally = {};
          for (const row of meta) {
            const codes = row.metadata?.codes || [];
            for (const code of codes) tally[code] = (tally[code] || 0) + 1;
          }
          const ranked = Object.entries(tally)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([code, count]) => `${code}: ${count}`);
          return res.status(200).json({
            answer: "Most recommended courses (from chat events):",
            count: ranked.length,
            rows: ranked.length ? ranked : rows.map((r) => `${r.course_code}: ${r.count}`),
          });
        }

        return res.status(200).json({
          answer:
            "I can answer questions about conversations, chatbot enrollments, admission letters, unanswered questions, and recommended courses — using live database counts only.",
          count: 0,
        });
      }

      if (action === "update_settings") {
        const s = body.settings || {};
        await sql`
          UPDATE academy_assistant_settings SET
            assistant_enabled = COALESCE(${s.assistant_enabled ?? null}, assistant_enabled),
            greeting_enabled = COALESCE(${s.greeting_enabled ?? null}, greeting_enabled),
            greeting_delay_ms = COALESCE(${s.greeting_delay_ms ?? null}, greeting_delay_ms),
            admission_letter_trigger = COALESCE(${s.admission_letter_trigger || null}, admission_letter_trigger),
            student_email_enabled = COALESCE(${s.student_email_enabled ?? null}, student_email_enabled),
            admin_notification_enabled = COALESCE(${s.admin_notification_enabled ?? null}, admin_notification_enabled),
            human_support_email = COALESCE(${s.human_support_email || null}, human_support_email),
            human_support_phone = COALESCE(${s.human_support_phone || null}, human_support_phone),
            welcome_message = COALESCE(${s.welcome_message || null}, welcome_message),
            updated_at = NOW()
          WHERE id = 1
        `;
        const rows = await sql`SELECT * FROM academy_assistant_settings WHERE id = 1`;
        return res.status(200).json({ settings: rows[0] });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("assistant-admin error:", error);
    return res.status(500).json({ error: "Unable to process admin assistant request." });
  }
}
