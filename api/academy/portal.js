import { randomBytes } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
  ensurePortalSchema,
} from "./_lib.js";
import { syncCatalogueIntoPortal, mapPortalCourseToPublic } from "./_courseSync.js";

const SESSION_DAYS = 30;
const MAX_ATTACH_CHARS = 2_800_000; // ~2MB base64

function lastNameFromFullName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "Student";
}

/** Student default password: SVL + last name (from enrollment full name). */
function studentDefaultPassword(fullName) {
  return `SVL${lastNameFromFullName(fullName)}`;
}

function studentLoginEmail(email) {
  return cleanText(email, 120).toLowerCase();
}

function genInstructorUsername(fullName) {
  const base = String(fullName || "instructor")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 18);
  return `${base || "instructor"}.${randomBytes(2).toString("hex")}`;
}

function genInstructorPassword() {
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

function asCodeArray(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

function studentHasCourse(user, courseCode) {
  const code = String(courseCode || "").trim();
  if (!code) return false;
  return asCodeArray(user.course_codes).some((c) => String(c).toUpperCase() === code.toUpperCase());
}

async function instructorCourseCodes(sql, instructorId) {
  const rows = await sql`
    SELECT code FROM academy_portal_courses
    WHERE instructor_id = ${instructorId} AND status = 'active'
  `;
  return rows.map((r) => r.code);
}

async function buildGradePdf(grade, studentName, courseTitle) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0, 0.15, 0.3);
  let y = 720;
  const line = (text, size = 12, f = font) => {
    page.drawText(String(text || ""), { x: 50, y, size, font: f, color: navy });
    y -= size + 10;
  };
  line("SVL Training Academy", 18, bold);
  line("Official Grade Report", 14, bold);
  y -= 10;
  line(`Student: ${studentName || "—"}`);
  line(`Course: ${courseTitle || grade.course_code || "—"}`);
  line(`Assessment: ${grade.title || "—"}`);
  line(`Type: ${grade.assessment_type || "—"}`);
  line(`Score: ${grade.score ?? "—"} / ${grade.max_score ?? 100}`);
  if (grade.grade_letter) line(`Letter grade: ${grade.grade_letter}`);
  line(`Status: ${grade.status || "approved"}`);
  line(`Issued: ${new Date(grade.created_at || Date.now()).toLocaleDateString()}`);
  if (grade.notes) {
    y -= 6;
    line("Notes:", 12, bold);
    line(String(grade.notes).slice(0, 400));
  }
  y -= 20;
  line("This document was generated from the SVL Academy Portal.", 10);
  return Buffer.from(await doc.save());
}

export default async function handler(req, res) {
  setCors(res, "x-academy-session");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();
    await ensurePortalSchema(sql);
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
      const codes = asCodeArray(user.course_codes);
      const [grades, attendance, payments, certificates, assignments, classrooms] = await Promise.all([
        sql`SELECT * FROM academy_grades WHERE student_id = ${user.id} AND (status = 'approved' OR status IS NULL OR status = 'pending') ORDER BY created_at DESC LIMIT 100`,
        sql`SELECT * FROM academy_attendance WHERE student_id = ${user.id} ORDER BY session_date DESC LIMIT 100`,
        sql`SELECT * FROM academy_fee_payments WHERE student_id = ${user.id} ORDER BY created_at DESC LIMIT 50`,
        sql`
          SELECT id, certificate_id, course_title, course_code, issue_date, status, file_name
          FROM academy_certificates
          WHERE student_id = ${user.id} OR LOWER(student_email) = ${String(user.email).toLowerCase()}
          ORDER BY issue_date DESC
        `,
        sql`
          SELECT a.*,
            s.id AS submission_id, s.content AS submission_content, s.status AS submission_status,
            s.score AS submission_score, s.max_score AS submission_max_score, s.feedback AS submission_feedback,
            s.attachment_name AS submission_attachment_name, s.created_at AS submitted_at
          FROM academy_assignments a
          LEFT JOIN academy_assignment_submissions s
            ON s.assignment_id = a.id AND s.student_id = ${user.id}
          WHERE a.course_code = ANY(${codes})
          ORDER BY a.created_at DESC
          LIMIT 100
        `,
        sql`
          SELECT * FROM academy_classroom_sessions
          WHERE course_code = ANY(${codes})
          ORDER BY session_date DESC, created_at DESC
          LIMIT 100
        `,
      ]);
      const visibleGrades = grades.filter((g) => g.status === "approved" || !g.status);
      return res.status(200).json({
        user: publicUser(user),
        grades: visibleGrades,
        pendingGrades: grades.filter((g) => g.status === "pending"),
        attendance,
        payments,
        certificates,
        assignments,
        classrooms,
      });
    }

    if (action === "instructor-dashboard" && req.method === "GET") {
      const user = await requirePortalUser(req, sql, ["instructor"]);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const courses = await sql`
        SELECT * FROM academy_portal_courses
        WHERE instructor_id = ${user.id}
        ORDER BY title
      `;
      const codes = courses.map((c) => c.code);
      const students = codes.length
        ? await sql`
            SELECT id, full_name, email, username, course_codes, status, phone
            FROM academy_portal_users
            WHERE role = 'student' AND status = 'active'
              AND course_codes ?| ${codes}
            ORDER BY full_name
            LIMIT 300
          `
        : [];
      const [grades, attendance, assignments, classrooms] = await Promise.all([
        codes.length
          ? sql`SELECT g.*, u.full_name AS student_name FROM academy_grades g JOIN academy_portal_users u ON u.id = g.student_id WHERE g.course_code = ANY(${codes}) ORDER BY g.created_at DESC LIMIT 200`
          : Promise.resolve([]),
        codes.length
          ? sql`SELECT a.*, u.full_name AS student_name FROM academy_attendance a JOIN academy_portal_users u ON u.id = a.student_id WHERE a.course_code = ANY(${codes}) ORDER BY a.session_date DESC LIMIT 200`
          : Promise.resolve([]),
        codes.length
          ? sql`SELECT * FROM academy_assignments WHERE course_code = ANY(${codes}) ORDER BY created_at DESC LIMIT 100`
          : Promise.resolve([]),
        codes.length
          ? sql`SELECT * FROM academy_classroom_sessions WHERE course_code = ANY(${codes}) ORDER BY session_date DESC LIMIT 100`
          : Promise.resolve([]),
      ]);
      return res.status(200).json({
        user: publicUser(user),
        courses,
        students,
        grades,
        attendance,
        assignments,
        classrooms,
      });
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

    // Public live course catalogue (admin portal DB is source of truth)
    if (action === "public-list-courses" && req.method === "GET") {
      await syncCatalogueIntoPortal(sql);
      const rows = await sql`
        SELECT * FROM academy_portal_courses
        WHERE status = 'active'
        ORDER BY title
      `;
      return res.status(200).json({
        courses: rows.map(mapPortalCourseToPublic),
        updatedAt: new Date().toISOString(),
      });
    }

    // ——— Shared learning actions (student / instructor / admin) ———
    const portalUser = await requirePortalUser(req, sql);
    const adminEarly = await requireAdmin(req, sql).catch(() => null);

    if (action === "download-grade-pdf" && req.method === "GET") {
      const actor = portalUser || null;
      if (!actor && !adminEarly) return res.status(401).json({ error: "Unauthorized" });
      const gradeId = cleanText(req.query?.id || body.gradeId || "", 80);
      const rows = await sql`
        SELECT g.*, u.full_name AS student_name
        FROM academy_grades g
        JOIN academy_portal_users u ON u.id = g.student_id
        WHERE g.id = ${gradeId}
        LIMIT 1
      `;
      const grade = rows[0];
      if (!grade) return res.status(404).json({ error: "Grade not found." });
      if (grade.status && grade.status !== "approved" && !adminEarly) {
        return res.status(403).json({ error: "Grade is not approved yet." });
      }
      if (actor?.role === "student" && grade.student_id !== actor.id) {
        return res.status(403).json({ error: "Not your grade." });
      }
      const courseRows = await sql`SELECT title FROM academy_portal_courses WHERE code = ${grade.course_code} LIMIT 1`;
      const pdf = await buildGradePdf(grade, grade.student_name, courseRows[0]?.title);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="SVL_Grade_${String(grade.course_code || "report").replace(/[^a-z0-9_-]/gi, "_")}.pdf"`
      );
      return res.status(200).send(pdf);
    }

    // Instructor / admin: learning records
    if (portalUser?.role === "instructor" || adminEarly) {
      const instructor = portalUser?.role === "instructor" ? portalUser : null;
      const allowedCodes = instructor ? await instructorCourseCodes(sql, instructor.id) : null;

      if (action === "list-students-by-course" && req.method === "GET") {
        const courseCode = cleanText(req.query?.courseCode || body.courseCode || "", 40);
        if (instructor && courseCode && !allowedCodes.includes(courseCode)) {
          return res.status(403).json({ error: "Course not assigned to you." });
        }
        const rows = courseCode
          ? await sql`
              SELECT id, full_name, email, username, course_codes, status, phone
              FROM academy_portal_users
              WHERE role = 'student' AND status = 'active' AND course_codes ? ${courseCode}
              ORDER BY full_name
            `
          : [];
        return res.status(200).json({ students: rows });
      }

      if (action === "instructor-add-attendance" && req.method === "POST") {
        if (!instructor && !adminEarly) return res.status(401).json({ error: "Unauthorized" });
        const courseCode = cleanText(body.courseCode, 40);
        if (instructor && !allowedCodes.includes(courseCode)) {
          return res.status(403).json({ error: "Course not assigned to you." });
        }
        const rows = await sql`
          INSERT INTO academy_attendance (student_id, course_code, session_date, status, notes, recorded_by)
          VALUES (
            ${body.studentId}, ${courseCode}, ${body.sessionDate},
            ${cleanText(body.status, 20) || "present"},
            ${cleanText(body.notes, 500) || null},
            ${instructor?.id || adminEarly.id}
          ) RETURNING *
        `;
        return res.status(201).json({ attendance: rows[0] });
      }

      if (action === "instructor-submit-grade" && req.method === "POST") {
        if (!instructor && !adminEarly) return res.status(401).json({ error: "Unauthorized" });
        const courseCode = cleanText(body.courseCode, 40);
        if (instructor && !allowedCodes.includes(courseCode)) {
          return res.status(403).json({ error: "Course not assigned to you." });
        }
        const status = instructor ? "pending" : cleanText(body.status, 20) || "approved";
        const rows = await sql`
          INSERT INTO academy_grades (
            student_id, course_code, assessment_type, title, score, max_score, grade_letter, notes,
            recorded_by, submitted_by, status
          ) VALUES (
            ${body.studentId}, ${courseCode},
            ${cleanText(body.assessmentType, 40) || "assessment"},
            ${cleanText(body.title, 200)},
            ${body.score != null ? Number(body.score) : null},
            ${body.maxScore != null ? Number(body.maxScore) : 100},
            ${cleanText(body.gradeLetter, 10) || null},
            ${cleanText(body.notes, 500) || null},
            ${instructor?.id || adminEarly.id},
            ${instructor?.id || adminEarly.id},
            ${status}
          ) RETURNING *
        `;
        return res.status(201).json({
          grade: rows[0],
          message: status === "pending" ? "Grade submitted for admin approval." : "Grade recorded.",
        });
      }

      if (action === "create-assignment" && req.method === "POST") {
        if (!instructor && !adminEarly) return res.status(401).json({ error: "Unauthorized" });
        const courseCode = cleanText(body.courseCode, 40);
        const title = cleanText(body.title, 200);
        if (!courseCode || !title) return res.status(400).json({ error: "Course and title are required." });
        if (instructor && !allowedCodes.includes(courseCode)) {
          return res.status(403).json({ error: "Course not assigned to you." });
        }
        if (body.attachmentBase64 && String(body.attachmentBase64).length > MAX_ATTACH_CHARS) {
          return res.status(400).json({ error: "Attachment too large (max ~2MB)." });
        }
        const rows = await sql`
          INSERT INTO academy_assignments (
            course_code, title, description, due_at, attachment_name, attachment_base64, attachment_mime, created_by
          ) VALUES (
            ${courseCode}, ${title}, ${cleanText(body.description, 4000) || null},
            ${body.dueAt || null},
            ${cleanText(body.attachmentName, 200) || null},
            ${body.attachmentBase64 || null},
            ${cleanText(body.attachmentMime, 80) || null},
            ${instructor?.id || adminEarly.id}
          ) RETURNING id, course_code, title, description, due_at, attachment_name, status, created_at
        `;
        return res.status(201).json({ assignment: rows[0] });
      }

      if (action === "list-assignments" && req.method === "GET") {
        const courseCode = cleanText(req.query?.courseCode || body.courseCode || "", 40);
        let rows;
        if (adminEarly && !instructor) {
          rows = courseCode
            ? await sql`SELECT a.*, u.full_name AS created_by_name FROM academy_assignments a LEFT JOIN academy_portal_users u ON u.id = a.created_by WHERE a.course_code = ${courseCode} ORDER BY a.created_at DESC LIMIT 200`
            : await sql`SELECT a.*, u.full_name AS created_by_name FROM academy_assignments a LEFT JOIN academy_portal_users u ON u.id = a.created_by ORDER BY a.created_at DESC LIMIT 300`;
        } else {
          const codes = courseCode ? [courseCode] : allowedCodes;
          if (courseCode && !allowedCodes.includes(courseCode)) {
            return res.status(403).json({ error: "Course not assigned to you." });
          }
          rows = codes?.length
            ? await sql`SELECT * FROM academy_assignments WHERE course_code = ANY(${codes}) ORDER BY created_at DESC LIMIT 200`
            : [];
        }
        return res.status(200).json({ assignments: rows });
      }

      if (action === "list-assignment-submissions" && req.method === "GET") {
        const assignmentId = cleanText(req.query?.assignmentId || body.assignmentId || "", 80);
        const assignment = (
          await sql`SELECT * FROM academy_assignments WHERE id = ${assignmentId} LIMIT 1`
        )[0];
        if (!assignment) return res.status(404).json({ error: "Assignment not found." });
        if (instructor && !allowedCodes.includes(assignment.course_code)) {
          return res.status(403).json({ error: "Not your course." });
        }
        const rows = await sql`
          SELECT s.*, u.full_name AS student_name, u.email AS student_email
          FROM academy_assignment_submissions s
          JOIN academy_portal_users u ON u.id = s.student_id
          WHERE s.assignment_id = ${assignmentId}
          ORDER BY s.created_at DESC
        `;
        return res.status(200).json({ submissions: rows, assignment });
      }

      if (action === "grade-assignment-submission" && req.method === "POST") {
        if (!instructor && !adminEarly) return res.status(401).json({ error: "Unauthorized" });
        const submissionId = body.submissionId;
        const sub = (
          await sql`
            SELECT s.*, a.course_code, a.title AS assignment_title
            FROM academy_assignment_submissions s
            JOIN academy_assignments a ON a.id = s.assignment_id
            WHERE s.id = ${submissionId}
            LIMIT 1
          `
        )[0];
        if (!sub) return res.status(404).json({ error: "Submission not found." });
        if (instructor && !allowedCodes.includes(sub.course_code)) {
          return res.status(403).json({ error: "Not your course." });
        }
        const rows = await sql`
          UPDATE academy_assignment_submissions SET
            score = ${body.score != null ? Number(body.score) : null},
            max_score = ${body.maxScore != null ? Number(body.maxScore) : 100},
            feedback = ${cleanText(body.feedback, 2000) || null},
            status = 'graded',
            graded_by = ${instructor?.id || adminEarly.id},
            graded_at = NOW(),
            updated_at = NOW()
          WHERE id = ${submissionId}
          RETURNING *
        `;
        return res.status(200).json({ submission: rows[0] });
      }

      if (action === "create-classroom" && req.method === "POST") {
        if (!instructor && !adminEarly) return res.status(401).json({ error: "Unauthorized" });
        const courseCode = cleanText(body.courseCode, 40);
        const title = cleanText(body.title, 200);
        const meetingUrl = cleanText(body.meetingUrl, 500);
        if (!courseCode || !title || !meetingUrl || !body.sessionDate) {
          return res.status(400).json({ error: "Course, title, date, and meeting link are required." });
        }
        if (instructor && !allowedCodes.includes(courseCode)) {
          return res.status(403).json({ error: "Course not assigned to you." });
        }
        const rows = await sql`
          INSERT INTO academy_classroom_sessions (
            course_code, title, description, session_date, start_time, end_time,
            meeting_url, platform, created_by, status
          ) VALUES (
            ${courseCode}, ${title}, ${cleanText(body.description, 2000) || null},
            ${body.sessionDate}, ${cleanText(body.startTime, 40) || null},
            ${cleanText(body.endTime, 40) || null}, ${meetingUrl},
            ${cleanText(body.platform, 40) || "Meet/Zoom"},
            ${instructor?.id || adminEarly.id}, 'scheduled'
          ) RETURNING *
        `;
        return res.status(201).json({ session: rows[0] });
      }

      if (action === "list-classroom" && req.method === "GET") {
        const courseCode = cleanText(req.query?.courseCode || body.courseCode || "", 40);
        let rows;
        if (adminEarly && !instructor) {
          rows = courseCode
            ? await sql`SELECT c.*, u.full_name AS instructor_name FROM academy_classroom_sessions c LEFT JOIN academy_portal_users u ON u.id = c.created_by WHERE c.course_code = ${courseCode} ORDER BY c.session_date DESC LIMIT 300`
            : await sql`SELECT c.*, u.full_name AS instructor_name FROM academy_classroom_sessions c LEFT JOIN academy_portal_users u ON u.id = c.created_by ORDER BY c.session_date DESC LIMIT 400`;
        } else {
          const codes = courseCode ? [courseCode] : allowedCodes;
          if (courseCode && !allowedCodes.includes(courseCode)) {
            return res.status(403).json({ error: "Course not assigned to you." });
          }
          rows = codes?.length
            ? await sql`SELECT * FROM academy_classroom_sessions WHERE course_code = ANY(${codes}) ORDER BY session_date DESC LIMIT 200`
            : [];
        }
        return res.status(200).json({ sessions: rows });
      }

      if (action === "student-performance" && req.method === "GET") {
        const studentId = cleanText(req.query?.studentId || body.studentId || "", 80);
        const student = (
          await sql`SELECT id, full_name, email, course_codes, status FROM academy_portal_users WHERE id = ${studentId} AND role = 'student' LIMIT 1`
        )[0];
        if (!student) return res.status(404).json({ error: "Student not found." });
        if (instructor) {
          const overlap = asCodeArray(student.course_codes).some((c) => allowedCodes.includes(c));
          if (!overlap) return res.status(403).json({ error: "Student is not in your courses." });
        }
        const [grades, attendance, submissions] = await Promise.all([
          sql`SELECT * FROM academy_grades WHERE student_id = ${studentId} ORDER BY created_at DESC`,
          sql`SELECT * FROM academy_attendance WHERE student_id = ${studentId} ORDER BY session_date DESC`,
          sql`
            SELECT s.*, a.title AS assignment_title, a.course_code
            FROM academy_assignment_submissions s
            JOIN academy_assignments a ON a.id = s.assignment_id
            WHERE s.student_id = ${studentId}
            ORDER BY s.created_at DESC
          `,
        ]);
        return res.status(200).json({ student, grades, attendance, submissions });
      }
    }

    // Student assignment submit
    if (action === "submit-assignment" && req.method === "POST") {
      const user = portalUser;
      if (!user || user.role !== "student") return res.status(401).json({ error: "Student login required." });
      const assignmentId = body.assignmentId;
      const assignment = (
        await sql`SELECT * FROM academy_assignments WHERE id = ${assignmentId} LIMIT 1`
      )[0];
      if (!assignment) return res.status(404).json({ error: "Assignment not found." });
      if (!studentHasCourse(user, assignment.course_code)) {
        return res.status(403).json({ error: "You are not enrolled in this course." });
      }
      if (body.attachmentBase64 && String(body.attachmentBase64).length > MAX_ATTACH_CHARS) {
        return res.status(400).json({ error: "Attachment too large (max ~2MB)." });
      }
      const rows = await sql`
        INSERT INTO academy_assignment_submissions (
          assignment_id, student_id, content, attachment_name, attachment_base64, attachment_mime, status
        ) VALUES (
          ${assignmentId}, ${user.id}, ${cleanText(body.content, 8000) || null},
          ${cleanText(body.attachmentName, 200) || null},
          ${body.attachmentBase64 || null},
          ${cleanText(body.attachmentMime, 80) || null},
          'submitted'
        )
        ON CONFLICT (assignment_id, student_id) DO UPDATE SET
          content = EXCLUDED.content,
          attachment_name = EXCLUDED.attachment_name,
          attachment_base64 = COALESCE(EXCLUDED.attachment_base64, academy_assignment_submissions.attachment_base64),
          attachment_mime = COALESCE(EXCLUDED.attachment_mime, academy_assignment_submissions.attachment_mime),
          status = 'submitted',
          updated_at = NOW()
        RETURNING id, assignment_id, status, score, feedback, created_at, updated_at
      `;
      return res.status(200).json({ submission: rows[0] });
    }

    // ——— Admin portal management ———
    const admin = adminEarly || (await requireAdmin(req, sql).catch(() => null));
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

      const username =
        studentLoginEmail(body.username || enrollment.email) ||
        studentLoginEmail(enrollment.email);
      if (!username.includes("@")) {
        return res.status(400).json({ error: "Enrollment email is required as the student login." });
      }
      const password = body.password ? String(body.password) : studentDefaultPassword(enrollment.full_name);
      if (password.length < 4) {
        return res.status(400).json({ error: "Generated password is invalid. Check the student name." });
      }

      const existing = await sql`
        SELECT id FROM academy_portal_users
        WHERE LOWER(username) = ${username} OR LOWER(email) = ${username}
        LIMIT 1
      `;
      if (existing[0]) {
        return res.status(400).json({
          error: "A portal account already exists for this email. Use Reset Password instead.",
        });
      }

      const created = await sql`
        INSERT INTO academy_portal_users (
          role, username, email, password_hash, full_name, phone, enrollment_id,
          course_codes, status, must_change_password, created_by
        ) VALUES (
          'student',
          ${username},
          ${username},
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

      const codes = Array.isArray(enrollment.course_codes) ? enrollment.course_codes : [];
      return res.status(201).json({
        user: created[0],
        credentials: { username, password, note: "Login email = enrollment email. Default password = SVL + last name." },
        message: "Enrollment approved. Share these credentials with the student securely.",
        courseCodes: codes,
      });
    }

    if (action === "create-user" && req.method === "POST") {
      const role = cleanText(body.role, 20) === "instructor" ? "instructor" : "student";
      const fullName = cleanText(body.fullName, 100);
      const email = cleanText(body.email, 120).toLowerCase();
      const username =
        role === "student"
          ? studentLoginEmail(body.username || email)
          : cleanText(body.username, 80).toLowerCase() || genInstructorUsername(fullName);
      const password =
        body.password
          ? String(body.password)
          : role === "student"
            ? studentDefaultPassword(fullName)
            : genInstructorPassword();
      if (fullName.length < 2 || !email.includes("@")) {
        return res.status(400).json({ error: "Full name and valid email are required." });
      }
      if (role === "student" && !username.includes("@")) {
        return res.status(400).json({ error: "Student login must be their email address." });
      }
      if (password.length < 4) return res.status(400).json({ error: "Password is too short." });

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
      const existingUser = (
        await sql`SELECT id, role, username, email, full_name FROM academy_portal_users WHERE id = ${userId} LIMIT 1`
      )[0];
      if (!existingUser) return res.status(404).json({ error: "User not found." });
      const password = body.password
        ? String(body.password)
        : existingUser.role === "student"
          ? studentDefaultPassword(existingUser.full_name)
          : genInstructorPassword();
      if (password.length < 4) return res.status(400).json({ error: "Password is too short." });
      const updated = await sql`
        UPDATE academy_portal_users
        SET password_hash = ${hashPassword(password)}, must_change_password = true, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, username, email, full_name, role
      `;
      return res.status(200).json({
        user: updated[0],
        credentials: { username: updated[0].username, password },
      });
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
      const sync = await syncCatalogueIntoPortal(sql);
      const rows = await sql`
        SELECT c.*, u.full_name AS instructor_name
        FROM academy_portal_courses c
        LEFT JOIN academy_portal_users u ON u.id = c.instructor_id
        ORDER BY c.title
      `;
      return res.status(200).json({ courses: rows, sync });
    }

    if (action === "sync-courses" && req.method === "POST") {
      const sync = await syncCatalogueIntoPortal(sql);
      const rows = await sql`SELECT * FROM academy_portal_courses ORDER BY title`;
      return res.status(200).json({ ok: true, sync, courses: rows });
    }

    if (action === "upsert-course" && req.method === "POST") {
      const code = cleanText(body.code, 40);
      const title = cleanText(body.title, 200);
      if (!code || !title) return res.status(400).json({ error: "Course code and title are required." });
      const rows = await sql`
        INSERT INTO academy_portal_courses (
          code, title, description, long_description, duration, tuition, registration_fee,
          instructor_id, status, category, level, slug, image, programme_type
        ) VALUES (
          ${code}, ${title}, ${cleanText(body.description, 2000) || null},
          ${cleanText(body.longDescription, 4000) || cleanText(body.description, 2000) || null},
          ${cleanText(body.duration, 80) || null},
          ${Number(body.tuition) || 0}, ${Number(body.registrationFee) || 0},
          ${body.instructorId || null},
          ${cleanText(body.status, 30) || "active"},
          ${cleanText(body.category, 80) || null},
          ${cleanText(body.level, 40) || null},
          ${cleanText(body.slug, 120) || code.toLowerCase()},
          ${cleanText(body.image, 200) || null},
          ${cleanText(body.programmeType, 80) || null}
        )
        ON CONFLICT (code) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          long_description = EXCLUDED.long_description,
          duration = EXCLUDED.duration,
          tuition = EXCLUDED.tuition,
          registration_fee = EXCLUDED.registration_fee,
          instructor_id = EXCLUDED.instructor_id,
          status = EXCLUDED.status,
          category = COALESCE(EXCLUDED.category, academy_portal_courses.category),
          level = COALESCE(EXCLUDED.level, academy_portal_courses.level),
          slug = COALESCE(EXCLUDED.slug, academy_portal_courses.slug),
          image = COALESCE(EXCLUDED.image, academy_portal_courses.image),
          programme_type = COALESCE(EXCLUDED.programme_type, academy_portal_courses.programme_type),
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
          student_id, course_code, assessment_type, title, score, max_score, grade_letter, notes,
          recorded_by, submitted_by, status, reviewed_by, reviewed_at
        ) VALUES (
          ${body.studentId}, ${cleanText(body.courseCode, 40)},
          ${cleanText(body.assessmentType, 40) || "assignment"},
          ${cleanText(body.title, 200)},
          ${body.score != null ? Number(body.score) : null},
          ${body.maxScore != null ? Number(body.maxScore) : 100},
          ${cleanText(body.gradeLetter, 10) || null},
          ${cleanText(body.notes, 500) || null},
          ${admin.id}, ${admin.id}, 'approved', ${admin.id}, NOW()
        ) RETURNING *
      `;
      return res.status(201).json({ grade: rows[0] });
    }

    if (action === "approve-grade" && req.method === "POST") {
      const rows = await sql`
        UPDATE academy_grades
        SET status = ${cleanText(body.status, 20) || "approved"},
            reviewed_by = ${admin.id},
            reviewed_at = NOW()
        WHERE id = ${body.gradeId}
        RETURNING *
      `;
      if (!rows[0]) return res.status(404).json({ error: "Grade not found." });
      return res.status(200).json({ grade: rows[0] });
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
