import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "./academy/_lib.js";
import { notifyInfoInbox } from "./_companyMail.js";
import {
  APPLICATION_CLOSE_AT,
  CLOSED_MESSAGE,
  INTERVIEW,
  ONBOARDING,
  SCREENING,
  STATUSES,
  CV_MAX_BYTES,
  agentId,
  applicationReference,
  digitsOnly,
  inspectCv,
  isEmail,
  limitedList,
  recruitmentWindow,
  sumScore,
} from "./_recruitmentRules.js";

const EXPERIENCE = ["Sales", "Marketing", "Business Development", "Customer Service", "Digital Marketing", "Social Media Marketing", "Client Acquisition", "Promotion", "Consulting", "Entrepreneurship", "Community Engagement", "No Formal Experience Yet", "Other"];
const SECTORS = ["Education", "Healthcare", "NGOs / Nonprofits", "Construction / Engineering", "Retail / E-Commerce", "SMEs", "Financial Services", "Microfinance", "Credit Unions", "Professional Services", "Hospitality", "Churches", "Associations", "Real Estate", "Logistics / Transportation", "Government / Public Institutions", "Other"];
const OUTREACH = ["Physical Business Visits", "Phone Calls", "WhatsApp", "Email", "LinkedIn", "Facebook", "Instagram", "Events", "Professional Referrals", "Community Networks", "Other"];
const HOURS = ["Less than 5", "5-10", "11-20", "21-30", "30+"];
const ROLES = ["Student", "Recent Graduate", "Employed", "Self-Employed", "Freelancer", "Entrepreneur", "Consultant", "Sales Professional", "Marketing Professional", "Other"];
const RECOMMENDATIONS = ["STRONGLY RECOMMEND", "RECOMMEND", "CONSIDER", "DO NOT RECOMMEND"];

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

function text(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function bodyOf(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function hashIp(ip) {
  return createHash("sha256").update(`${process.env.RECRUITMENT_IP_SALT || "svl-ma-app"}|${ip || "unknown"}`).digest("hex");
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS marketing_agent_counters (
      year INTEGER PRIMARY KEY,
      last_app INTEGER NOT NULL DEFAULT 0,
      last_agent INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS marketing_agent_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_reference TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      phone_digits TEXT NOT NULL,
      whatsapp_digits TEXT NOT NULL,
      county TEXT NOT NULL,
      city_area TEXT NOT NULL,
      is_18_or_older BOOLEAN NOT NULL,
      professional_status TEXT NOT NULL,
      occupation TEXT,
      organization TEXT,
      education_level TEXT,
      professional_background TEXT NOT NULL,
      experience_categories TEXT NOT NULL DEFAULT '[]',
      experience_description TEXT,
      network_sectors TEXT NOT NULL DEFAULT '[]',
      preferred_sectors TEXT NOT NULL DEFAULT '[]',
      network_description TEXT,
      outreach_methods TEXT NOT NULL DEFAULT '[]',
      scenario_school_response TEXT NOT NULL,
      scenario_pricing_response TEXT NOT NULL,
      scenario_website_response TEXT NOT NULL,
      weekly_availability TEXT NOT NULL,
      available_for_training BOOLEAN NOT NULL,
      willing_to_report BOOLEAN NOT NULL,
      markets_other_technology_company BOOLEAN NOT NULL,
      conflict_details TEXT,
      conflict_flag BOOLEAN NOT NULL DEFAULT FALSE,
      resume_base64 TEXT,
      resume_file_key TEXT,
      resume_original_filename TEXT,
      resume_mime_type TEXT,
      application_status TEXT NOT NULL DEFAULT 'SUBMITTED',
      screening_score INTEGER,
      screening_parts TEXT,
      interview_score INTEGER,
      interview_parts TEXT,
      interview_date TEXT,
      interview_time TEXT,
      interview_format TEXT,
      interviewer TEXT,
      interview_notes TEXT,
      strengths TEXT,
      concerns TEXT,
      recommendation TEXT,
      screening_notes TEXT,
      internal_notes TEXT,
      onboarding TEXT NOT NULL DEFAULT '{}',
      agent_id TEXT UNIQUE,
      assigned_reviewer TEXT,
      email_notification_status TEXT NOT NULL DEFAULT 'PENDING',
      email_notification_sent_at TIMESTAMPTZ,
      email_ack TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      test_record BOOLEAN NOT NULL DEFAULT FALSE,
      ip_hash TEXT,
      user_agent TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS marketing_agent_audit (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      application_id UUID,
      actor TEXT,
      action TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS marketing_agent_rate (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ip_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE marketing_agent_applications ADD COLUMN IF NOT EXISTS applicant_email_status TEXT`;
}

async function nextNumber(sql, column) {
  const year = 2026;
  const rows = column === "last_agent"
    ? await sql`
        INSERT INTO marketing_agent_counters (year, last_app, last_agent)
        VALUES (${year}, 0, 1)
        ON CONFLICT (year) DO UPDATE SET last_agent = marketing_agent_counters.last_agent + 1
        RETURNING last_agent
      `
    : await sql`
        INSERT INTO marketing_agent_counters (year, last_app, last_agent)
        VALUES (${year}, 1, 0)
        ON CONFLICT (year) DO UPDATE SET last_app = marketing_agent_counters.last_app + 1
        RETURNING last_app
      `;
  const n = column === "last_agent" ? rows[0].last_agent : rows[0].last_app;
  return column === "last_agent" ? agentId(n) : applicationReference(n);
}

async function audit(sql, applicationId, actor, action, metadata) {
  await sql`
    INSERT INTO marketing_agent_audit (application_id, actor, action, metadata)
    VALUES (${applicationId || null}, ${actor || "system"}, ${action}, ${metadata ? JSON.stringify(metadata) : null})
  `;
}

async function confirmApplicant({ email, firstName, reference }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RECRUITMENT_FROM_EMAIL;
  if (!key || !from) return "SKIPPED";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `SVL Marketing Agent Application Received — ${reference}`,
        text: `Dear ${firstName},\n\nThank you for applying to the Software Vala Liberia Freelance Business Development & Marketing Agent Program.\n\nYour application has been successfully received.\n\nApplication Reference:\n${reference}\n\nApplication Deadline:\n17 October 2026 at 11:59 PM GMT\n\nSubmitting an application does not automatically mean selection.\n\nShortlisted applicants will be contacted through SVL's official communication channels.\n\nPlease do not pay anyone an application, recruitment, onboarding or training fee in connection with this opportunity.\n\nRegards,\n\nSoftware Vala Liberia\nThe Name of Trust`,
      }),
    });
    return response.ok ? "SENT" : "FAILED";
  } catch (error) {
    console.error("applicant confirmation error:", error);
    return "FAILED";
  }
}

async function assertHuman(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return null;
  if (!token) return "Complete the human check.";
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await response.json().catch(() => ({}));
  if (!data.success) return "The human check failed. Please try again.";
  return null;
}

async function notify(application) {
  await notifyInfoInbox({
    subject: `NEW SVL MARKETING AGENT APPLICATION — ${application.application_reference} — ${application.full_name}`,
    fields: {
      form_type: "Freelance Marketing Agent Application",
      application_reference: application.application_reference,
      submitted: application.submitted_at,
      full_name: application.full_name,
      phone: application.phone,
      whatsapp: application.whatsapp,
      email: application.email,
      county: application.county,
      city_area: application.city_area,
      professional_status: application.professional_status,
      occupation: application.occupation || "Not provided",
      organization: application.organization || "Not provided",
      education: application.education_level || "Not provided",
      professional_background: application.professional_background,
      experience_categories: application.experience_categories,
      experience_description: application.experience_description || "Not provided",
      network_sectors: application.network_sectors,
      preferred_sectors: application.preferred_sectors,
      network_description: application.network_description || "Not provided",
      outreach_methods: application.outreach_methods,
      school_scenario: application.scenario_school_response,
      pricing_scenario: application.scenario_pricing_response,
      website_scenario: application.scenario_website_response,
      weekly_availability: application.weekly_availability,
      available_for_training: application.available_for_training ? "Yes" : "No",
      willing_to_report: application.willing_to_report ? "Yes" : "No",
      markets_other_technology_company: application.markets_other_technology_company ? "Yes" : "No",
      conflict_details: application.conflict_details || "None",
      cv: application.resume_file_key ? `Uploaded: ${application.resume_file_key}` : "Not uploaded",
      admin_review: `https://application.softwarevalalib.app/admin?id=${application.id}`,
      test_record: application.test_record ? "YES — exclude from recruitment counts" : "No",
    },
  });
}

export async function handleRecruitment(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
  const sql = sqlClient();
  await ensureSchema(sql);
  const url = new URL(req.url || "", "http://localhost");
  const action = text(url.searchParams.get("action") || "", 40);
  const body = bodyOf(req);

  if (req.method === "GET" && action === "window") {
    return res.status(200).json({
      state: recruitmentWindow(),
      openAt: "2026-10-03T00:00:00Z",
      closeAt: APPLICATION_CLOSE_AT,
    });
  }

  if (req.method === "GET" && (action === "list" || action === "one" || action === "cv" || action === "export" || action === "audit")) {
    const admin = await requireAdmin(req, sql).catch(() => null);
    if (!admin) return res.status(401).json({ error: "Admin login required." });
    if (action === "list") {
      const rows = await sql`
        SELECT id, application_reference, full_name, phone, email, county, professional_status,
               preferred_sectors, submitted_at, application_status, screening_score, assigned_reviewer,
               test_record, email_notification_status, agent_id, conflict_flag
        FROM marketing_agent_applications
        ORDER BY submitted_at DESC
        LIMIT 500
      `;
      const counts = await sql`
        SELECT application_status, COUNT(*)::int AS total
        FROM marketing_agent_applications
        WHERE test_record = FALSE
        GROUP BY application_status
      `;
      const today = await sql`
        SELECT COUNT(*)::int AS total
        FROM marketing_agent_applications
        WHERE test_record = FALSE AND submitted_at >= CURRENT_DATE
      `;
      const byCounty = await sql`
        SELECT county, COUNT(*)::int AS total
        FROM marketing_agent_applications
        WHERE test_record = FALSE
        GROUP BY county
        ORDER BY total DESC
      `;
      const byStatus = await sql`
        SELECT professional_status, COUNT(*)::int AS total
        FROM marketing_agent_applications
        WHERE test_record = FALSE
        GROUP BY professional_status
        ORDER BY total DESC
      `;
      const bySource = await sql`
        SELECT COALESCE(NULLIF(utm_source, ''), 'Direct') AS source, COUNT(*)::int AS total
        FROM marketing_agent_applications
        WHERE test_record = FALSE
        GROUP BY 1
        ORDER BY total DESC
      `;
      return res.status(200).json({
        applications: rows,
        counts,
        today: today[0]?.total || 0,
        byCounty,
        byProfessionalStatus: byStatus,
        bySource,
      });
    }
    if (action === "export") {
      const rows = await sql`
        SELECT application_reference, full_name, phone, whatsapp, email, county, city_area,
               professional_status, preferred_sectors, application_status, screening_score,
               interview_score, agent_id, submitted_at, test_record
        FROM marketing_agent_applications
        ORDER BY submitted_at DESC
      `;
      const header = Object.keys(rows[0] || { application_reference: "" });
      const csv = [header.join(","), ...rows.map((row) => header.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=svl-marketing-agent-applications.csv");
      return res.status(200).send(csv);
    }
    const id = text(url.searchParams.get("id") || "", 80);
    if (action === "cv") {
      const rows = await sql`SELECT resume_base64, resume_mime_type, resume_file_key FROM marketing_agent_applications WHERE id = ${id}::uuid LIMIT 1`;
      const file = rows[0];
      if (!file?.resume_base64) return res.status(404).json({ error: "No resume on file." });
      await audit(sql, id, admin.email, "cv_downloaded", null);
      const bytes = Buffer.from(file.resume_base64, "base64");
      res.setHeader("Content-Type", file.resume_mime_type || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${file.resume_file_key || "resume"}"`);
      res.setHeader("Cache-Control", "private, no-store");
      return res.status(200).send(bytes);
    }
    if (action === "audit") {
      const rows = await sql`SELECT actor, action, metadata, created_at FROM marketing_agent_audit WHERE application_id = ${id}::uuid ORDER BY created_at DESC LIMIT 100`;
      return res.status(200).json({ audit: rows });
    }
    const rows = await sql`
      SELECT id, application_reference, full_name, phone, whatsapp, email, county, city_area,
             professional_status, occupation, organization, education_level, professional_background,
             experience_categories, experience_description, network_sectors, preferred_sectors, network_description,
             outreach_methods, scenario_school_response, scenario_pricing_response, scenario_website_response,
             weekly_availability, available_for_training, willing_to_report, markets_other_technology_company,
             conflict_details, conflict_flag, resume_file_key, resume_original_filename, application_status,
             screening_score, screening_parts, interview_score, interview_parts, interview_date, interview_time,
             interview_format, interviewer, interview_notes, strengths, concerns, recommendation, screening_notes,
             internal_notes, onboarding, agent_id, assigned_reviewer, email_notification_status,
             email_notification_sent_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
             test_record, submitted_at, updated_at
      FROM marketing_agent_applications WHERE id = ${id}::uuid LIMIT 1
    `;
    if (!rows[0]) return res.status(404).json({ error: "Application not found." });
    await audit(sql, id, admin.email, "application_viewed", null);
    return res.status(200).json({ application: rows[0] });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (body.website) return res.status(200).json({ ok: true });

  if (action === "ack-email") {
    const reference = text(body.applicationReference, 40);
    const token = text(body.emailAck, 80);
    const rows = await sql`
      UPDATE marketing_agent_applications
      SET email_notification_status = 'SENT', email_notification_sent_at = NOW(), updated_at = NOW()
      WHERE application_reference = ${reference} AND email_ack = ${token}
      RETURNING id
    `;
    if (!rows[0]) return res.status(400).json({ error: "Unable to confirm the notification." });
    return res.status(200).json({ ok: true });
  }

  if (action === "retry-email" || action === "review") {
    const admin = await requireAdmin(req, sql).catch(() => null);
    if (!admin) return res.status(401).json({ error: "Admin login required." });
    const id = text(body.id, 80);
    const current = await sql`SELECT * FROM marketing_agent_applications WHERE id = ${id}::uuid LIMIT 1`;
    const application = current[0];
    if (!application) return res.status(404).json({ error: "Application not found." });

    if (action === "retry-email") {
      try {
        await notify(application);
        await sql`
          UPDATE marketing_agent_applications
          SET email_notification_status = 'SENT', email_notification_sent_at = NOW(), updated_at = NOW()
          WHERE id = ${application.id}
        `;
        await audit(sql, application.id, admin.email, "email_retried", { status: "SENT" });
        return res.status(200).json({ emailNotificationStatus: "SENT" });
      } catch {
        await sql`UPDATE marketing_agent_applications SET email_notification_status = 'FAILED', updated_at = NOW() WHERE id = ${application.id}`;
        await audit(sql, application.id, admin.email, "email_retried", { status: "FAILED" });
        return res.status(200).json({ emailNotificationStatus: "FAILED", error: "Notification could not be sent. The application was kept." });
      }
    }

    const status = STATUSES.includes(body.applicationStatus) ? body.applicationStatus : null;
    let screeningScore = application.screening_score;
    let screeningParts = application.screening_parts;
    if (body.screeningParts) {
      const scored = sumScore(body.screeningParts, SCREENING);
      if (scored.error) return res.status(400).json({ error: scored.error });
      if (text(body.screeningNotes, 4000).length < 10) {
        return res.status(400).json({ error: "Add screening notes before saving the score." });
      }
      screeningScore = scored.total;
      screeningParts = JSON.stringify(body.screeningParts);
    }
    let interviewScore = application.interview_score;
    let interviewParts = application.interview_parts;
    if (body.interviewParts) {
      const scored = sumScore(body.interviewParts, INTERVIEW);
      if (scored.error) return res.status(400).json({ error: scored.error });
      if (text(body.interviewNotes, 4000).length < 10) {
        return res.status(400).json({ error: "Add interview notes before saving the score." });
      }
      interviewScore = scored.total;
      interviewParts = JSON.stringify(body.interviewParts);
    }
    const recommendation = RECOMMENDATIONS.includes(body.recommendation) ? body.recommendation : application.recommendation;
    let onboarding = typeof application.onboarding === "string" ? application.onboarding : JSON.stringify(application.onboarding || {});
    if (body.onboarding && typeof body.onboarding === "object") {
      const next = {};
      for (const key of ONBOARDING) next[key] = Boolean(body.onboarding[key]);
      onboarding = JSON.stringify(next);
    }
    let agentId = application.agent_id;
    let nextStatus = status || application.application_status;
    if (body.activateAgent) {
      const checks = JSON.parse(onboarding);
      if (!ONBOARDING.every((key) => checks[key])) {
        return res.status(400).json({ error: "Complete every onboarding item before activating an agent." });
      }
      if (!["SELECTED", "ONBOARDING", "ACTIVE_AGENT"].includes(application.application_status)) {
        return res.status(400).json({ error: "Move the applicant to Selected or Onboarding before activation." });
      }
      if (!agentId) agentId = await nextNumber(sql, "last_agent");
      nextStatus = "ACTIVE_AGENT";
    }
    await sql`
      UPDATE marketing_agent_applications SET
        application_status = ${nextStatus},
        screening_score = ${screeningScore},
        screening_parts = ${screeningParts},
        screening_notes = ${text(body.screeningNotes, 4000) || application.screening_notes},
        interview_score = ${interviewScore},
        interview_parts = ${interviewParts},
        interview_date = ${text(body.interviewDate, 20) || application.interview_date},
        interview_time = ${text(body.interviewTime, 20) || application.interview_time},
        interview_format = ${text(body.interviewFormat, 40) || application.interview_format},
        interviewer = ${text(body.interviewer, 120) || application.interviewer},
        interview_notes = ${text(body.interviewNotes, 4000) || application.interview_notes},
        strengths = ${text(body.strengths, 2000) || application.strengths},
        concerns = ${text(body.concerns, 2000) || application.concerns},
        recommendation = ${recommendation},
        internal_notes = ${text(body.internalNotes, 4000) || application.internal_notes},
        assigned_reviewer = ${text(body.assignedReviewer, 120) || application.assigned_reviewer},
        onboarding = ${onboarding},
        agent_id = ${agentId},
        updated_at = NOW()
      WHERE id = ${application.id}
    `;
    await audit(sql, application.id, admin.email, body.activateAgent ? "agent_activated" : "application_updated", {
      status: nextStatus,
      agentId,
    });
    return res.status(200).json({ ok: true, applicationStatus: nextStatus, agentId, screeningScore, interviewScore });
  }

  if (recruitmentWindow() !== "open") {
    return res.status(403).json({ error: CLOSED_MESSAGE });
  }

  const ip = hashIp(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "");
  const recent = await sql`
    SELECT COUNT(*)::int AS total FROM marketing_agent_rate
    WHERE ip_hash = ${ip} AND created_at > NOW() - INTERVAL '1 hour'
  `;
  if ((recent[0]?.total || 0) >= 8) return res.status(429).json({ error: "Too many attempts. Please wait and try again." });
  await sql`INSERT INTO marketing_agent_rate (ip_hash) VALUES (${ip})`;

  const fullName = text(body.fullName, 160);
  const phone = text(body.phone, 40);
  const whatsapp = text(body.whatsapp, 40);
  const email = text(body.email, 160).toLowerCase();
  const county = text(body.county, 80);
  const city = text(body.cityArea, 120);
  if (body.is18OrOlder !== true) return res.status(400).json({ error: "Applicants must be at least 18 years old." });
  if (fullName.length < 3) return res.status(400).json({ error: "Enter your full name." });
  if (digitsOnly(phone).length < 7 || digitsOnly(whatsapp).length < 7) return res.status(400).json({ error: "Enter a valid phone and WhatsApp number." });
  if (!isEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (!county || !city) return res.status(400).json({ error: "Enter your county and city or area." });
  if (!ROLES.includes(body.professionalStatus)) return res.status(400).json({ error: "Choose your professional status." });
  const background = text(body.professionalBackground, 4000);
  if (background.length < 20) return res.status(400).json({ error: "Describe your professional background." });
  const experience = limitedList(body.experienceCategories, EXPERIENCE);
  if (experience.error || !experience.values.length) return res.status(400).json({ error: experience.error || "Select your experience." });
  const sectors = limitedList(body.networkSectors, SECTORS);
  if (sectors.error) return res.status(400).json({ error: sectors.error });
  const preferred = limitedList(body.preferredSectors, SECTORS, 3);
  if (preferred.error || preferred.values.length < 1) return res.status(400).json({ error: preferred.error || "Choose one to three preferred sectors." });
  const outreach = limitedList(body.outreachMethods, OUTREACH);
  if (outreach.error || !outreach.values.length) return res.status(400).json({ error: outreach.error || "Select at least one outreach method." });
  const school = text(body.scenarioSchool, 4000);
  const pricing = text(body.scenarioPricing, 4000);
  const website = text(body.scenarioWebsite, 4000);
  if (school.length < 20 || pricing.length < 20 || website.length < 20) {
    return res.status(400).json({ error: "Answer each scenario in a few sentences." });
  }
  if (!HOURS.includes(body.weeklyAvailability)) return res.status(400).json({ error: "Choose your weekly availability." });
  if (body.availableForTraining !== true || body.willingToReport !== true) {
    return res.status(400).json({ error: "Training and activity reporting are required for this opportunity." });
  }
  const marketsOther = body.marketsOtherTechnologyCompany === true;
  const conflict = text(body.conflictDetails, 2000);
  if (marketsOther && conflict.length < 10) return res.status(400).json({ error: "Briefly explain the other technology services you market." });
  if (!body.declareAccurate || !body.declareIndependent || !body.declareNotGuaranteed || !body.declareConsent || !body.declareNoFee) {
    return res.status(400).json({ error: "Confirm every declaration before submitting." });
  }
  const cv = inspectCv(body.resume);
  if (cv.error) return res.status(400).json({ error: cv.error });
  const humanError = await assertHuman(text(body.turnstileToken, 2048));
  if (humanError) return res.status(400).json({ error: humanError });

  const phoneDigits = digitsOnly(phone);
  const whatsappDigits = digitsOnly(whatsapp);
  const duplicates = await sql`
    SELECT application_reference FROM marketing_agent_applications
    WHERE test_record = FALSE AND (lower(email) = ${email} OR phone_digits = ${phoneDigits} OR whatsapp_digits = ${whatsappDigits})
    LIMIT 1
  `;
  if (duplicates[0]) {
    return res.status(409).json({ error: "It appears an application using these contact details has already been submitted." });
  }

  const testRecord = /svl application system test/i.test(fullName);
  const reference = await nextNumber(sql, "last_app");
  const fileKey = cv.bytes ? `${reference}-resume.${cv.ext}` : null;
  const ack = randomBytes(16).toString("hex");
  const rows = await sql`
    INSERT INTO marketing_agent_applications (
      application_reference, full_name, phone, whatsapp, email, phone_digits, whatsapp_digits,
      county, city_area, is_18_or_older, professional_status, occupation, organization, education_level,
      professional_background, experience_categories, experience_description, network_sectors, preferred_sectors,
      network_description, outreach_methods, scenario_school_response, scenario_pricing_response, scenario_website_response,
      weekly_availability, available_for_training, willing_to_report, markets_other_technology_company, conflict_details,
      conflict_flag, resume_base64, resume_file_key, resume_original_filename, resume_mime_type, application_status,
      email_notification_status, email_ack, utm_source, utm_medium, utm_campaign, utm_content, utm_term, test_record, ip_hash, user_agent
    ) VALUES (
      ${reference}, ${fullName}, ${phone}, ${whatsapp}, ${email}, ${phoneDigits}, ${whatsappDigits},
      ${county}, ${city}, TRUE, ${body.professionalStatus}, ${text(body.occupation, 160) || null}, ${text(body.organization, 160) || null},
      ${text(body.educationLevel, 160) || null}, ${background}, ${JSON.stringify(experience.values)}, ${text(body.experienceDescription, 4000) || null},
      ${JSON.stringify(sectors.values)}, ${JSON.stringify(preferred.values)}, ${text(body.networkDescription, 4000) || null},
      ${JSON.stringify(outreach.values)}, ${school}, ${pricing}, ${website}, ${body.weeklyAvailability}, TRUE, TRUE,
      ${marketsOther}, ${conflict || null}, ${marketsOther}, ${cv.bytes ? cv.bytes.toString("base64") : null}, ${fileKey},
      ${cv.bytes ? text(body.resume.name, 180) : null}, ${cv.mime || null}, 'SUBMITTED', 'PENDING', ${ack},
      ${text(body.utmSource, 80) || null}, ${text(body.utmMedium, 80) || null}, ${text(body.utmCampaign, 120) || null},
      ${text(body.utmContent, 120) || null}, ${text(body.utmTerm, 120) || null}, ${testRecord}, ${ip}, ${text(req.headers["user-agent"] || "", 300) || null}
    )
    RETURNING id, application_reference, full_name, email, submitted_at
  `;
  const saved = rows[0];
  let emailStatus;
  try {
    await notify({
      id: saved.id,
      application_reference: reference,
      submitted_at: saved.submitted_at,
      full_name: fullName,
      phone,
      whatsapp,
      email,
      county,
      city_area: city,
      professional_status: body.professionalStatus,
      occupation: body.occupation,
      organization: body.organization,
      education_level: body.educationLevel,
      professional_background: background,
      experience_categories: experience.values.join(", "),
      experience_description: body.experienceDescription,
      network_sectors: sectors.values.join(", "),
      preferred_sectors: preferred.values.join(", "),
      network_description: body.networkDescription,
      outreach_methods: outreach.values.join(", "),
      scenario_school_response: school,
      scenario_pricing_response: pricing,
      scenario_website_response: website,
      weekly_availability: body.weeklyAvailability,
      available_for_training: true,
      willing_to_report: true,
      markets_other_technology_company: marketsOther,
      conflict_details: conflict,
      resume_file_key: fileKey,
      test_record: testRecord,
    });
    emailStatus = "SENT";
    await sql`UPDATE marketing_agent_applications SET email_notification_status = 'SENT', email_notification_sent_at = NOW() WHERE id = ${saved.id}`;
  } catch (error) {
    emailStatus = "FAILED";
    await sql`UPDATE marketing_agent_applications SET email_notification_status = 'FAILED' WHERE id = ${saved.id}`;
    console.error("recruitment email error:", error);
  }
  const applicantEmailStatus = await confirmApplicant({
    email,
    firstName: fullName.split(" ")[0],
    reference,
  });
  await sql`UPDATE marketing_agent_applications SET applicant_email_status = ${applicantEmailStatus} WHERE id = ${saved.id}`;
  await audit(sql, saved.id, "applicant", "application_submitted", { reference, emailStatus, applicantEmailStatus });
  return res.status(201).json({
    applicationReference: reference,
    firstName: fullName.split(" ")[0],
    emailNotificationStatus: emailStatus,
    emailAck: ack,
    id: saved.id,
    testRecord,
    applicantEmailStatus,
    cvMaxBytes: CV_MAX_BYTES,
  });
}
