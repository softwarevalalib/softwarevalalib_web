import {
  getSql,
  setCors,
  cleanText,
  requireAdmin,
  parseBody,
} from "./_lib.js";
import { getCourseDetails } from "./knowledge.js";
import { generateAdmissionPdf, buildAdmissionMerge } from "./admissionPdf.js";
import { randomBytes } from "node:crypto";

function newKey(prefix = "adm") {
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

async function sendEmail({ to, firstName, courseLabel, fileName, pdfBase64, accessToken }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ACADEMY_FROM_EMAIL || "SVL Training Academy <onboarding@resend.dev>";
  if (!key) {
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `SVL Training Academy — Admission Letter — ${firstName}`,
          message: `Dear ${firstName},\n\nYour admission letter for ${courseLabel} is ready.\nSecure link: https://softwarevala.com/api/academy/admission?token=${accessToken}\n\nRegards,\nSVL Training Academy`,
          _captcha: "false",
        }),
      });
      return "SENT_LINK";
    } catch {
      return "FAILED";
    }
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `SVL Training Academy — Admission Letter — ${firstName}`,
      text: `Dear ${firstName},\n\nCongratulations.\n\nYour SVL Training Academy admission letter for ${courseLabel} is attached.\n\nRegards,\nSVL Training Academy\nSoftware Vala Liberia`,
      attachments: [{ filename: fileName, content: pdfBase64 }],
    }),
  });
  return res.ok ? "SENT" : "FAILED";
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();

    if (req.method === "GET") {
      const token = cleanText(req.query?.token || "", 120);
      const id = cleanText(req.query?.id || "", 80);

      if (token) {
        const rows = await sql`
          SELECT * FROM academy_admission_documents WHERE access_token = ${token} LIMIT 1
        `;
        const doc = rows[0];
        if (!doc?.file_base64) return res.status(404).json({ error: "Document not found." });
        const buf = Buffer.from(doc.file_base64, "base64");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${doc.file_name}"`);
        return res.status(200).send(buf);
      }

      const admin = await requireAdmin(req, sql);
      if (!admin) return res.status(401).json({ error: "Unauthorized" });

      if (id) {
        const rows = await sql`SELECT * FROM academy_admission_documents WHERE id = ${id} LIMIT 1`;
        const doc = rows[0];
        if (!doc) return res.status(404).json({ error: "Not found" });
        if (req.query?.download === "1" && doc.file_base64) {
          const buf = Buffer.from(doc.file_base64, "base64");
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${doc.file_name}"`);
          return res.status(200).send(buf);
        }
        const { file_base64, ...safe } = doc;
        return res.status(200).json({ document: { ...safe, hasFile: Boolean(file_base64) } });
      }

      const rows = await sql`
        SELECT id, reference_number, student_full_name, student_email, course_codes,
               file_name, status, email_delivery_status, generated_at, emailed_at, access_token
        FROM academy_admission_documents
        ORDER BY generated_at DESC
        LIMIT 100
      `;
      return res.status(200).json({ documents: rows });
    }

    if (req.method === "POST") {
      const admin = await requireAdmin(req, sql);
      if (!admin) return res.status(401).json({ error: "Unauthorized" });
      const body = parseBody(req);
      const action = cleanText(body.action, 40);

      if (action === "resend") {
        const rows = await sql`
          SELECT * FROM academy_admission_documents WHERE id = ${body.id} LIMIT 1
        `;
        const doc = rows[0];
        if (!doc) return res.status(404).json({ error: "Document not found" });
        const firstName = String(doc.student_full_name).split(/\s+/)[0];
        const courseLabel = (Array.isArray(doc.course_codes) ? doc.course_codes : []).join(", ");
        const status = await sendEmail({
          to: doc.student_email,
          firstName,
          courseLabel,
          fileName: doc.file_name,
          pdfBase64: doc.file_base64,
          accessToken: doc.access_token,
        });
        await sql`
          UPDATE academy_admission_documents
          SET emailed_at = CASE WHEN ${status} LIKE 'SENT%' THEN NOW() ELSE emailed_at END,
              email_delivery_status = ${status},
              status = CASE WHEN ${status} LIKE 'SENT%' THEN 'EMAILED' ELSE 'EMAIL_FAILED' END
          WHERE id = ${doc.id}
        `;
        return res.status(200).json({ ok: true, emailStatus: status });
      }

      if (action === "generate" || action === "regenerate") {
        const ref = cleanText(body.referenceNumber, 40);
        const force = action === "regenerate" || body.force === true;
        const enrollments = await sql`
          SELECT * FROM academy_enrollments WHERE reference_number = ${ref} LIMIT 1
        `;
        const enrollment = enrollments[0];
        if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

        const existing = await sql`
          SELECT id, reference_number, file_name, access_token, status
          FROM academy_admission_documents WHERE reference_number = ${ref} LIMIT 1
        `;
        if (existing[0] && !force) {
          return res.status(200).json({ document: existing[0], existing: true });
        }

        const codes = Array.isArray(enrollment.course_codes) ? enrollment.course_codes : [];
        const courses = codes.map((c) => getCourseDetails(c)).filter(Boolean);
        const merge = buildAdmissionMerge(enrollment, courses);
        const pdf = await generateAdmissionPdf(merge);
        const accessToken = existing[0]?.access_token || newKey("adm");

        if (existing[0] && force) {
          const rows = await sql`
            UPDATE academy_admission_documents SET
              merge_data = ${JSON.stringify(merge)},
              file_name = ${pdf.fileName},
              file_base64 = ${pdf.bytes.toString("base64")},
              template_version = ${pdf.templateVersion},
              status = 'GENERATED',
              generated_at = NOW(),
              email_delivery_status = 'PENDING'
            WHERE id = ${existing[0].id}
            RETURNING id, reference_number, file_name, access_token, status, generated_at
          `;
          return res.status(200).json({ document: rows[0], regenerated: true });
        }

        const rows = await sql`
          INSERT INTO academy_admission_documents (
            enrollment_id, reference_number, student_full_name, student_email,
            course_codes, merge_data, file_name, file_base64, access_token,
            template_version, status, email_delivery_status
          ) VALUES (
            ${enrollment.id}, ${enrollment.reference_number}, ${enrollment.full_name},
            ${enrollment.email}, ${JSON.stringify(codes)}, ${JSON.stringify(merge)},
            ${pdf.fileName}, ${pdf.bytes.toString("base64")}, ${accessToken},
            ${pdf.templateVersion}, 'GENERATED', 'PENDING'
          )
          RETURNING id, reference_number, file_name, access_token, status, generated_at
        `;
        return res.status(201).json({ document: rows[0] });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admission error:", error);
    return res.status(500).json({ error: "Unable to process admission document request." });
  }
}
