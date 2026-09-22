import {
  getSql,
  setCors,
  cleanText,
  requireAdmin,
  parseBody,
} from "./_lib.js";
import { generateAndStoreAdmission, notifyAdminAdmission } from "./assistant.js";

function isLegacyAdmin(req) {
  const key = process.env.ACADEMY_ADMIN_KEY;
  if (!key) return false;
  return req.headers["x-academy-admin-key"] === key;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();

    if (req.method === "GET") {
      const sessionAdmin = await requireAdmin(req, sql).catch(() => null);
      if (!sessionAdmin && !isLegacyAdmin(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const rows = await sql`
        SELECT *
        FROM academy_enrollments
        ORDER BY created_at DESC
        LIMIT 200
      `;
      const stats = await sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
          COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
          COUNT(*) FILTER (WHERE status = 'enrolled')::int AS enrolled,
          COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
        FROM academy_enrollments
      `;
      return res.status(200).json({ enrollments: rows, stats: stats[0] });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      if (body.website) return res.status(200).json({ ok: true });

      const fullName = cleanText(body.fullName, 100);
      const email = cleanText(body.email, 120).toLowerCase();
      const phone = cleanText(body.phone, 40);
      const courseCodes = Array.isArray(body.courseCodes)
        ? body.courseCodes.map((c) => cleanText(String(c), 40)).filter(Boolean)
        : [];

      if (fullName.length < 2) return res.status(400).json({ error: "Full name is required." });
      if (!email.includes("@")) return res.status(400).json({ error: "A valid email is required." });
      if (phone.length < 7) return res.status(400).json({ error: "A valid phone number is required." });
      if (courseCodes.length < 1) return res.status(400).json({ error: "Select at least one course." });
      if (!body.consentTerms || !body.consentPrivacy || !body.consentAccuracy) {
        return res.status(400).json({ error: "Please accept the required consent statements." });
      }

      const seqRows = await sql`SELECT nextval('academy_enrollment_seq') AS n`;
      const seq = Number(seqRows[0].n);
      const year = new Date().getFullYear();
      const referenceNumber = `SVL-ACA-${year}-${String(seq).padStart(6, "0")}`;

      const rows = await sql`
        INSERT INTO academy_enrollments (
          reference_number, full_name, gender, date_of_birth, email, phone, whatsapp,
          county, country, education_level, occupation, employer, course_codes,
          programme_type, preferred_session, has_laptop, has_internet, basic_computer_knowledge,
          heard_about, motivation, notes, status
        ) VALUES (
          ${referenceNumber},
          ${fullName},
          ${cleanText(body.gender, 30) || null},
          ${body.dateOfBirth || null},
          ${email},
          ${phone},
          ${cleanText(body.whatsapp, 40) || null},
          ${cleanText(body.county, 80) || null},
          ${cleanText(body.country, 80) || "Liberia"},
          ${cleanText(body.educationLevel, 80) || null},
          ${cleanText(body.occupation, 100) || null},
          ${cleanText(body.employer, 120) || null},
          ${JSON.stringify(courseCodes)},
          ${cleanText(body.programmeType, 80) || null},
          ${cleanText(body.preferredSession, 40) || null},
          ${Boolean(body.hasLaptop)},
          ${Boolean(body.hasInternet)},
          ${Boolean(body.basicComputerKnowledge)},
          ${cleanText(body.heardAbout, 120) || null},
          ${cleanText(body.motivation, 1000) || null},
          ${cleanText(body.notes, 1000) || null},
          'pending'
        )
        RETURNING id, reference_number, full_name, course_codes, created_at, email, county, country, preferred_session
      `;

      const row = rows[0];
      let admission = null;
      try {
        const settingsRows = await sql`SELECT * FROM academy_assistant_settings WHERE id = 1`;
        const settings = settingsRows[0] || {
          admission_letter_trigger: "immediately_after_valid_application",
          student_email_enabled: true,
          human_support_email: "info@softwarevalalib.app",
        };
        admission = await generateAndStoreAdmission(sql, row, settings);
        await notifyAdminAdmission(sql, row, admission, settings);
      } catch (letterErr) {
        console.error("admission letter after enroll:", letterErr);
      }

      return res.status(201).json({
        referenceNumber: row.reference_number,
        fullName: row.full_name,
        courseCodes: row.course_codes,
        submittedAt: row.created_at,
        message:
          "Application submitted successfully. Your admission letter is being prepared (usually ready within 10–30 minutes).",
        admissionDownload: admission?.downloadPath || null,
        applicationsUrl: "/academy/applications",
      });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("academy enroll error:", error);
    return res.status(500).json({ error: "Unable to submit enrollment right now." });
  }
}
