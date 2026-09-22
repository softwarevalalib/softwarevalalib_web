import { randomBytes } from "node:crypto";
import {
  getSql,
  setCors,
  cleanText,
  parseBody,
  requireAdmin,
  hashPassword,
  verifyPassword,
  newToken,
  getBearerToken,
} from "./_lib.js";

const SESSION_DAYS = 30;

function genUsername(fullName, role) {
  const base = String(fullName || role)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 18);
  const suffix = randomBytes(2).toString("hex");
  return `${base || role}.${suffix}`;
}

function genPassword() {
  return `SVL-${randomBytes(4).toString("hex")}`;
}

async function requirePortalUser(req, sql, roles = null) {
  const token = getBearerToken(req);
  if (!token) return null;
  const rows = await sql`
    SELECT u.*, s.expires_at
    FROM academy_portal_sessions s
    JOIN academy_portal_users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sql`DELETE FROM academy_portal_sessions WHERE token = ${token}`;
    return null;
  }
  if (roles && !roles.includes(row.role)) return null;
  if (row.status !== "active") return null;
  return row;
}

function publicUser(u) {
  return {
    id: u.id,
    role: u.role,
    username: u.username,
    email: u.email,
    fullName: u.full_name,
    phone: u.phone,
    courseCodes: u.course_codes,
    status: u.status,
    mustChangePassword: u.must_change_password,
    enrollmentId: u.enrollment_id,
  };
}

export default async function handler(req, res) {
  setCors(res, "x-academy-session");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();
    const body = req.method === "GET" ? {} : parseBody(req);
    if (body.website) return res.status(200).json({ ok: true });

    const action = cleanText(body.action || req.query?.action || "", 60);

    // ——— Public / portal-user auth ———
    if (action === "login" && req.method === "POST") {
      const username = cleanText(body.username, 80).toLowerCase();
      const password = String(body.password || "");
      if (!username || password.length < 4) {
        return res.status(400).json({ error: "Username and password are required." });
      }
      const rows = await sql`
        SELECT * FROM academy_portal_users
        WHERE LOWER(username) = ${username} OR LOWER(email) = ${username}
        LIMIT 1
      `;
      const user = rows[0];
      if (!user || !verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: "Invalid username or password." });
      }
      if (user.status !== "active") {
        return res.status(403).json({ error: "Account is not active. Contact Admissions." });
      }
      const token = newToken();
      const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
      await sql`
        INSERT INTO academy_portal_sessions (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expires.toISOString()})
      `;
      return res.status(200).json({
        token,
        expiresAt: expires.toISOString(),
        user: publicUser(user),
      });
    }

    if (action === "me" && req.method === "GET") {
      const user = await requirePortalUser(req, sql);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      return res.status(200).json({ user: publicUser(user) });
    }

    if (action === "logout" && req.method === "POST") {
      const token = getBearerToken(req);
      if (token) await sql`DELETE FROM academy_portal_sessions WHERE token = ${token}`;
      return res.status(200).json({ ok: true });
    }

    if (action === "change-password" && req.method === "POST") {
      const user = await requirePortalUser(req, sql);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const current = String(body.currentPassword || "");
      const next = String(body.newPassword || "");
      if (next.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters." });
      if (!verifyPassword(current, user.password_hash)) {
        return res.status(400).json({ error: "Current password is incorrect." });
      }
      await sql`
        UPDATE academy_portal_users
        SET password_hash = ${hashPassword(next)}, must_change_password = false, updated_at = NOW()
        WHERE id = ${user.id}
      `;
      return res.status(200).json({ ok: true });
    }

    // ——— Student dashboard data ———
    if (action === "my-dashboard" && req.method === "GET") {
      const user = await requirePortalUser(req, sql, ["student"]);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const [grades, attendance, payments, certificates] = await Promise.all([
        sql`SELECT * FROM academy_grades WHERE student_id = ${user.id} ORDER BY created_at DESC LIMIT 50`,
        sql`SELECT * FROM academy_attendance WHERE student_id = ${user.id} ORDER BY session_date DESC LIMIT 50`,
        sql`SELECT * FROM academy_fee_payments WHERE student_id = ${user.id} ORDER BY created_at DESC LIMIT 50`,
        sql`
          SELECT id, certificate_id, course_title, course_code, issue_date, status, file_name
          FROM academy_certificates
          WHERE student_id = ${user.id} OR LOWER(student_email) = ${String(user.email).toLowerCase()}
          ORDER BY issue_date DESC
        `,
      ]);
      return res.status(200).json({
        user: publicUser(user),
        grades,
        attendance,
        payments,
        certificates,
      });
    }

    if (action === "instructor-dashboard" && req.method === "GET") {
      const user = await requirePortalUser(req, sql, ["instructor"]);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const courses = await sql`
        SELECT * FROM academy_portal_courses
        WHERE instructor_id = ${user.id} OR instructor_id IS NULL
        ORDER BY title
      `;
      const students = await sql`
        SELECT id, full_name, email, username, course_codes, status
        FROM academy_portal_users WHERE role = 'student' AND status = 'active'
        ORDER BY full_name
        LIMIT 200
      `;
      return res.status(200).json({ user: publicUser(user), courses, students });
    }

    // ——— Certificate public verify ———
    if (action === "verify-certificate" && req.method === "POST") {
      const certificateId = cleanText(body.certificateId, 80);
      const email = cleanText(body.email, 120).toLowerCase();
      if (!certificateId || !email.includes("@")) {
        return res.status(400).json({ error: "Certificate ID and email are required." });
      }
      const rows = await sql`
        SELECT id, certificate_id, student_name, student_email, course_title, course_code,
               issue_date, status, file_name
        FROM academy_certificates
        WHERE certificate_id = ${certificateId}
          AND LOWER(student_email) = ${email}
          AND status = 'issued'
        LIMIT 1
      `;
      if (!rows[0]) {
        return res.status(404).json({
          valid: false,
          error: "No matching certificate found. Check the ID and email.",
        });
      }
      return res.status(200).json({
        valid: true,
        certificate: {
          certificateId: rows[0].certificate_id,
          studentName: rows[0].student_name,
          courseTitle: rows[0].course_title,
          courseCode: rows[0].course_code,
          issueDate: rows[0].issue_date,
          status: rows[0].status,
        },
      });
    }

    // ——— Admin portal management ———
    const admin = await requireAdmin(req, sql).catch(() => null);
    if (!admin) return res.status(401).json({ error: "Admin login required." });

    if (action === "list-users" && req.method === "GET") {
      const role = cleanText(req.query?.role || "", 20);
      const rows = role
        ? await sql`
            SELECT id, role, username, email, full_name, phone, course_codes, status,
                   enrollment_id, must_change_password, created_at
            FROM academy_portal_users WHERE role = ${role} ORDER BY created_at DESC LIMIT 300
          `
        : await sql`
            SELECT id, role, username, email, full_name, phone, course_codes, status,
                   enrollment_id, must_change_password, created_at
            FROM academy_portal_users ORDER BY created_at DESC LIMIT 300
          `;
      return res.status(200).json({ users: rows });
    }

    if (action === "approve-enrollment" && req.method === "POST") {
      const enrollmentId = body.enrollmentId;
      const rows = await sql`SELECT * FROM academy_enrollments WHERE id = ${enrollmentId} LIMIT 1`;
      const enrollment = rows[0];
      if (!enrollment) return res.status(404).json({ error: "Enrollment not found." });

      const username = cleanText(body.username, 80).toLowerCase() || genUsername(enrollment.full_name, "student");
      const password = body.password ? String(body.password) : genPassword();
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
      }

      const existing = await sql`
        SELECT id FROM academy_portal_users WHERE LOWER(username) = ${username} LIMIT 1
      `;
      if (existing[0]) return res.status(400).json({ error: "Username already taken." });

      const created = await sql`
        INSERT INTO academy_portal_users (
          role, username, email, password_hash, full_name, phone, enrollment_id,
          course_codes, status, must_change_password, created_by
        ) VALUES (
          'student',
          ${username},
          ${enrollment.email},
          ${hashPassword(password)},
          ${enrollment.full_name},
          ${enrollment.phone},
          ${enrollment.id},
          ${JSON.stringify(enrollment.course_codes || [])}::jsonb,
          'active',
          true,
          ${admin.id}
        )
        RETURNING id, username, email, full_name, role
      `;

      await sql`
        UPDATE academy_enrollments
        SET status = 'approved',
            portal_user_id = ${created[0].id},
            approved_at = NOW(),
            approved_by = ${admin.id}
        WHERE id = ${enrollment.id}
      `;

      // Seed fee schedule 40/30/30 for first course tuition if known
      const codes = Array.isArray(enrollment.course_codes) ? enrollment.course_codes : [];
      return res.status(201).json({
        user: created[0],
        credentials: { username, password },
        message: "Enrollment approved. Share these credentials with the student securely.",
        courseCodes: codes,
      });
    }

    if (action === "create-user" && req.method === "POST") {
      const role = cleanText(body.role, 20) === "instructor" ? "instructor" : "student";
      const fullName = cleanText(body.fullName, 100);
      const email = cleanText(body.email, 120).toLowerCase();
      const username = cleanText(body.username, 80).toLowerCase() || genUsername(fullName, role);
      const password = body.password ? String(body.password) : genPassword();
      if (fullName.length < 2 || !email.includes("@")) {
        return res.status(400).json({ error: "Full name and valid email are required." });
      }
      if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

      const created = await sql`
        INSERT INTO academy_portal_users (
          role, username, email, password_hash, full_name, phone, course_codes,
          status, must_change_password, created_by
        ) VALUES (
          ${role}, ${username}, ${email}, ${hashPassword(password)}, ${fullName},
          ${cleanText(body.phone, 40) || null},
          ${JSON.stringify(body.courseCodes || [])}::jsonb,
          'active', true, ${admin.id}
        )
        RETURNING id, role, username, email, full_name, status, created_at
      `;
      return res.status(201).json({
        user: created[0],
        credentials: { username, password },
      });
    }

    if (action === "reset-password" && req.method === "POST") {
      const userId = body.userId;
      const password = body.password ? String(body.password) : genPassword();
      if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
      const updated = await sql`
        UPDATE academy_portal_users
        SET password_hash = ${hashPassword(password)}, must_change_password = true, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, username, email, full_name, role
      `;
      if (!updated[0]) return res.status(404).json({ error: "User not found." });
      return res.status(200).json({ user: updated[0], credentials: { username: updated[0].username, password } });
    }

    if (action === "update-user" && req.method === "POST") {
      const patch = body.patch || {};
      const updated = await sql`
        UPDATE academy_portal_users SET
          full_name = COALESCE(${cleanText(patch.fullName, 100) || null}, full_name),
          email = COALESCE(${cleanText(patch.email, 120).toLowerCase() || null}, email),
          phone = COALESCE(${cleanText(patch.phone, 40) || null}, phone),
          status = COALESCE(${cleanText(patch.status, 30) || null}, status),
          course_codes = COALESCE(${JSON.stringify(patch.courseCodes || null)}::jsonb, course_codes),
          updated_at = NOW()
        WHERE id = ${body.userId}
        RETURNING id, role, username, email, full_name, phone, course_codes, status
      `;
      if (!updated[0]) return res.status(404).json({ error: "User not found." });
      return res.status(200).json({ user: updated[0] });
    }

    if (action === "delete-user" && req.method === "POST") {
      await sql`DELETE FROM academy_portal_users WHERE id = ${body.userId}`;
      return res.status(200).json({ ok: true });
    }

    // Courses
    if (action === "list-courses" && req.method === "GET") {
      const rows = await sql`
        SELECT c.*, u.full_name AS instructor_name
        FROM academy_portal_courses c
        LEFT JOIN academy_portal_users u ON u.id = c.instructor_id
        ORDER BY c.title
      `;
      return res.status(200).json({ courses: rows });
    }

    if (action === "upsert-course" && req.method === "POST") {
      const code = cleanText(body.code, 40);
      const title = cleanText(body.title, 200);
      if (!code || !title) return res.status(400).json({ error: "Course code and title are required." });
      const rows = await sql`
        INSERT INTO academy_portal_courses (
          code, title, description, duration, tuition, registration_fee, instructor_id, status
        ) VALUES (
          ${code}, ${title}, ${cleanText(body.description, 2000) || null},
          ${cleanText(body.duration, 80) || null},
          ${Number(body.tuition) || 0}, ${Number(body.registrationFee) || 0},
          ${body.instructorId || null},
          ${cleanText(body.status, 30) || "active"}
        )
        ON CONFLICT (code) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          duration = EXCLUDED.duration,
          tuition = EXCLUDED.tuition,
          registration_fee = EXCLUDED.registration_fee,
          instructor_id = EXCLUDED.instructor_id,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING *
      `;
      return res.status(200).json({ course: rows[0] });
    }

    if (action === "delete-course" && req.method === "POST") {
      await sql`DELETE FROM academy_portal_courses WHERE id = ${body.courseId}`;
      return res.status(200).json({ ok: true });
    }

    // Grades
    if (action === "list-grades" && req.method === "GET") {
      const rows = await sql`
        SELECT g.*, u.full_name AS student_name, u.email AS student_email
        FROM academy_grades g
        JOIN academy_portal_users u ON u.id = g.student_id
        ORDER BY g.created_at DESC LIMIT 300
      `;
      return res.status(200).json({ grades: rows });
    }

    if (action === "add-grade" && req.method === "POST") {
      const rows = await sql`
        INSERT INTO academy_grades (
          student_id, course_code, assessment_type, title, score, max_score, grade_letter, notes, recorded_by
        ) VALUES (
          ${body.studentId}, ${cleanText(body.courseCode, 40)},
          ${cleanText(body.assessmentType, 40) || "assignment"},
          ${cleanText(body.title, 200)},
          ${body.score != null ? Number(body.score) : null},
          ${body.maxScore != null ? Number(body.maxScore) : 100},
          ${cleanText(body.gradeLetter, 10) || null},
          ${cleanText(body.notes, 500) || null},
          ${admin.id}
        ) RETURNING *
      `;
      return res.status(201).json({ grade: rows[0] });
    }

    if (action === "delete-grade" && req.method === "POST") {
      await sql`DELETE FROM academy_grades WHERE id = ${body.gradeId}`;
      return res.status(200).json({ ok: true });
    }

    // Attendance
    if (action === "list-attendance" && req.method === "GET") {
      const rows = await sql`
        SELECT a.*, u.full_name AS student_name
        FROM academy_attendance a
        JOIN academy_portal_users u ON u.id = a.student_id
        ORDER BY a.session_date DESC LIMIT 400
      `;
      return res.status(200).json({ attendance: rows });
    }

    if (action === "add-attendance" && req.method === "POST") {
      const rows = await sql`
        INSERT INTO academy_attendance (student_id, course_code, session_date, status, notes, recorded_by)
        VALUES (
          ${body.studentId}, ${cleanText(body.courseCode, 40)},
          ${body.sessionDate}, ${cleanText(body.status, 20) || "present"},
          ${cleanText(body.notes, 500) || null}, ${admin.id}
        ) RETURNING *
      `;
      return res.status(201).json({ attendance: rows[0] });
    }

    if (action === "delete-attendance" && req.method === "POST") {
      await sql`DELETE FROM academy_attendance WHERE id = ${body.attendanceId}`;
      return res.status(200).json({ ok: true });
    }

    // Fees
    if (action === "list-payments" && req.method === "GET") {
      const rows = await sql`
        SELECT p.*, u.full_name AS student_name, u.email AS student_email
        FROM academy_fee_payments p
        JOIN academy_portal_users u ON u.id = p.student_id
        ORDER BY p.created_at DESC LIMIT 400
      `;
      return res.status(200).json({ payments: rows });
    }

    if (action === "add-payment" && req.method === "POST") {
      const rows = await sql`
        INSERT INTO academy_fee_payments (
          student_id, enrollment_id, course_code, amount, installment_number,
          payment_method, reference, status, paid_at, notes, recorded_by
        ) VALUES (
          ${body.studentId}, ${body.enrollmentId || null},
          ${cleanText(body.courseCode, 40) || null},
          ${Number(body.amount) || 0},
          ${body.installmentNumber != null ? Number(body.installmentNumber) : null},
          ${cleanText(body.paymentMethod, 80) || null},
          ${cleanText(body.reference, 120) || null},
          ${cleanText(body.status, 30) || "paid"},
          ${body.status === "pending" ? null : new Date().toISOString()},
          ${cleanText(body.notes, 500) || null},
          ${admin.id}
        ) RETURNING *
      `;
      return res.status(201).json({ payment: rows[0] });
    }

    if (action === "delete-payment" && req.method === "POST") {
      await sql`DELETE FROM academy_fee_payments WHERE id = ${body.paymentId}`;
      return res.status(200).json({ ok: true });
    }

    // Certificates
    if (action === "list-certificates" && req.method === "GET") {
      const rows = await sql`
        SELECT id, certificate_id, student_id, student_name, student_email, course_code,
               course_title, issue_date, file_name, status, created_at
        FROM academy_certificates
        ORDER BY created_at DESC LIMIT 300
      `;
      return res.status(200).json({ certificates: rows });
    }

    if (action === "upload-certificate" && req.method === "POST") {
      const certificateId =
        cleanText(body.certificateId, 80) ||
        `SVL-CERT-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
      const studentName = cleanText(body.studentName, 100);
      const studentEmail = cleanText(body.studentEmail, 120).toLowerCase();
      const courseTitle = cleanText(body.courseTitle, 200);
      if (!studentName || !studentEmail.includes("@") || !courseTitle) {
        return res.status(400).json({ error: "Student name, email, and course title are required." });
      }
      if (!body.fileBase64) {
        return res.status(400).json({ error: "Upload a certificate file (PDF or image)." });
      }
      const rows = await sql`
        INSERT INTO academy_certificates (
          certificate_id, student_id, student_name, student_email, course_code, course_title,
          issue_date, file_name, file_base64, file_mime, status, uploaded_by
        ) VALUES (
          ${certificateId}, ${body.studentId || null}, ${studentName}, ${studentEmail},
          ${cleanText(body.courseCode, 40) || null}, ${courseTitle},
          ${body.issueDate || new Date().toISOString().slice(0, 10)},
          ${cleanText(body.fileName, 200) || "certificate.pdf"},
          ${body.fileBase64},
          ${cleanText(body.fileMime, 80) || "application/pdf"},
          'issued', ${admin.id}
        )
        RETURNING id, certificate_id, student_name, student_email, course_title, issue_date, status
      `;
      return res.status(201).json({ certificate: rows[0] });
    }

    if (action === "delete-certificate" && req.method === "POST") {
      await sql`DELETE FROM academy_certificates WHERE id = ${body.certificateId}`;
      return res.status(200).json({ ok: true });
    }

    if (action === "download-certificate" && req.method === "GET") {
      const id = cleanText(req.query?.id || "", 80);
      const rows = await sql`SELECT * FROM academy_certificates WHERE id = ${id} LIMIT 1`;
      const doc = rows[0];
      if (!doc?.file_base64) return res.status(404).json({ error: "File not found." });
      const buf = Buffer.from(doc.file_base64, "base64");
      res.setHeader("Content-Type", doc.file_mime || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${doc.file_name || "certificate.pdf"}"`);
      return res.status(200).send(buf);
    }

    if (action === "overview" && req.method === "GET") {
      const [students, instructors, courses, payments, certs, pending] = await Promise.all([
        sql`SELECT COUNT(*)::int AS c FROM academy_portal_users WHERE role = 'student'`,
        sql`SELECT COUNT(*)::int AS c FROM academy_portal_users WHERE role = 'instructor'`,
        sql`SELECT COUNT(*)::int AS c FROM academy_portal_courses`,
        sql`SELECT COUNT(*)::int AS c FROM academy_fee_payments WHERE status = 'paid'`,
        sql`SELECT COUNT(*)::int AS c FROM academy_certificates`,
        sql`SELECT COUNT(*)::int AS c FROM academy_enrollments WHERE status = 'pending'`,
      ]);
      return res.status(200).json({
        stats: {
          students: students[0].c,
          instructors: instructors[0].c,
          courses: courses[0].c,
          payments: payments[0].c,
          certificates: certs[0].c,
          pendingEnrollments: pending[0].c,
        },
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action || "(none)"}` });
  } catch (error) {
    console.error("portal error:", error);
    return res.status(500).json({ error: error.message || "Unable to process portal request." });
  }
}
