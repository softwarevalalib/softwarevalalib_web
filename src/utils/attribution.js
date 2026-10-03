const KEY = "svl_lead_attribution";

function readStored() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Capture first-touch UTM and marketing-agent ref. Later visits do not overwrite. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const incoming = {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    referralAgentId: params.get("ref") || "",
    landingPath: window.location.pathname,
  };
  const hasSignal = Object.entries(incoming).some(([k, v]) => k !== "landingPath" && v);
  if (!hasSignal) return;
  const current = readStored();
  const next = { ...incoming };
  for (const [k, v] of Object.entries(current)) {
    if (v) next[k] = v;
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getAttribution() {
  const stored = readStored();
  return {
    utmSource: stored.utmSource || "",
    utmMedium: stored.utmMedium || "",
    utmCampaign: stored.utmCampaign || "",
    utmContent: stored.utmContent || "",
    referralAgentId: stored.referralAgentId || "",
    landingPath: stored.landingPath || "",
  };
}
