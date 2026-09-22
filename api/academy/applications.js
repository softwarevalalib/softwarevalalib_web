import { getSql, setCors, cleanText, parseBody, requireAdmin } from "./_lib.js";

/** Admin-only student application management (no public student self-service). */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();
    const admin = await requireAdmin(req, sql).catch(() => null);
    if (!admin) return res.status(401).json({ error: "Admin login required." });

    if (req.method === "GET") {
      const id = Number(req.query?.id);
      const referenceNumber = cleanText(req.query?.referenceNumber, 40);
      if (id || referenceNumber) {
        const rows = id
          ? await sql`SELECT * FROM academy_enrollments WHERE id = ${id} LIMIT 1`
          : await sql`
              SELECT * FROM academy_enrollments WHERE reference_number = ${referenceNumber} LIMIT 1
            `;
        const enrollment = rows[0];
        if (!enrollment) return res.status(404).json({ error: "Application not found." });
        const docs = await sql`
          SELECT id, file_name, status, access_token, generated_at, email_delivery_status
          FROM academy_admission_documents
          WHERE reference_number = ${enrollment.reference_number}
          ORDER BY generated_at DESC
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
      return res.status(400).json({ error: "Provide id or referenceNumber." });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      if (body.website) return res.status(200).json({ ok: true });
      const action = cleanText(body.action, 40);
      const id = Number(body.id);
      const referenceNumber = cleanText(body.referenceNumber, 40);

      const rows = id
        ? await sql`SELECT * FROM academy_enrollments WHERE id = ${id} LIMIT 1`
        : await sql`
            SELECT * FROM academy_enrollments WHERE reference_number = ${referenceNumber} LIMIT 1
          `;
      const enrollment = rows[0];
      if (!enrollment) return res.status(404).json({ error: "Application not found." });

      if (action === "update") {
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
            notes = COALESCE(${cleanText(patch.notes, 1000) || null}, notes),
            status = COALESCE(${cleanText(patch.status, 30) || null}, status)
          WHERE id = ${enrollment.id}
          RETURNING *
        `;
        return res.status(200).json({ enrollment: updated[0], message: "Application updated." });
      }

      if (action === "delete") {
        await sql`DELETE FROM academy_admission_documents WHERE enrollment_id = ${enrollment.id}`;
        await sql`DELETE FROM academy_enrollments WHERE id = ${enrollment.id}`;
        return res.status(200).json({ ok: true, message: "Application deleted." });
      }

      return res.status(400).json({ error: "Unknown action." });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("applications error:", error);
    return res.status(500).json({ error: "Unable to process application request." });
  }
}
