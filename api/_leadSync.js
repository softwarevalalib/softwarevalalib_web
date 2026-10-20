import { managementSyncConfig, retryDelayMs } from "./_marketingSync.js";

const SYNC_TIMEOUT_MS = 8000;

function listText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).join(", ");
  } catch {
    /* stored as plain text */
  }
  return trimmed;
}

export function leadPayload(row) {
  const submitted = row.created_at ? new Date(row.created_at) : new Date();
  const referral = row.referral_agent_id || null;
  return {
    lead_number: row.lead_number,
    external_id: row.lead_number,
    contact_name: row.contact_name,
    company_name: row.company_name,
    name: row.contact_name,
    organization: row.company_name,
    email: row.email,
    phone: row.phone || null,
    whatsapp: row.whatsapp || null,
    industry: row.industry || null,
    location: row.location || null,
    service: listText(row.services) || null,
    services_interested: listText(row.services) || null,
    business_challenge: row.business_challenge || null,
    budget_range: row.budget_range || null,
    preferred_contact: row.preferred_contact || null,
    timeline: row.timeline || null,
    source: row.source || "Website",
    campaign: row.campaign || null,
    record_type: row.record_type || "consultation",
    utm_source: row.utm_source || null,
    utm_medium: row.utm_medium || null,
    utm_campaign: row.utm_campaign || null,
    utm_content: row.utm_content || null,
    utm_term: row.utm_term || null,
    landing_path: row.landing_path || null,
    referral_agent_id: referral,
    referral_agent_code: referral,
    submitted_at: Number.isNaN(submitted.getTime()) ? new Date().toISOString() : submitted.toISOString(),
  };
}

function syncResult(data) {
  return String(data?.syncStatus || data?.status || data?.result || "");
}

function redact(message, status) {
  const secret = String(process.env.MARKETING_SYNC_SECRET || "");
  let text = String(message || "").replace(/\s+/g, " ").trim();
  if (secret) text = text.split(secret).join("[redacted]");
  text = text.replace(/x-marketing-sync-key\s*[:=]\s*\S+/gi, "x-marketing-sync-key:[redacted]");
  text = text.replace(/bearer\s+\S+/gi, "bearer [redacted]").slice(0, 180);
  if (status) return `HTTP ${status}${text ? `: ${text}` : ""}`.slice(0, 240);
  return text || "Management API unavailable";
}

function logSync(entry) {
  console.info(JSON.stringify({
    event: "marketing_lead_sync",
    leadNumber: entry.leadNumber,
    attempt: entry.attempt,
    timestamp: entry.timestamp,
    httpStatus: entry.httpStatus,
    result: entry.result,
    attribution: entry.attribution || undefined,
    error: entry.error || undefined,
  }));
}

async function markSync(sql, id, fields) {
  await sql`
    UPDATE website_leads
    SET sync_status = ${fields.status},
        sync_attempts = ${fields.attempts},
        last_sync_attempt = ${fields.attemptedAt},
        last_sync_error = ${fields.error},
        management_sync_timestamp = ${fields.syncedAt},
        updated_at = NOW()
    WHERE id = ${id}::uuid
  `;
}

export async function ensureLeadSyncColumns(sql) {
  await sql`ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'PENDING'`;
  await sql`ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS sync_attempts INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS last_sync_attempt TIMESTAMPTZ`;
  await sql`ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS last_sync_error TEXT`;
  await sql`ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS management_sync_timestamp TIMESTAMPTZ`;
  await sql`ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS utm_term TEXT`;
}

export async function syncWebsiteLead(sql, lead, fetchImpl = fetch) {
  const leadNumber = lead.lead_number;
  const attempt = Number(lead.sync_attempts || 0) + 1;
  const timestamp = new Date().toISOString();
  const config = managementSyncConfig();
  if (!config) {
    const error = "Management sync is not configured";
    await markSync(sql, lead.id, { status: "PENDING", attempts: attempt, attemptedAt: timestamp, error, syncedAt: null });
    logSync({ leadNumber, attempt, timestamp, httpStatus: null, result: "PENDING", error });
    return { syncStatus: "PENDING", leadNumber, error };
  }

  let httpStatus = null;
  try {
    const response = await fetchImpl(`${config.base}/api/marketing-agents/sync/leads`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-marketing-sync-key": config.key,
      },
      body: JSON.stringify(leadPayload(lead)),
      signal: AbortSignal.timeout(SYNC_TIMEOUT_MS),
    });
    httpStatus = response.status;
    const data = await response.json().catch(() => ({}));
    const result = syncResult(data);
    if (response.ok && (result === "SYNCED" || result === "ALREADY_SYNCED")) {
      await markSync(sql, lead.id, { status: "SYNCED", attempts: attempt, attemptedAt: timestamp, error: null, syncedAt: timestamp });
      logSync({
        leadNumber,
        attempt,
        timestamp,
        httpStatus,
        result,
        attribution: data.attributionStatus || data.attribution || data.credit || undefined,
      });
      return {
        syncStatus: "SYNCED",
        managementStatus: result,
        leadNumber,
        attributionStatus: data.attributionStatus || null,
        attributionNote: data.attributionNote || null,
        attribution: data.attribution || data.credit || null,
      };
    }
    const temporary = httpStatus >= 500 || httpStatus === 401 || httpStatus === 408 || httpStatus === 429;
    const error = redact(data.error || response.statusText, httpStatus);
    const status = temporary ? "PENDING" : "FAILED";
    await markSync(sql, lead.id, { status, attempts: attempt, attemptedAt: timestamp, error, syncedAt: null });
    logSync({ leadNumber, attempt, timestamp, httpStatus, result: status, error });
    return { syncStatus: status, leadNumber, error };
  } catch (error) {
    const message = redact(error?.name === "TimeoutError" ? "Management API timed out" : error?.message, httpStatus);
    await markSync(sql, lead.id, { status: "PENDING", attempts: attempt, attemptedAt: timestamp, error: message, syncedAt: null });
    logSync({ leadNumber, attempt, timestamp, httpStatus, result: "PENDING", error: message });
    return { syncStatus: "PENDING", leadNumber, error: message };
  }
}

export async function retryDueLeads(sql, limit = 5, fetchImpl = fetch) {
  await ensureLeadSyncColumns(sql);
  const rows = await sql`
    SELECT id, lead_number, company_name, contact_name, email, phone, whatsapp, industry, location,
      services, business_challenge, budget_range, preferred_contact, timeline, source, campaign,
      record_type, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_path,
      referral_agent_id, created_at, sync_status, sync_attempts, last_sync_attempt
    FROM website_leads
    WHERE COALESCE(sync_status, 'PENDING') = 'PENDING'
    ORDER BY last_sync_attempt ASC NULLS FIRST
    LIMIT 25
  `;
  const now = Date.now();
  const due = rows.filter((row) => {
    if (!row.last_sync_attempt) return true;
    return now - new Date(row.last_sync_attempt).getTime() >= retryDelayMs(row.sync_attempts);
  }).slice(0, limit);
  return Promise.all(due.map((row) => syncWebsiteLead(sql, row, fetchImpl)));
}
