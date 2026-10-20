import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { leadPayload, retryDueLeads, syncWebsiteLead } from "../api/_leadSync.js";
import {
  applicationPayload,
  retryDelayMs,
  retryDueApplications,
  syncMarketingApplication,
} from "../api/_marketingSync.js";

const ORIGINAL_ENV = {
  SVL_MANAGEMENT_API_URL: process.env.SVL_MANAGEMENT_API_URL,
  MARKETING_SYNC_SECRET: process.env.MARKETING_SYNC_SECRET,
};
const originalInfo = console.info;

function fakeSql(rows = {}) {
  const updates = [];
  const statements = [];
  const sql = async (strings, ...values) => {
    const query = strings.join("?");
    statements.push({ query, values });
    if (query.includes("UPDATE website_leads")) {
      updates.push({ table: "website_leads", values });
      return [];
    }
    if (query.includes("UPDATE marketing_agent_applications")) {
      updates.push({ table: "marketing_agent_applications", values });
      return [];
    }
    if (query.includes("FROM website_leads")) return rows.leads || [];
    if (query.includes("FROM marketing_agent_applications")) return rows.applications || [];
    return [];
  };
  return { sql, updates, statements };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const lead = {
  id: "11111111-1111-1111-1111-111111111111",
  lead_number: "SVL-LD-2026-000123",
  contact_name: "Aminata Johnson",
  company_name: "Example Academy",
  email: "aminata@example.com",
  phone: "+231 777 000 111",
  whatsapp: null,
  industry: "Education",
  location: "Monrovia",
  services: '["Website","Hosting"]',
  business_challenge: "The school needs online enrollment.",
  budget_range: "$500-$1,000",
  preferred_contact: "Email",
  timeline: "This month",
  source: "Website",
  campaign: "launch",
  record_type: "consultation",
  utm_source: "facebook",
  utm_medium: "social",
  utm_campaign: "launch",
  utm_content: "ad-one",
  utm_term: "school website",
  landing_path: "/consultation",
  referral_agent_id: "SVL-MA-0001",
  created_at: "2026-10-20T10:00:00.000Z",
  sync_attempts: 0,
  last_sync_attempt: null,
};

const application = {
  id: "22222222-2222-2222-2222-222222222222",
  application_reference: "SVL-MA-APP-2026-000009",
  full_name: "Joseph Kollie",
  phone: "+231 777 000 222",
  whatsapp: "+231 777 000 222",
  email: "joseph@example.com",
  county: "Montserrado",
  city_area: "Paynesville",
  professional_status: "Employed",
  occupation: "Sales officer",
  organization: "Example Ltd",
  education_level: "Bachelor's Degree",
  professional_background: "Five years in business development.",
  experience_categories: '["Sales","Marketing"]',
  experience_description: "Field sales and client onboarding.",
  network_sectors: '["Education","SMEs"]',
  preferred_sectors: '["Education","SMEs"]',
  network_description: "School and SME contacts across Monrovia.",
  outreach_methods: '["Phone Calls","WhatsApp"]',
  scenario_school_response: "I would ask about their enrollment process first.",
  scenario_pricing_response: "I would explain that SVL prepares a scoped quotation.",
  scenario_website_response: "I would review the current site and referral flow.",
  weekly_availability: "11-20",
  available_for_training: true,
  willing_to_report: true,
  markets_other_technology_company: false,
  conflict_details: null,
  resume_file_key: "SVL-MA-APP-2026-000009-resume.pdf",
  resume_original_filename: "joseph-cv.pdf",
  utm_source: "linkedin",
  utm_medium: "social",
  utm_campaign: "agents",
  utm_content: "post-one",
  utm_term: "sales agent",
  submitted_at: "2026-10-20T10:05:00.000Z",
  sync_attempts: 0,
  last_sync_attempt: null,
};

beforeEach(() => {
  process.env.SVL_MANAGEMENT_API_URL = "https://management.example/";
  process.env.MARKETING_SYNC_SECRET = "sync-secret-value";
  console.info = () => {};
});

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  console.info = originalInfo;
});

test("lead payload maps referral code, attribution, services and CRM fields", () => {
  const payload = leadPayload(lead);
  assert.equal(payload.lead_number, "SVL-LD-2026-000123");
  assert.equal(payload.external_id, "SVL-LD-2026-000123");
  assert.equal(payload.contact_name, "Aminata Johnson");
  assert.equal(payload.company_name, "Example Academy");
  assert.equal(payload.referral_agent_code, "SVL-MA-0001");
  assert.equal(payload.referral_agent_id, "SVL-MA-0001");
  assert.equal(payload.service, "Website, Hosting");
  assert.equal(payload.services_interested, "Website, Hosting");
  assert.equal(payload.industry, "Education");
  assert.equal(payload.budget_range, "$500-$1,000");
  assert.equal(payload.utm_term, "school website");
  assert.equal(payload.submitted_at, "2026-10-20T10:00:00.000Z");
});

test("normal consultation and quote payloads work without a referral", () => {
  const plain = leadPayload({ ...lead, referral_agent_id: null, record_type: "consultation" });
  assert.equal(plain.referral_agent_code, null);
  assert.equal(plain.record_type, "consultation");
  const quote = leadPayload({ ...lead, record_type: "quote", utm_source: null });
  assert.equal(quote.record_type, "quote");
  assert.equal(quote.utm_source, null);
});

test("lead sync sends the server-only key and marks SYNCED", async () => {
  const { sql, updates } = fakeSql();
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return jsonResponse(201, { syncStatus: "SYNCED", attributionStatus: "ATTRIBUTED", attributionNote: "Credited to SVL-MA-0001" });
  };
  const result = await syncWebsiteLead(sql, lead, fetchImpl);
  assert.equal(request.url, "https://management.example/api/marketing-agents/sync/leads");
  assert.equal(request.options.headers["x-marketing-sync-key"], "sync-secret-value");
  assert.equal(JSON.parse(request.options.body).referral_agent_code, "SVL-MA-0001");
  assert.equal(result.syncStatus, "SYNCED");
  assert.equal(result.attributionStatus, "ATTRIBUTED");
  assert.equal(result.attributionNote, "Credited to SVL-MA-0001");
  assert.equal(updates.length, 1);
  assert.equal(updates[0].values[0], "SYNCED");
  assert.equal(updates[0].values[1], 1);
  assert.equal(updates[0].values[5], lead.id);
});

test("ALREADY_SYNCED is treated as synchronized without creating duplicates", async () => {
  const { sql, updates } = fakeSql();
  const fetchImpl = async () => jsonResponse(200, { syncStatus: "ALREADY_SYNCED" });
  const result = await syncWebsiteLead(sql, { ...lead, sync_attempts: 2 }, fetchImpl);
  assert.equal(result.syncStatus, "SYNCED");
  assert.equal(result.managementStatus, "ALREADY_SYNCED");
  assert.equal(updates[0].values[0], "SYNCED");
  assert.equal(updates[0].values[1], 3);
});

test("invalid or inactive referral still keeps the lead as a review record", async () => {
  const { sql } = fakeSql();
  const fetchImpl = async () => jsonResponse(201, {
    syncStatus: "SYNCED",
    attributionStatus: "REVIEW",
    attributionNote: "Referral SVL-MA-9999 is SUSPENDED and was not credited",
  });
  const result = await syncWebsiteLead(sql, { ...lead, referral_agent_id: "SVL-MA-9999" }, fetchImpl);
  assert.equal(result.syncStatus, "SYNCED");
  assert.equal(result.attributionStatus, "REVIEW");
  assert.match(result.attributionNote, /not credited/);
});

test("a rejected payload is marked FAILED and keeps the error", async () => {
  const { sql, updates } = fakeSql();
  const fetchImpl = async () => jsonResponse(400, { error: "Applicant name is required" });
  const result = await syncWebsiteLead(sql, lead, fetchImpl);
  assert.equal(result.syncStatus, "FAILED");
  assert.match(result.error, /Applicant name is required/);
  assert.equal(updates[0].values[0], "FAILED");
});

test("a management outage keeps the lead PENDING for a later retry", async () => {
  const { sql, updates } = fakeSql();
  const fetchImpl = async () => jsonResponse(503, { error: "Service unavailable" });
  const result = await syncWebsiteLead(sql, lead, fetchImpl);
  assert.equal(result.syncStatus, "PENDING");
  assert.equal(updates[0].values[0], "PENDING");
});

test("network failures keep the lead PENDING", async () => {
  const { sql, updates } = fakeSql();
  const fetchImpl = async () => {
    throw new Error("fetch failed");
  };
  const result = await syncWebsiteLead(sql, lead, fetchImpl);
  assert.equal(result.syncStatus, "PENDING");
  assert.match(result.error, /fetch failed/);
  assert.equal(updates[0].values[0], "PENDING");
});

test("missing configuration preserves the lead as PENDING without calling the API", async () => {
  delete process.env.SVL_MANAGEMENT_API_URL;
  const { sql, updates } = fakeSql();
  let called = false;
  const result = await syncWebsiteLead(sql, lead, async () => {
    called = true;
    return jsonResponse(200, {});
  });
  assert.equal(called, false);
  assert.equal(result.syncStatus, "PENDING");
  assert.match(result.error, /not configured/);
  assert.equal(updates[0].values[0], "PENDING");
});

test("sync errors redact the integration secret", async () => {
  const { sql, updates } = fakeSql();
  const fetchImpl = async () => jsonResponse(500, { error: "Rejected sync-secret-value" });
  await syncWebsiteLead(sql, lead, fetchImpl);
  assert.equal(String(updates[0].values[3]).includes("sync-secret-value"), false);
  assert.match(String(updates[0].values[3]), /\[redacted\]/);
});

test("retryDueLeads skips records that are backed off and retries the rest", async () => {
  const recent = new Date(Date.now() - 30_000).toISOString();
  const { sql, updates } = fakeSql({
    leads: [
      { ...lead, id: "33333333-3333-3333-3333-333333333333", lead_number: "SVL-LD-2026-000124", last_sync_attempt: recent, sync_attempts: 2 },
      { ...lead, id: "44444444-4444-4444-4444-444444444444", lead_number: "SVL-LD-2026-000125", last_sync_attempt: null, sync_attempts: 0 },
    ],
  });
  const fetchImpl = async () => jsonResponse(201, { syncStatus: "SYNCED" });
  const results = await retryDueLeads(sql, 10, fetchImpl);
  assert.equal(results.length, 1);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].values[5], "44444444-4444-4444-4444-444444444444");
});

test("retry backoff grows and stops at six hours", () => {
  assert.equal(retryDelayMs(0), 0);
  assert.equal(retryDelayMs(1), 60_000);
  assert.equal(retryDelayMs(2), 300_000);
  assert.equal(retryDelayMs(99), 21_600_000);
});

test("application payload maps the full marketing agent application", () => {
  const payload = applicationPayload(application);
  assert.equal(payload.reference, "SVL-MA-APP-2026-000009");
  assert.equal(payload.external_id, "SVL-MA-APP-2026-000009");
  assert.equal(payload.city, "Paynesville");
  assert.equal(payload.experience, "Sales, Marketing\nField sales and client onboarding.");
  assert.equal(payload.outreach_channels, "Phone Calls, WhatsApp");
  assert.deepEqual(payload.scenario_responses, {
    school: application.scenario_school_response,
    pricing: application.scenario_pricing_response,
    website: application.scenario_website_response,
  });
  assert.equal(payload.cv_reference, "SVL-MA-APP-2026-000009-resume.pdf");
  assert.equal(payload.submitted_at, "2026-10-20T10:05:00.000Z");
});

test("application sync marks SYNCED against the applications endpoint", async () => {
  const { sql, updates } = fakeSql();
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return jsonResponse(201, { syncStatus: "SYNCED", applicationReference: application.application_reference });
  };
  const result = await syncMarketingApplication(sql, application, fetchImpl);
  assert.equal(request.url, "https://management.example/api/marketing-agents/sync/applications");
  assert.equal(request.options.headers["x-marketing-sync-key"], "sync-secret-value");
  assert.equal(JSON.parse(request.options.body).cv_reference, application.resume_file_key);
  assert.equal(result.syncStatus, "SYNCED");
  assert.equal(updates[0].values[0], "SYNCED");
});

test("application sync keeps failures retryable and rejects are FAILED", async () => {
  const { sql, updates } = fakeSql();
  const outage = await syncMarketingApplication(sql, application, async () => jsonResponse(502, { error: "Bad gateway" }));
  assert.equal(outage.syncStatus, "PENDING");
  assert.equal(updates[0].values[0], "PENDING");
  const rejected = await syncMarketingApplication(sql, application, async () => jsonResponse(422, { error: "Invalid record" }));
  assert.equal(rejected.syncStatus, "FAILED");
  assert.equal(updates[1].values[0], "FAILED");
});

test("retryDueApplications retries pending applications", async () => {
  const { sql, updates } = fakeSql({ applications: [{ ...application, last_sync_attempt: null }] });
  const results = await retryDueApplications(sql, 10, async () => jsonResponse(201, { syncStatus: "SYNCED" }));
  assert.equal(results.length, 1);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].values[5], application.id);
});
