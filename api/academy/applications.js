import { neon } from "@neondatabase/serverless";
import { getSql, setCors, cleanText, parseBody } from "./_lib.js";

function verifyOwner(row, email, reference) {
  if (!row) return false;
  return (
    String(row.email || "").toLowerCase() === String(email || "").toLowerCase() &&
    String(row.reference_number || "") === String(reference || "")
  );
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();

    if (req.method === "POST") {
      const body = parseBody(req);
      if (body.website) return res.status(200).json({ ok: true });
      const action = cleanText(body.action || "lookup", 40);
      const email = cleanText(body.email, 120).toLowerCase();
      const referenceNumber = cleanText(body.referenceNumber, 40);

      if (!email.includes("@") || !referenceNumber) {
        return res.status(400).json({ error: "Email and application reference are required." });
      }

      if (action === "lookup") {
        const rows = await sql`
          SELECT id, reference_number, full_name, gender, date_of_birth, email, phone, whatsapp,
                 county, country, education_level, occupation, employer, course_codes,
                 programme_type, preferred_session, has_laptop, has_internet,
                 basic_computer_knowledge, heard_about, motivation, notes, status, created_at
          FROM academy_enrollments
          WHERE email = ${email} AND reference_number = ${referenceNumber}
          LIMIT 1
        `;
        const enrollment = rows[0];
        if (!enrollment) return res.status(404).json({ error: "No application found for that email and reference." });

        const docs = await sql`
          SELECT id, file_name, status, access_token, generated_at, email_delivery_status
          FROM academy_admission_documents
          WHERE reference_number = ${referenceNumber}
          ORDER BY generated_at DESC
          LIMIT 5
        `;

        return res.status(200).json({
          enrollment,
          admissionLetters: docs.map((d) => ({
            id: d.id,
            fileName: d.file_name,
            status: d.status,
            generatedAt: d.generated_at,
            emailStatus: d.email_delivery_status,
            downloadUrl: `/api/academy/admission?token=${d.access_token}`,
          })),
        });
      }

      if (action === "update") {
        const rows = await sql`
          SELECT * FROM academy_enrollments
          WHERE email = ${email} AND reference_number = ${referenceNumber}
          LIMIT 1
        `;
        const enrollment = rows[0];
        if (!verifyOwner(enrollment, email, referenceNumber)) {
          return res.status(404).json({ error: "Application not found." });
        }
        if (enrollment.status !== "pending") {
          return res.status(400).json({ error: "Only pending applications can be edited." });
        }

        const patch = body.patch || {};
        const updated = await sql`
          UPDATE academy_enrollments SET
            full_name = COALESCE(${cleanText(patch.fullName, 100) || null}, full_name),
            phone = COALESCE(${cleanText(patch.phone, 40) || null}, phone),
            whatsapp = COALESCE(${cleanText(patch.whatsapp, 40) || null}, whatsapp),
            county = COALESCE(${cleanText(patch.county, 80) || null}, county),
            country = COALESCE(${cleanText(patch.country, 80) || null}, country),
            education_level = COALESCE(${cleanText(patch.educationLevel, 80) || null}, education_level),
            occupation = COALESCE(${cleanText(patch.occupation, 100) || null}, occupation),
            employer = COALESCE(${cleanText(patch.employer, 120) || null}, employer),
            preferred_session = COALESCE(${cleanText(patch.preferredSession, 40) || null}, preferred_session),
            motivation = COALESCE(${cleanText(patch.motivation, 1000) || null}, motivation),
            notes = COALESCE(${cleanText(patch.notes, 1000) || null}, notes)
          WHERE id = ${enrollment.id}
          RETURNING id, reference_number, full_name, email, phone, whatsapp, county, country,
                    education_level, occupation, employer, course_codes, preferred_session,
                    motivation, notes, status, created_at
        `;
        return res.status(200).json({ enrollment: updated[0], message: "Application updated." });
      }

      if (action === "delete") {
        const rows = await sql`
          SELECT * FROM academy_enrollments
          WHERE email = ${email} AND reference_number = ${referenceNumber}
          LIMIT 1
        `;
        const enrollment = rows[0];
        if (!verifyOwner(enrollment, email, referenceNumber)) {
          return res.status(404).json({ error: "Application not found." });
        }
        if (enrollment.status !== "pending") {
          return res.status(400).json({ error: "Only pending applications can be deleted." });
        }
        await sql`DELETE FROM academy_enrollments WHERE id = ${enrollment.id}`;
        return res.status(200).json({ ok: true, message: "Application deleted." });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("applications error:", error);
    return res.status(500).json({ error: "Unable to process application request." });
  }
}
