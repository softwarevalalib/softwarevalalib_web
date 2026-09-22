import { randomBytes } from "node:crypto";
import {
  getSql,
  setCors,
  cleanText,
  parseBody,
  requireAdmin,
} from "./_lib.js";
import {
  ACADEMY_KNOWLEDGE,
  ENROLLMENT_FIELDS,
  searchAcademyCourses,
  getCourseDetails,
  recommendCourses,
  getFaqAnswer,
  courseCardPayload,
} from "./_knowledge.js";
import { generateAdmissionPdf, buildAdmissionMerge } from "./_admissionPdf.js";

const EMAIL_DISCLOSURE =
  "We'll use this email for your enrollment communication and to send your admission letter and other important Academy information related to your application.";

const PRIVACY_NOTICE =
  "To help complete your application, I'll collect the information required by SVL Training Academy. Your email will also be used for application communication and delivery of your admission letter. Please don't send passwords, PINs or mobile-money credentials.";

function newKey(prefix = "sess") {
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

function parseBool(value) {
  const v = String(value || "").trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(v)) return true;
  if (["no", "n", "false", "0"].includes(v)) return false;
  return null;
}

async function getSettings(sql) {
  const rows = await sql`SELECT * FROM academy_assistant_settings WHERE id = 1`;
  return (
    rows[0] || {
      assistant_enabled: true,
      greeting_enabled: true,
      greeting_delay_ms: 5000,
      admission_letter_trigger: "immediately_after_valid_application",
      student_email_enabled: true,
    }
  );
}

function looksLikeQuestion(text) {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return false;
  if (q.includes("?")) return true;
  return /^(what|why|how|when|where|who|which|can|do|does|is|are|tell|explain|describe|help)\b/.test(q);
}

function enrollmentProgress(data, courseCodes) {
  const requiredTotal = ENROLLMENT_FIELDS.filter((f) => f.required).length + 1;
  const completed =
    (courseCodes?.length ? 1 : 0) +
    ENROLLMENT_FIELDS.filter(
      (f) => f.required && data?.[f.key] !== undefined && data?.[f.key] !== null && data?.[f.key] !== ""
    ).length;
  return { completed, total: requiredTotal };
}

async function ensureSession(sql, { sessionKey, visitorId, pageUrl }) {
  if (sessionKey) {
    const existing = await sql`
      SELECT * FROM academy_chat_sessions WHERE session_key = ${sessionKey} LIMIT 1
    `;
    if (existing[0]) {
      await sql`
        UPDATE academy_chat_sessions
        SET last_activity_at = NOW(), page_url = COALESCE(${pageUrl || null}, page_url)
        WHERE id = ${existing[0].id}
      `;
      return existing[0];
    }
  }
  const key = newKey("chat");
  const rows = await sql`
    INSERT INTO academy_chat_sessions (session_key, visitor_id, page_url)
    VALUES (${key}, ${visitorId || null}, ${pageUrl || null})
    RETURNING *
  `;
  return rows[0];
}

async function addMessage(sql, sessionId, role, content, uiPayload = {}) {
  const rows = await sql`
    INSERT INTO academy_chat_messages (session_id, role, content, ui_payload)
    VALUES (${sessionId}, ${role}, ${content}, ${JSON.stringify(uiPayload)})
    RETURNING id, role, content, ui_payload, created_at
  `;
  return rows[0];
}

async function addEvent(sql, sessionId, eventType, metadata = {}, courseCode = null) {
  await sql`
    INSERT INTO academy_chat_events (session_id, event_type, course_code, metadata)
    VALUES (${sessionId}, ${eventType}, ${courseCode}, ${JSON.stringify(metadata)})
  `;
}

async function logUnanswered(sql, question) {
  const normalized = cleanText(question, 240).toLowerCase();
  if (normalized.length < 8) return;
  await sql`
    INSERT INTO academy_unanswered_questions (normalized_question, sample_question)
    VALUES (${normalized}, ${cleanText(question, 500)})
    ON CONFLICT (normalized_question)
    DO UPDATE SET
      occurrence_count = academy_unanswered_questions.occurrence_count + 1,
      last_asked_at = NOW(),
      sample_question = EXCLUDED.sample_question
  `;
}

function draftMissing(data, courseCodes) {
  const missing = [];
  if (!courseCodes?.length) missing.push({ key: "courseCodes", label: "Course selection (codes)" });
  for (const field of ENROLLMENT_FIELDS) {
    if (!field.required) continue;
    const val = data?.[field.key];
    if (val === undefined || val === null || val === "") missing.push(field);
  }
  return missing;
}

function nextEnrollmentPrompt(data, courseCodes) {
  const missing = draftMissing(data, courseCodes);
  if (!missing.length) return null;
  const field = missing[0];
  if (field.key === "courseCodes") {
    return {
      text: "Which course code(s) would you like to enroll in? You can name a course (e.g. AI, React, Excel) and I'll look it up, or paste codes like SVL-DEV-201.",
      field: "courseCodes",
    };
  }
  if (field.disclosure) {
    return {
      text: `What email address should the Academy use for your application and admission letter?\n\n${EMAIL_DISCLOSURE}`,
      field: field.key,
    };
  }
  return {
    text: `Great. ${field.label}?`,
    field: field.key,
  };
}

async function getOrCreateDraft(sql, sessionId) {
  const rows = await sql`
    SELECT * FROM academy_enrollment_drafts
    WHERE session_id = ${sessionId} AND status = 'draft'
    ORDER BY updated_at DESC LIMIT 1
  `;
  if (rows[0]) return rows[0];
  const created = await sql`
    INSERT INTO academy_enrollment_drafts (session_id)
    VALUES (${sessionId})
    RETURNING *
  `;
  return created[0];
}

async function updateDraft(sql, draftId, patch) {
  const rows = await sql`
    UPDATE academy_enrollment_drafts
    SET
      data = COALESCE(data, '{}'::jsonb) || ${JSON.stringify(patch.data || {})}::jsonb,
      course_codes = COALESCE(${JSON.stringify(patch.courseCodes || null)}::jsonb, course_codes),
      updated_at = NOW()
    WHERE id = ${draftId}
    RETURNING *
  `;
  return rows[0];
}

async function submitDraftEnrollment(sql, draft) {
  const data = draft.data || {};
  const courseCodes = Array.isArray(draft.course_codes) ? draft.course_codes : [];
  const missing = draftMissing(data, courseCodes);
  if (missing.length) {
    return { ok: false, error: `Missing required fields: ${missing.map((m) => m.label).join(", ")}` };
  }

  const fullName = cleanText(data.fullName, 100);
  const email = cleanText(data.email, 120).toLowerCase();
  const phone = cleanText(data.phone, 40);
  if (!email.includes("@")) return { ok: false, error: "A valid email is required." };

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
      ${cleanText(data.gender, 30) || null},
      ${data.dateOfBirth || null},
      ${email},
      ${phone},
      ${cleanText(data.whatsapp, 40) || null},
      ${cleanText(data.county, 80) || null},
      ${cleanText(data.country, 80) || "Liberia"},
      ${cleanText(data.educationLevel, 80) || null},
      ${cleanText(data.occupation, 100) || null},
      ${cleanText(data.employer, 120) || null},
      ${JSON.stringify(courseCodes)},
      ${cleanText(data.programmeType, 80) || null},
      ${cleanText(data.preferredSession, 40) || null},
      ${Boolean(data.hasLaptop)},
      ${Boolean(data.hasInternet)},
      ${Boolean(data.basicComputerKnowledge)},
      ${cleanText(data.heardAbout, 120) || null},
      ${cleanText(data.motivation, 1000) || null},
      ${cleanText(data.notes, 1000) || "Submitted via SVL Academy Assistant"},
      'pending'
    )
    RETURNING id, reference_number, full_name, course_codes, created_at, email, county, country, preferred_session
  `;

  await sql`
    UPDATE academy_enrollment_drafts SET status = 'submitted', updated_at = NOW() WHERE id = ${draft.id}
  `;

  return { ok: true, enrollment: rows[0] };
}

async function maybeGenerateAdmission(sql, enrollment, settings) {
  // Admission letters are issued automatically after a valid application —
  // admin approval is not required before the letter is generated and emailed.
  const trigger =
    settings.admission_letter_trigger || "immediately_after_valid_application";
  if (
    trigger !== "immediately_after_valid_application" &&
    trigger !== "after_first_payment"
  ) {
    // Force auto-issue even if an older setting still says "after_admin_approval".
  }
  return generateAndStoreAdmission(sql, enrollment, settings);
}

async function notifyAdminAdmission(sql, enrollment, admission, settings) {
  const adminEmail =
    settings.human_support_email ||
    process.env.ACADEMY_ADMIN_EMAIL ||
    process.env.ACADEMY_FROM_EMAIL ||
    "";
  const to = String(adminEmail)
    .replace(/^.*<|>$/g, "")
    .match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0];
  if (!to) return "SKIPPED_NO_ADMIN";

  const courses = Array.isArray(enrollment.course_codes)
    ? enrollment.course_codes.join(", ")
    : "";
  const body = [
    "New SVL Training Academy application — admission letter auto-issued (no admin approval required).",
    "",
    `Reference: ${enrollment.reference_number}`,
    `Student: ${enrollment.full_name}`,
    `Email: ${enrollment.email}`,
    `Courses: ${courses}`,
    `Letter status: ${admission?.document?.status || "GENERATED"}`,
    admission?.downloadPath
      ? `Download: https://softwarevala.com${admission.downloadPath}`
      : "",
    "",
    "Review in Admin → AI Assistant → Admission Documents.",
  ]
    .filter(Boolean)
    .join("\n");

  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.ACADEMY_FROM_EMAIL ||
    "SVL Training Academy <onboarding@resend.dev>";

  try {
    if (key) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `Admission letter issued — ${enrollment.reference_number}`,
          text: body,
        }),
      });
      return res.ok ? "SENT" : "FAILED";
    }
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `Admission letter issued — ${enrollment.reference_number}`,
        message: body,
        _template: "box",
        _captcha: "false",
      }),
    });
    return "SENT_LINK";
  } catch {
    return "FAILED";
  }
}

async function generateAndStoreAdmission(sql, enrollment, settings) {
  const codes = Array.isArray(enrollment.course_codes) ? enrollment.course_codes : [];
  const courses = codes.map((code) => getCourseDetails(code)).filter(Boolean);
  const fullName = enrollment.full_name;
  const firstName = String(fullName).split(/\s+/)[0];
  const merge = buildAdmissionMerge(enrollment, courses);

  const pdf = await generateAdmissionPdf(merge);
  const accessToken = newKey("adm");
  const rows = await sql`
    INSERT INTO academy_admission_documents (
      enrollment_id, reference_number, student_full_name, student_email,
      course_codes, merge_data, file_name, file_base64, access_token,
      template_version, status, email_delivery_status
    ) VALUES (
      ${enrollment.id},
      ${enrollment.reference_number},
      ${fullName},
      ${enrollment.email},
      ${JSON.stringify(codes)},
      ${JSON.stringify(merge)},
      ${pdf.fileName},
      ${pdf.bytes.toString("base64")},
      ${accessToken},
      ${pdf.templateVersion},
      'GENERATED',
      'PENDING'
    )
    RETURNING id, reference_number, file_name, access_token, status, generated_at
  `;

  let emailStatus = "SKIPPED";
  if (settings.student_email_enabled !== false) {
    emailStatus = await sendAdmissionEmail({
      to: enrollment.email,
      firstName,
      courses,
      fileName: pdf.fileName,
      pdfBase64: pdf.bytes.toString("base64"),
      accessToken,
    });
    await sql`
      UPDATE academy_admission_documents
      SET emailed_at = CASE WHEN ${emailStatus} = 'SENT' THEN NOW() ELSE NULL END,
          email_delivery_status = ${emailStatus},
          status = CASE WHEN ${emailStatus} = 'SENT' THEN 'EMAILED' ELSE 'EMAIL_FAILED' END
      WHERE id = ${rows[0].id}
    `;
  }

  return {
    deferred: false,
    document: rows[0],
    emailStatus,
    downloadPath: `/api/academy/admission?token=${accessToken}`,
  };
}

async function sendAdmissionEmail({ to, firstName, courses, fileName, pdfBase64, accessToken }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ACADEMY_FROM_EMAIL || "SVL Training Academy <onboarding@resend.dev>";
  const courseLabel = courses.map((c) => c.title).join(", ") || "your programme";

  if (!key) {
    // Fallback notification via FormSubmit (no attachment)
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `SVL Training Academy — Admission Letter — ${firstName}`,
          message: `Dear ${firstName},\n\nCongratulations. Your SVL Training Academy admission letter for ${courseLabel} is ready.\n\nSecure download link (keep private):\nhttps://softwarevala.com/api/academy/admission?token=${accessToken}\n\nPlease review the admission terms carefully.\n\nRegards,\nSVL Training Academy\nSoftware Vala Liberia`,
          _template: "box",
          _captcha: "false",
        }),
      });
      return "SENT_LINK";
    } catch {
      return "FAILED";
    }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `SVL Training Academy — Admission Letter — ${firstName}`,
        text: `Dear ${firstName},\n\nCongratulations.\n\nYour SVL Training Academy admission letter for ${courseLabel} is attached.\n\nPlease review the admission terms, registration requirements and acceptance section carefully.\n\nRegards,\nSVL Training Academy\nSoftware Vala Liberia`,
        attachments: [{ filename: fileName, content: pdfBase64 }],
      }),
    });
    return res.ok ? "SENT" : "FAILED";
  } catch {
    return "FAILED";
  }
}

function buildSystemPrompt() {
  return `You are the SVL Academy Assistant, the AI admissions and course advisor for SVL Training Academy (Software Vala Liberia).
Clearly identify as an AI assistant — never pretend to be a human staff member.
Use ONLY confirmed Academy information from tools/retrieved knowledge.
Never invent prices, courses, schedules, dates, requirements, payment account numbers, or admission decisions.
Distinguish Application Submitted from Admission Approved.
Never guarantee employment or income outcomes.
Never ask for passwords, PINs, OTPs, or mobile-money credentials.
If information is unavailable, say you don't have confirmed information and offer Admissions handoff.
When recommending courses, explain relevance to the learner's stated goal.
Offer BOTH self-enrollment (/academy/enroll) and Enroll With Assistant when enrollment intent is clear.
Before submitting enrollment, require explicit user confirmation of a summary.`;
}

async function callOpenAI({ messages, tools }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages,
      tools,
      tool_choice: "auto",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("openai error", err);
    return null;
  }
  return res.json();
}

function ruleBasedReply(text, context) {
  const q = text.toLowerCase();
  const ui = { buttons: [], courses: [], actions: [] };

  // Prefer full explanations for information questions before course browsing.
  if (/how does enrollment|enrollment work|how do i enroll|application process|admission process/.test(q)) {
    return {
      content: [
        "Here's how enrollment works at SVL Training Academy:",
        "",
        "1. Choose a course (or ask me to recommend one based on your goals).",
        "2. Click Select to enroll on the course you want — or use Enroll With Assistant / the full form at /academy/enroll.",
        "3. Share your personal details (name, email, phone, and a few optional fields).",
        "4. Review the summary and confirm submission.",
        "5. You receive an application reference. Your admission letter is prepared automatically (usually within 10–30 minutes) and emailed to you — admin approval is not required before the letter is sent.",
        "6. Your admission letter is emailed to you automatically (usually within 10–30 minutes). Academy staff manage applications in the admin dashboard.",
        "",
        "Would you like me to recommend a course, or start enrollment now?",
      ].join("\n"),
      ui: {
        buttons: [
          { label: "Find a Course", action: "quick", value: "Help me find a course for my goals" },
          { label: "Enroll With Assistant", action: "start_assistant_enroll" },
          { label: "Contact Admissions", action: "handoff" },
        ],
      },
    };
  }

  if (/enroll|application|apply|register/.test(q) && !/how|what|explain/.test(q)) {
    const enrollButtons = [
      { label: "Complete Enrollment Form", action: "self_enroll", href: "/academy/enroll" },
      { label: "Enroll With Assistant", action: "start_assistant_enroll" },
    ];
    return {
      content:
        "You can complete the enrollment form yourself, or I can guide you here. Once you select a course, I'll ask only for your personal details — I won't keep suggesting more courses. I'll show a summary and submit only after you confirm.",
      ui: { buttons: enrollButtons, type: "enrollment_options" },
    };
  }

  if (/fee|tuition|price|cost|\$|payment|instal+ment/.test(q)) {
    const programmes = ACADEMY_KNOWLEDGE.programmes
      .map((p) => `• ${p.name}: US$${p.tuition} + US$${p.registration} registration (${p.duration})`)
      .join("\n");
    return {
      content: [
        "Here is a clear fee overview from Academy records:",
        "",
        "Professional programmes:",
        programmes,
        "",
        "Technology / skills courses: tuition is typically US$125–US$175 per course (exact amount is on each course card), plus any listed registration fee.",
        "",
        "Tuition is paid in three installments: 40% first payment, 30% second payment, and 30% final payment.",
        ACADEMY_KNOWLEDGE.payments?.[0] ||
          "Payment guidance is shared after Admissions processes your application.",
        "Official merchant / mobile-money numbers are never published in chat until Admissions confirms your application.",
        "",
        "If you tell me a course name or skill goal, I can show the exact tuition for matching courses.",
      ].join("\n"),
      ui: {
        buttons: [
          { label: "Browse Courses", href: "/academy#courses" },
          { label: "Enroll Now", action: "start_assistant_enroll" },
        ],
      },
    };
  }

  if (/schedule|session|class time|when.*class|timezone|orientation|cohort/.test(q)) {
    const sessions = ACADEMY_KNOWLEDGE.sessions
      .map((s) => `• ${s.label}: ${s.days}, ${s.time}`)
      .join("\n");
    return {
      content: [
        `Live session groups (${ACADEMY_KNOWLEDGE.timezone}):`,
        "",
        sessions,
        "",
        `Cohort enrollment window: ${ACADEMY_KNOWLEDGE.cohort.enrollment}.`,
        `Orientation: ${ACADEMY_KNOWLEDGE.cohort.orientation}.`,
        `Classes begin: ${ACADEMY_KNOWLEDGE.cohort.classesBegin}.`,
        "",
        "You can note a preferred session group (A–D) during enrollment. Exact live-link details are shared after admission.",
      ].join("\n"),
      ui: {},
    };
  }

  const faq = getFaqAnswer(text);
  if (faq && looksLikeQuestion(text) && !/recommend|suggest|find a course|want to learn/.test(q)) {
    return {
      content: faq.a,
      ui: {
        buttons: [
          { label: "Find a Course", action: "quick", value: "Help me find a course for my goals" },
          { label: "Enroll With Assistant", action: "start_assistant_enroll" },
        ],
      },
    };
  }

  if (
    /compare|difference|vs\.|versus/.test(q) ||
    /beginner|intermediate|advanced|ai|react|excel|network|cyber|web|python/.test(q)
  ) {
    const maxTuition = /under\s*\$?\s*150|below\s*\$?\s*150/.test(q) ? 150 : undefined;
    const level = /beginner/.test(q)
      ? "Beginner"
      : /intermediate/.test(q)
        ? "Intermediate"
        : /advanced/.test(q)
          ? "Advanced"
          : undefined;
    const courses = searchAcademyCourses({ query: text, maxTuition, level, limit: 5 });
    if (!courses.length) {
      return {
        content:
          "I don't have confirmed matching courses for that request yet. I can explain enrolment, fees, or schedules — or connect you with Admissions.",
        ui: { buttons: [{ label: "Contact Admissions", action: "handoff" }] },
      };
    }
    return {
      content:
        "Based on your question, these courses from the live Academy catalogue look relevant.\n\nClick Select to enroll on any course below. After you select one, I'll ask for your personal details only — I won't keep listing more courses.",
      ui: {
        type: "course_list",
        courses: courses.map((c) => courseCardPayload(c)),
        buttons: [
          { label: "View Full Catalogue", href: "/academy#courses" },
          { label: "Ask another question", action: "focus_input" },
        ],
      },
    };
  }

  if (/recommend|suggest|help me choose|what should i|find a course|want to learn|goal/.test(q) || context.goal) {
    const recs = recommendCourses({
      goal: text,
      education: context.education,
      experience: context.experience,
      level: context.level,
      limit: 4,
    });
    if (!recs.length) {
      return {
        content:
          "Tell me a bit more so I can recommend accurately: What would you like to learn, and are you looking for beginner, intermediate, or advanced training?",
        ui: {
          buttons: [
            { label: "Beginner", action: "quick", value: "I want beginner courses" },
            { label: "AI & Web", action: "quick", value: "I want to learn AI and website development" },
            { label: "Business software", action: "quick", value: "I want QuickBooks and Excel courses" },
          ],
        },
      };
    }
    return {
      content:
        "Based on what you've told me, these courses appear relevant to the skills you want to build. Recommendations use the Academy catalogue only — they do not guarantee employment or career outcomes.\n\nClick Select to enroll on the course you want. Once selected, I'll collect your personal details to enroll you — I won't keep suggesting more courses.",
      ui: {
        type: "course_list",
        courses: recs.map((c) => courseCardPayload(c, c.why)),
        buttons: [
          { label: "Complete Enrollment Form", href: "/academy/enroll" },
          { label: "Ask a question", action: "focus_input" },
        ],
      },
    };
  }

  if (faq) {
    return {
      content: faq.a,
      ui: { buttons: [{ label: "Find a Course", action: "quick", value: "Help me find a course" }] },
    };
  }

  return {
    content:
      "I can help you explore courses, compare programmes, explain fees and schedules in detail, or guide enrollment. What would you like to learn or achieve?",
    ui: {
      buttons: [
        { label: "Find a Course", action: "quick", value: "Help me find a course for my goals" },
        { label: "View Fees", action: "quick", value: "Explain the tuition fees and payment options in detail" },
        { label: "How Enrollment Works", action: "quick", value: "How does enrollment work? Please explain the steps." },
        { label: "Enroll Now", action: "start_assistant_enroll" },
      ],
    },
    unanswered: true,
  };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();
    const settings = await getSettings(sql);

    if (req.method === "GET") {
      const admin = await requireAdmin(req, sql).catch(() => null);
      if (!admin) return res.status(401).json({ error: "Unauthorized" });
      // lightweight stats for admin overview
      const days = Math.min(Math.max(Number(req.query?.days) || 30, 1), 90);
      const [totals, unanswered, documents] = await Promise.all([
        sql`
          SELECT
            (SELECT COUNT(*)::int FROM academy_chat_sessions WHERE started_at >= NOW() - make_interval(days => ${days})) AS conversations,
            (SELECT COUNT(*)::int FROM academy_chat_sessions WHERE started_at::date = CURRENT_DATE) AS conversations_today,
            (SELECT COUNT(DISTINCT visitor_id)::int FROM academy_chat_sessions WHERE started_at >= NOW() - make_interval(days => ${days})) AS unique_visitors,
            (SELECT COUNT(*)::int FROM academy_chat_events WHERE event_type = 'COURSE_RECOMMENDED' AND created_at >= NOW() - make_interval(days => ${days})) AS recommendation_sessions,
            (SELECT COUNT(*)::int FROM academy_chat_events WHERE event_type = 'ENROLLMENT_STARTED' AND created_at >= NOW() - make_interval(days => ${days})) AS enrollment_starts,
            (SELECT COUNT(*)::int FROM academy_chat_events WHERE event_type = 'ENROLLMENT_SUBMITTED' AND created_at >= NOW() - make_interval(days => ${days})) AS completed_applications,
            (SELECT COUNT(*)::int FROM academy_chat_events WHERE event_type = 'HANDOFF_REQUESTED' AND created_at >= NOW() - make_interval(days => ${days})) AS handoffs,
            (SELECT COUNT(*)::int FROM academy_admission_documents WHERE generated_at >= NOW() - make_interval(days => ${days})) AS admission_letters
        `,
        sql`SELECT COUNT(*)::int AS count FROM academy_unanswered_questions WHERE status = 'open'`,
        sql`SELECT COUNT(*)::int AS count FROM academy_admission_documents`,
      ]);
      return res.status(200).json({
        settings,
        stats: { ...totals[0], unanswered: unanswered[0]?.count || 0, admission_total: documents[0]?.count || 0 },
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST, OPTIONS");
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (settings.assistant_enabled === false) {
      return res.status(503).json({ error: "SVL Academy Assistant is currently disabled." });
    }

    const body = parseBody(req);
    if (body.website) return res.status(200).json({ ok: true });

    const action = cleanText(body.action || "chat", 40);
    const session = await ensureSession(sql, {
      sessionKey: cleanText(body.sessionKey, 80),
      visitorId: cleanText(body.visitorId, 80),
      pageUrl: cleanText(body.pageUrl, 300),
    });

    if (action === "bootstrap") {
      await addEvent(sql, session.id, "CHAT_OPENED", { pageUrl: body.pageUrl });
      const welcome =
        settings.welcome_message ||
        "Hi! I'm the SVL Academy Assistant. I can help you explore courses, compare programmes, choose training based on your goals, understand fees and schedules, or guide you through enrollment.";
      const msg = await addMessage(sql, session.id, "assistant", welcome, {
        buttons: [
          { label: "Find a Course", action: "quick", value: "Help me find a course for my goals" },
          { label: "View Fees", action: "quick", value: "What are the tuition fees?" },
          { label: "How Enrollment Works", action: "quick", value: "How does enrollment work?" },
          { label: "Enroll Now", action: "start_assistant_enroll" },
          { label: "Ask a Question", action: "focus_input" },
        ],
      });
      return res.status(200).json({
        sessionKey: session.session_key,
        settings: {
          greetingEnabled: settings.greeting_enabled !== false,
          greetingDelayMs: settings.greeting_delay_ms || 5000,
          assistantName: settings.assistant_name || "SVL Academy Assistant",
        },
        messages: [msg],
      });
    }

    if (action === "event") {
      await addEvent(sql, session.id, cleanText(body.eventType, 60) || "CUSTOM", body.metadata || {}, cleanText(body.courseCode, 40) || null);
      return res.status(200).json({ ok: true, sessionKey: session.session_key });
    }

    if (action === "consent") {
      await sql`UPDATE academy_chat_sessions SET consent_at = NOW() WHERE id = ${session.id}`;
      const draft = await getOrCreateDraft(sql, session.id);
      const data = draft.data || {};
      const codes = Array.isArray(draft.course_codes) ? draft.course_codes : [];
      const next = nextEnrollmentPrompt(data, codes);
      const progress = enrollmentProgress(data, codes);
      const text = next
        ? codes.length
          ? `Thank you. You're enrolling in ${codes.join(", ")}. I'll now collect your personal details only — I won't suggest more courses.\n\n${next.text}`
          : `Thank you. We can continue your application.\n\n${next.text}`
        : "Thank you. Please review your information before submitting.";
      const msg = await addMessage(sql, session.id, "assistant", text, {
        enrollment: { step: "collect", privacyAccepted: true, field: next?.field || null, progress },
        buttons: next
          ? [
              { label: "Review Details", action: "review_draft" },
              { label: "Cancel Application", action: "cancel_draft" },
            ]
          : [
              { label: "Submit Enrollment", action: "confirm_submit" },
              { label: "Edit Details", action: "edit_draft" },
            ],
      });
      return res.status(200).json({
        sessionKey: session.session_key,
        messages: [msg],
        awaitingField: next?.field || null,
        progress,
      });
    }

    if (action === "select_course") {
      const rawCodes = Array.isArray(body.courseCodes)
        ? body.courseCodes
        : body.courseCode
          ? [body.courseCode]
          : [];
      const codes = rawCodes
        .map((c) => cleanText(String(c), 40))
        .filter(Boolean);
      if (!codes.length) {
        return res.status(400).json({ error: "Select a course to continue enrollment." });
      }
      const valid = codes
        .map((code) => getCourseDetails(code))
        .filter(Boolean);
      if (!valid.length) {
        return res.status(400).json({ error: "That course code was not found in the catalogue." });
      }
      const selectedCodes = valid.map((c) => c.code);
      await addEvent(sql, session.id, "ENROLLMENT_STARTED", { courseCodes: selectedCodes });
      const draft = await getOrCreateDraft(sql, session.id);
      await updateDraft(sql, draft.id, { courseCodes: selectedCodes });

      const labels = valid.map((c) => `${c.code} — ${c.title}`).join("; ");

      if (!session.consent_at) {
        const privacyMsg = await addMessage(
          sql,
          session.id,
          "assistant",
          `You've selected: ${labels}.\n\n${PRIVACY_NOTICE}`,
          {
            type: "privacy",
            selectedCourses: selectedCodes,
            buttons: [{ label: "I Agree & Continue", action: "consent" }],
          }
        );
        return res.status(200).json({
          sessionKey: session.session_key,
          messages: [privacyMsg],
          draftId: draft.id,
          awaitingField: null,
        });
      }

      const refreshed = await getOrCreateDraft(sql, session.id);
      const data = refreshed.data || {};
      const next = nextEnrollmentPrompt(data, selectedCodes);
      const progress = enrollmentProgress(data, selectedCodes);
      const msg = await addMessage(
        sql,
        session.id,
        "assistant",
        next
          ? `Course selected: ${labels}.\n\nI'll now ask for your personal details to complete enrollment — I won't keep suggesting courses.\n\n${next.text}`
          : `Course selected: ${labels}. Your details look complete — please review and submit.`,
        {
          enrollment: { field: next?.field || null, progress },
          buttons: next
            ? [
                { label: "Cancel Application", action: "cancel_draft" },
              ]
            : [
                { label: "Submit Enrollment", action: "confirm_submit" },
                { label: "Edit Details", action: "edit_draft" },
              ],
        }
      );
      return res.status(200).json({
        sessionKey: session.session_key,
        messages: [msg],
        awaitingField: next?.field || null,
        progress,
      });
    }

    if (action === "start_assistant_enroll") {
      await addEvent(sql, session.id, "ENROLLMENT_STARTED", {});
      const draft = await getOrCreateDraft(sql, session.id);
      if (Array.isArray(body.courseCodes) && body.courseCodes.length) {
        await updateDraft(sql, draft.id, {
          courseCodes: body.courseCodes.map((c) => cleanText(String(c), 40)),
        });
      }
      const privacyMsg = await addMessage(sql, session.id, "assistant", PRIVACY_NOTICE, {
        type: "privacy",
        buttons: [{ label: "I Agree & Continue", action: "consent" }],
      });
      return res.status(200).json({
        sessionKey: session.session_key,
        messages: [privacyMsg],
        draftId: draft.id,
      });
    }

    if (action === "set_draft_field") {
      const draft = await getOrCreateDraft(sql, session.id);
      const field = cleanText(body.field, 40);
      let value = body.value;
      const meta = ENROLLMENT_FIELDS.find((f) => f.key === field);
      if (meta?.boolean) value = parseBool(value);
      if (field === "email" && !String(value || "").includes("@")) {
        return res.status(400).json({ error: "Please provide a valid email address." });
      }
      const dataPatch = { [field]: value };
      const updated = await updateDraft(sql, draft.id, {
        data: dataPatch,
        courseCodes: field === "courseCodes" ? (Array.isArray(value) ? value : [value]) : undefined,
      });
      const data = updated.data || {};
      const codes = Array.isArray(updated.course_codes) ? updated.course_codes : [];
      const requiredCount = ENROLLMENT_FIELDS.filter((f) => f.required).length + 1;
      const completed =
        (codes.length ? 1 : 0) +
        ENROLLMENT_FIELDS.filter((f) => f.required && data[f.key] !== undefined && data[f.key] !== null && data[f.key] !== "").length;
      const next = nextEnrollmentPrompt(data, codes);
      if (!next) {
        const summary = {
          type: "enrollment_summary",
          applicant: data.fullName,
          email: data.email,
          phone: data.phone,
          courses: codes,
          education: data.educationLevel,
          preferredSession: data.preferredSession,
          buttons: [
            { label: "Edit Details", action: "edit_draft" },
            { label: "Submit Enrollment", action: "confirm_submit" },
          ],
        };
        const msg = await addMessage(
          sql,
          session.id,
          "assistant",
          "Please review your information. By submitting, you confirm that these details are accurate and authorize the Academy to process this application.",
          summary
        );
        return res.status(200).json({
          sessionKey: session.session_key,
          messages: [msg],
          progress: { completed: requiredCount, total: requiredCount },
        });
      }
      const msg = await addMessage(sql, session.id, "assistant", next.text, {
        enrollment: { field: next.field, progress: { completed, total: requiredCount } },
        buttons: [
          { label: "Review Details", action: "review_draft" },
          { label: "Cancel Application", action: "cancel_draft" },
        ],
      });
      return res.status(200).json({
        sessionKey: session.session_key,
        messages: [msg],
        progress: { completed, total: requiredCount },
        awaitingField: next.field,
      });
    }

    if (action === "confirm_submit") {
      const draft = await getOrCreateDraft(sql, session.id);
      const result = await submitDraftEnrollment(sql, draft);
      if (!result.ok) return res.status(400).json({ error: result.error });

      await addEvent(sql, session.id, "ENROLLMENT_SUBMITTED", {
        reference: result.enrollment.reference_number,
      });
      await sql`
        UPDATE academy_chat_sessions
        SET enrollment_ref = ${result.enrollment.reference_number},
            applicant_email = ${result.enrollment.email}
        WHERE id = ${session.id}
      `;

      const admission = await maybeGenerateAdmission(sql, result.enrollment, settings);
      let adminNotify = "SKIPPED";
      if (!admission.deferred) {
        await addEvent(sql, session.id, "ADMISSION_GENERATED", {
          reference: result.enrollment.reference_number,
        });
        adminNotify = await notifyAdminAdmission(sql, result.enrollment, admission, settings);
        await addEvent(sql, session.id, "ADMISSION_ADMIN_NOTIFIED", {
          reference: result.enrollment.reference_number,
          status: adminNotify,
        });
      }

      const content = [
        "Enrollment Submitted Successfully",
        "",
        `Reference: ${result.enrollment.reference_number}`,
        `Courses: ${(result.enrollment.course_codes || []).join(", ")}`,
        "Status: Application Received",
        "",
        admission.document
          ? "Your admission letter has been generated and is being emailed to you (typically arrives within 10–30 minutes). Admin approval is not required."
          : admission.message ||
            "Your admission letter is being prepared and is usually ready within 10–30 minutes.",
        "",
        "Your admission letter will be emailed to you at the address you provided. Keep your reference number for Admissions follow-up.",
        "",
        "Admissions may still follow up within 24–48 hours about orientation and payment.",
      ]
        .filter(Boolean)
        .join("\n");

      const msg = await addMessage(sql, session.id, "assistant", content, {
        type: "enrollment_success",
        referenceNumber: result.enrollment.reference_number,
        admission,
        buttons: [
          { label: "Contact Admissions", action: "handoff" },
          { label: "Return to Academy", href: "/academy" },
          ...(admission.downloadPath
            ? [{ label: "Download Admission Letter", href: admission.downloadPath }]
            : []),
        ],
      });

      return res.status(200).json({
        sessionKey: session.session_key,
        messages: [msg],
        enrollment: result.enrollment,
        admission,
        adminNotify,
      });
    }

    if (action === "cancel_draft") {
      await sql`
        UPDATE academy_enrollment_drafts SET status = 'cancelled', updated_at = NOW()
        WHERE session_id = ${session.id} AND status = 'draft'
      `;
      const msg = await addMessage(sql, session.id, "assistant", "Application cancelled. I can still help you explore courses anytime.", {
        buttons: [{ label: "Find a Course", action: "quick", value: "Help me find a course" }],
      });
      return res.status(200).json({ sessionKey: session.session_key, messages: [msg] });
    }

    if (action === "handoff") {
      await addEvent(sql, session.id, "HANDOFF_REQUESTED", {});
      const email = settings.human_support_email || "info@softwarevalalib.app";
      const phone = settings.human_support_phone || "";
      const msg = await addMessage(
        sql,
        session.id,
        "assistant",
        `I've flagged this for the Admissions team. You can also reach SVL Training Academy at ${email}${phone ? ` or ${phone}` : ""}.`,
        { type: "handoff", buttons: [{ label: "Contact Admissions", href: "/contact" }] }
      );
      return res.status(200).json({ sessionKey: session.session_key, messages: [msg] });
    }

    // Default chat turn
    const userText = cleanText(body.message || body.value || "", 2000);
    if (!userText) return res.status(400).json({ error: "Message is required." });

    await addMessage(sql, session.id, "user", userText, {});
    await addEvent(sql, session.id, "QUESTION_ASKED", { preview: userText.slice(0, 120) });

    const draft = await getOrCreateDraft(sql, session.id).catch(() => null);
    const draftData = draft?.data || {};
    const draftCodes = Array.isArray(draft?.course_codes) ? draft.course_codes : [];
    const awaiting = body.awaitingField || null;
    const inEnrollment =
      Boolean(awaiting) ||
      Boolean(
        session.consent_at &&
          draft &&
          draft.status === "draft" &&
          draftMissing(draftData, draftCodes).length
      );

    // Active enrollment: answer questions if needed, otherwise collect the next field — never re-suggest courses once selected.
    if (inEnrollment) {
      let field = awaiting;
      if (!field) {
        const next = nextEnrollmentPrompt(draftData, draftCodes);
        field = next?.field;
      }

      // If the learner asks an explanatory question mid-enrollment, answer then re-prompt the same field.
      if (field && field !== "courseCodes" && looksLikeQuestion(userText) && !awaiting) {
        const info = ruleBasedReply(userText, body.context || {});
        const ui = draftCodes.length
          ? { ...(info.ui || {}), courses: undefined, type: info.ui?.type === "course_list" ? undefined : info.ui?.type }
          : info.ui || {};
        const next = nextEnrollmentPrompt(draftData, draftCodes);
        const progress = enrollmentProgress(draftData, draftCodes);
        const msg = await addMessage(
          sql,
          session.id,
          "assistant",
          `${info.content}\n\n—\nBack to your application${draftCodes.length ? ` for ${draftCodes.join(", ")}` : ""}:\n${next?.text || "Please review and submit."}`,
          {
            ...ui,
            enrollment: { field: next?.field || null, progress },
          }
        );
        return res.status(200).json({
          sessionKey: session.session_key,
          messages: [msg],
          awaitingField: next?.field || null,
          progress,
        });
      }

      if (field === "courseCodes") {
        const found = searchAcademyCourses({ query: userText, limit: 3 });
        const codes = found.map((c) => c.code);
        if (!codes.length && /^SVL-/i.test(userText)) {
          codes.push(...userText.split(/[\s,]+/).filter((c) => /^SVL-/i.test(c)));
        }
        if (!codes.length) {
          const msg = await addMessage(
            sql,
            session.id,
            "assistant",
            "I couldn't match that to a catalogue course yet. Try a skill keyword (AI, React, Excel) or a course code like SVL-DEV-201 — or ask me to recommend courses first, then click Select to enroll.",
            { enrollment: { field: "courseCodes" } }
          );
          return res.status(200).json({
            sessionKey: session.session_key,
            messages: [msg],
            awaitingField: "courseCodes",
          });
        }
        const updated = await updateDraft(sql, draft.id, { courseCodes: codes });
        const next = nextEnrollmentPrompt(updated.data || {}, codes);
        const progress = enrollmentProgress(updated.data || {}, codes);
        const msg = await addMessage(
          sql,
          session.id,
          "assistant",
          `Selected: ${codes.join(", ")}.\n\nI'll now collect your personal details only — I won't keep suggesting courses.\n\n${next?.text || "Ready to review."}`,
          {
            enrollment: { field: next?.field, progress },
            buttons: next
              ? [{ label: "Cancel Application", action: "cancel_draft" }]
              : [
                  { label: "Submit Enrollment", action: "confirm_submit" },
                  { label: "Edit Details", action: "edit_draft" },
                ],
          }
        );
        return res.status(200).json({
          sessionKey: session.session_key,
          messages: [msg],
          awaitingField: next?.field || null,
          progress,
        });
      }

      if (field) {
        if (looksLikeQuestion(userText)) {
          const info = ruleBasedReply(userText, body.context || {});
          const ui = draftCodes.length
            ? { ...(info.ui || {}), courses: undefined }
            : info.ui || {};
          const next = nextEnrollmentPrompt(draftData, draftCodes);
          const progress = enrollmentProgress(draftData, draftCodes);
          const msg = await addMessage(
            sql,
            session.id,
            "assistant",
            `${info.content}\n\n—\nWhen you're ready, ${next?.text || "please continue your application."}`,
            { ...ui, enrollment: { field: next?.field || field, progress } }
          );
          return res.status(200).json({
            sessionKey: session.session_key,
            messages: [msg],
            awaitingField: next?.field || field,
            progress,
          });
        }

        {
          let value = userText;
          const meta = ENROLLMENT_FIELDS.find((f) => f.key === field);
          if (meta?.boolean) value = parseBool(userText);
          if (field === "email" && !userText.includes("@")) {
            const msg = await addMessage(
              sql,
              session.id,
              "assistant",
              `Please provide a valid email.\n\n${EMAIL_DISCLOSURE}`,
              { enrollment: { field: "email" } }
            );
            return res.status(200).json({
              sessionKey: session.session_key,
              messages: [msg],
              awaitingField: "email",
            });
          }
          const updated = await updateDraft(sql, draft.id, { data: { [field]: value } });
          const data = updated.data || {};
          const codes = Array.isArray(updated.course_codes) ? updated.course_codes : [];
          const next = nextEnrollmentPrompt(data, codes);
          const progress = enrollmentProgress(data, codes);
          if (!next) {
            const msg = await addMessage(
              sql,
              session.id,
              "assistant",
              "Please review your information. By submitting, you confirm that these details are accurate and authorize the Academy to process this application.",
              {
                type: "enrollment_summary",
                applicant: data.fullName,
                email: data.email,
                phone: data.phone,
                courses: codes,
                education: data.educationLevel,
                preferredSession: data.preferredSession,
                buttons: [
                  { label: "Edit Details", action: "edit_draft" },
                  { label: "Submit Enrollment", action: "confirm_submit" },
                ],
              }
            );
            return res.status(200).json({ sessionKey: session.session_key, messages: [msg] });
          }
          const msg = await addMessage(sql, session.id, "assistant", next.text, {
            enrollment: { field: next.field, progress },
          });
          return res.status(200).json({
            sessionKey: session.session_key,
            messages: [msg],
            awaitingField: next.field,
            progress,
          });
        }
      }
    }

    // Retrieval-grounded reply (LLM optional) — outside active enrollment
    const retrievedCourses = searchAcademyCourses({ query: userText, limit: 5 });
    const faq = getFaqAnswer(userText);
    let reply = ruleBasedReply(userText, body.context || {});

    const openai = await callOpenAI({
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "system",
          content: `Retrieved FAQ: ${faq ? JSON.stringify(faq) : "none"}\nRetrieved courses: ${JSON.stringify(
            retrievedCourses.map((c) => ({
              code: c.code,
              title: c.title,
              level: c.level,
              duration: c.duration,
              tuition: c.tuition,
              category: c.category,
            }))
          )}\nProgrammes: ${JSON.stringify(ACADEMY_KNOWLEDGE.programmes)}\nCohort: ${JSON.stringify(
            ACADEMY_KNOWLEDGE.cohort
          )}\nSessions: ${JSON.stringify(ACADEMY_KNOWLEDGE.sessions)}\nWhen suggesting courses, tell the user to click Select to enroll on a course card.`,
        },
        { role: "user", content: userText },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "searchAcademyCourses",
            description: "Search the live Academy catalogue",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" },
                level: { type: "string" },
                maxTuition: { type: "number" },
              },
            },
          },
        },
      ],
    });

    if (openai?.choices?.[0]?.message?.content) {
      const content = openai.choices[0].message.content;
      const preferExplain =
        looksLikeQuestion(userText) &&
        !/recommend|suggest|find a course|want to learn|enroll me/.test(userText.toLowerCase());
      reply = {
        content,
        ui: preferExplain
          ? reply.ui?.type === "course_list"
            ? { buttons: reply.ui.buttons || [] }
            : reply.ui
          : reply.ui?.courses?.length
            ? reply.ui
            : retrievedCourses.length
              ? {
                  type: "course_list",
                  courses: retrievedCourses.slice(0, 4).map((c) => courseCardPayload(c)),
                  buttons: [
                    { label: "View Full Catalogue", href: "/academy#courses" },
                    { label: "Ask a Question", action: "focus_input" },
                  ],
                }
              : reply.ui,
      };
      if (reply.ui?.courses?.length && !/Select to enroll/i.test(content)) {
        reply.content = `${content}\n\nClick Select to enroll on any course below to continue with your personal details.`;
      }
    }

    if (reply.ui?.courses?.length) {
      await addEvent(sql, session.id, "COURSE_RECOMMENDED", {
        codes: reply.ui.courses.map((c) => c.code),
      });
    }
    if (reply.unanswered) await logUnanswered(sql, userText);

    const msg = await addMessage(sql, session.id, "assistant", reply.content, reply.ui || {});
    return res.status(200).json({ sessionKey: session.session_key, messages: [msg] });
  } catch (error) {
    console.error("assistant error:", error);
    return res.status(500).json({ error: "Unable to process assistant request." });
  }
}

// Export for admission admin regenerate + form enrollments
export { generateAndStoreAdmission, notifyAdminAdmission };
