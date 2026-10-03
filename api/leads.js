import { neon } from "@neondatabase/serverless";
import { requireAdmin } from "./academy/_lib.js";
import { notifyInfoInbox } from "./_companyMail.js";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function cleanText(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function parseBody(req) {
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

const SERVICES = new Set([
  "Website",
  "Custom Software",
  "Management System",
  "Mobile App",
  "E-Commerce",
  "Digital Marketing",
  "Hosting",
  "Cloud",
  "Cybersecurity",
  "Networking",
  "CCTV",
  "Business Email",
  "Not Sure",
]);

const BUDGETS = new Set([
  "Under $500",
  "$500-$1,000",
  "$1,001-$3,000",
  "$3,001-$5,000",
  "$5,000+",
  "Need Consultation",
]);

const CONTACTS = new Set(["Phone", "WhatsApp", "Email", "Meeting"]);

const AGENT_RE = /^SVL-MA-\d{4}$/;

async function ensureLeads(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS website_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_number TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      industry TEXT,
      location TEXT,
      services TEXT NOT NULL DEFAULT '[]',
      business_challenge TEXT,
      budget_range TEXT,
      preferred_contact TEXT,
      source TEXT,
      campaign TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      referral_agent_id TEXT,
      landing_path TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function nextLeadNumber(sql) {
  const year = new Date().getUTCFullYear();
  const prefix = `SVL-LD-${year}-`;
  const rows = await sql`
    SELECT lead_number FROM website_leads
    WHERE lead_number LIKE ${prefix + "%"}
    ORDER BY lead_number DESC
    LIMIT 1
  `;
  const last = rows[0]?.lead_number || "";
  const n = Number(String(last).slice(prefix.length)) || 0;
  return `${prefix}${String(n + 1).padStart(6, "0")}`;
}

async function notifyStaff(lead) {
  await notifyInfoInbox({
    subject: `New consultation ${lead.leadNumber} — ${lead.companyName}`,
    fields: {
      form_type: "Consultation",
      lead_number: lead.leadNumber,
      organization: lead.companyName,
      contact_person: lead.contactName,
      email: lead.email,
      phone: lead.phone || "Not provided",
      whatsapp: lead.whatsapp || "Not provided",
      industry: lead.industry || "Not provided",
      location: lead.location || "Not provided",
      services: (lead.services || []).join(", ") || "Not provided",
      challenge: lead.challenge,
      budget: lead.budget || "Not specified",
      preferred_contact: lead.preferred,
      source: lead.source || "Website",
      campaign: lead.utmCampaign || "Not provided",
      utm_source: lead.utmSource || "Not provided",
      utm_medium: lead.utmMedium || "Not provided",
      utm_content: lead.utmContent || "Not provided",
      referral_agent: lead.referralAgentId || "None",
      landing_page: lead.landingPath || "Not provided",
    },
  });
  return { emailed: true };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();
    await ensureLeads(sql);

    if (req.method === "GET") {
      const admin = await requireAdmin(req, sql).catch(() => null);
      if (!admin) return res.status(401).json({ error: "Admin login required." });
      const rows = await sql`
        SELECT * FROM website_leads ORDER BY created_at DESC LIMIT 200
      `;
      return res.status(200).json({ leads: rows });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST, OPTIONS");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = parseBody(req);
    if (body.website) return res.status(200).json({ ok: true });

    const companyName = cleanText(body.companyName, 160);
    const contactName = cleanText(body.contactName, 120);
    const email = cleanText(body.email, 160).toLowerCase();
    const phone = cleanText(body.phone, 40);
    const whatsapp = cleanText(body.whatsapp, 40);
    const industry = cleanText(body.industry, 80);
    const location = cleanText(body.location, 120);
    const challenge = cleanText(body.businessChallenge, 2000);
    const budget = BUDGETS.has(body.budgetRange) ? body.budgetRange : "";
    const preferred = CONTACTS.has(body.preferredContactMethod) ? body.preferredContactMethod : "";
    const services = Array.isArray(body.servicesInterested)
      ? [...new Set(body.servicesInterested.map((s) => cleanText(String(s), 40)).filter((s) => SERVICES.has(s)))]
      : [];
    const ref = cleanText(body.referralAgentId, 20);
    const referralAgentId = AGENT_RE.test(ref) ? ref : "";

    if (companyName.length < 2) return res.status(400).json({ error: "Enter the organization name." });
    if (contactName.length < 2) return res.status(400).json({ error: "Enter the contact person." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email." });
    if (!phone && !whatsapp) return res.status(400).json({ error: "Enter a phone or WhatsApp number." });
    if (!services.length) return res.status(400).json({ error: "Select at least one need." });
    if (challenge.length < 10) return res.status(400).json({ error: "Describe the challenge in a few sentences." });
    if (!preferred) return res.status(400).json({ error: "Choose a preferred contact method." });

    const leadNumber = await nextLeadNumber(sql);
    const source = cleanText(body.source, 40) || "Website";
    const rows = await sql`
      INSERT INTO website_leads (
        lead_number, company_name, contact_name, email, phone, whatsapp,
        industry, location, services, business_challenge, budget_range,
        preferred_contact, source, campaign, utm_source, utm_medium,
        utm_campaign, utm_content, referral_agent_id, landing_path, status
      ) VALUES (
        ${leadNumber}, ${companyName}, ${contactName}, ${email}, ${phone || null}, ${whatsapp || null},
        ${industry || null}, ${location || null}, ${JSON.stringify(services)}, ${challenge},
        ${budget || null}, ${preferred}, ${source}, ${cleanText(body.utmCampaign, 120) || null},
        ${cleanText(body.utmSource, 80) || null}, ${cleanText(body.utmMedium, 80) || null},
        ${cleanText(body.utmCampaign, 120) || null}, ${cleanText(body.utmContent, 120) || null},
        ${referralAgentId || null}, ${cleanText(body.landingPath, 200) || null}, 'NEW'
      )
      RETURNING id, lead_number
    `;

    const notice = await notifyStaff({
      leadNumber,
      companyName,
      contactName,
      email,
      phone,
      whatsapp,
      industry,
      location,
      services,
      challenge,
      budget,
      preferred,
      source,
      utmSource: cleanText(body.utmSource, 80),
      utmMedium: cleanText(body.utmMedium, 80),
      utmCampaign: cleanText(body.utmCampaign, 120),
      utmContent: cleanText(body.utmContent, 120),
      referralAgentId,
      landingPath: cleanText(body.landingPath, 200),
    }).catch((error) => {
      console.error("consultation email error:", error);
      return { emailed: false };
    });

    return res.status(201).json({
      id: rows[0].id,
      leadNumber: rows[0].lead_number,
      status: "NEW",
      emailed: Boolean(notice.emailed),
      message: "Thank you for contacting Software Vala Liberia. Your request has been received and our team will review it.",
    });
  } catch (error) {
    console.error("leads error:", error);
    return res.status(500).json({ error: "Unable to save your request. Please try again or WhatsApp us." });
  }
}
