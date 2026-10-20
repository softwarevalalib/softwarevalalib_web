const BACKOFF_MS = [0, 60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 60 * 60_000];
const SYNC_TIMEOUT_MS = 8000;

export function managementSyncConfig(env = process.env) {
  const base = String(env.SVL_MANAGEMENT_API_URL || "").trim().replace(/\/$/, "");
  const key = String(env.MARKETING_SYNC_SECRET || "").trim();
  if (!base || !key) return null;
  return { base, key };
}

export function retryDelayMs(attempts) {
  const index = Math.min(Math.max(Number(attempts) || 0, 0), BACKOFF_MS.length - 1);
  return BACKOFF_MS[index];
}

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

export function applicationPayload(row) {
  const experience = [listText(row.experience_categories), row.experience_description].filter(Boolean).join("\n");
  const conflict = [
    row.markets_other_technology_company ? "Markets another technology company" : "",
    row.conflict_details || "",
  ].filter(Boolean).join(": ");
  const reference = row.application_reference;
  const submitted = row.submitted_at ? new Date(row.submitted_at) : new Date();
  return {
    reference,
    external_id: reference,
    full_name: row.full_name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    county: row.county,
    city: row.city_area,
    professional_status: row.professional_status,
    occupation: row.occupation,
    organization: row.organization,
    education: row.education_level,
    background: row.professional_background,
    experience: experience || null,
    network_sectors: listText(row.network_sectors) || null,
    preferred_sectors: listText(row.preferred_sectors) || null,
    network_description: row.network_description,
    outreach_channels: listText(row.outreach_methods) || null,
    scenario_responses: {
      school: row.scenario_school_response,
      pricing: row.scenario_pricing_response,
      website: row.scenario_website_response,
    },
    availability: row.weekly_availability,
    training_availability: row.available_for_training ? "Yes" : "No",
    reporting_willingness: row.willing_to_report ? "Yes" : "No",
    conflict_disclosure: conflict || null,
    cv_reference: row.resume_file_key || row.resume_original_filename || null,
    submitted_at: Number.isNaN(submitted.getTime()) ? new Date().toISOString() : submitted.toISOString(),
    utm_source: row.utm_source || null,
    utm_medium: row.utm_medium || null,
    utm_campaign: row.utm_campaign || null,
    utm_content: row.utm_content || null,
    utm_term: row.utm_term || null,
    source: "application.softwarevalalib.app",
  };
}

function safeMessage(message, status) {
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
    event: "marketing_application_sync",
    applicationReference: entry.reference,
    attempt: entry.attempt,
    timestamp: entry.timestamp,
    httpStatus: entry.httpStatus,
    result: entry.result,
    error: entry.error || undefined,
  }));
}

async function markSync(sql, id, fields) {
  await sql`
    UPDATE marketing_agent_applications
    SET sync_status = ${fields.status},
        sync_attempts = ${fields.attempts},
        last_sync_attempt = ${fields.attemptedAt},
        last_sync_error = ${fields.error},
        management_sync_timestamp = ${fields.syncedAt},
        updated_at = NOW()
    WHERE id = ${id}::uuid
  `;
}

export async function syncMarketingApplication(sql, application, fetchImpl = fetch) {
  const reference = application.application_reference;
  const attempt = Number(application.sync_attempts || 0) + 1;
  const timestamp = new Date().toISOString();
  const config = managementSyncConfig();
  if (!config) {
    const error = "Management sync is not configured";
    await markSync(sql, application.id, {
      status: "PENDING",
      attempts: attempt,
      attemptedAt: timestamp,
      error,
      syncedAt: null,
    });
    logSync({ reference, attempt, timestamp, httpStatus: null, result: "PENDING", error });
    return { syncStatus: "PENDING", applicationReference: reference, error };
  }

  let httpStatus = null;
  try {
    const response = await fetchImpl(`${config.base}/api/marketing-agents/sync/applications`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-marketing-sync-key": config.key,
      },
      body: JSON.stringify(applicationPayload(application)),
      signal: AbortSignal.timeout(SYNC_TIMEOUT_MS),
    });
    httpStatus = response.status;
    const data = await response.json().catch(() => ({}));
    if (response.ok && (data.syncStatus === "SYNCED" || data.syncStatus === "ALREADY_SYNCED")) {
      await markSync(sql, application.id, {
        status: "SYNCED",
        attempts: attempt,
        attemptedAt: timestamp,
        error: null,
        syncedAt: timestamp,
      });
      logSync({ reference, attempt, timestamp, httpStatus, result: data.syncStatus });
      return { syncStatus: "SYNCED", managementStatus: data.syncStatus, applicationReference: data.applicationReference || reference };
    }
    const temporary = httpStatus >= 500 || httpStatus === 401 || httpStatus === 408 || httpStatus === 429;
    const error = safeMessage(data.error || response.statusText, httpStatus);
    const status = temporary ? "PENDING" : "FAILED";
    await markSync(sql, application.id, {
      status,
      attempts: attempt,
      attemptedAt: timestamp,
      error,
      syncedAt: null,
    });
    logSync({ reference, attempt, timestamp, httpStatus, result: status, error });
    return { syncStatus: status, applicationReference: reference, error };
  } catch (error) {
    const message = safeMessage(error?.name === "TimeoutError" ? "Management API timed out" : error?.message, httpStatus);
    await markSync(sql, application.id, {
      status: "PENDING",
      attempts: attempt,
      attemptedAt: timestamp,
      error: message,
      syncedAt: null,
    });
    logSync({ reference, attempt, timestamp, httpStatus, result: "PENDING", error: message });
    return { syncStatus: "PENDING", applicationReference: reference, error: message };
  }
}

export async function retryDueApplications(sql, limit = 5, fetchImpl = fetch) {
  const rows = await sql`
    SELECT id, application_reference, full_name, phone, whatsapp, email, county, city_area,
      professional_status, occupation, organization, education_level, professional_background,
      experience_categories, experience_description, network_sectors, preferred_sectors,
      network_description, outreach_methods, scenario_school_response, scenario_pricing_response,
      scenario_website_response, weekly_availability, available_for_training, willing_to_report,
      markets_other_technology_company, conflict_details, resume_file_key, resume_original_filename,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, submitted_at, sync_status,
      sync_attempts, last_sync_attempt
    FROM marketing_agent_applications
    WHERE COALESCE(sync_status, 'PENDING') = 'PENDING'
    ORDER BY last_sync_attempt ASC NULLS FIRST
    LIMIT 25
  `;
  const now = Date.now();
  const due = rows.filter((row) => {
    if (!row.last_sync_attempt) return true;
    return now - new Date(row.last_sync_attempt).getTime() >= retryDelayMs(row.sync_attempts);
  }).slice(0, limit);
  return Promise.all(due.map((row) => syncMarketingApplication(sql, row, fetchImpl)));
}
