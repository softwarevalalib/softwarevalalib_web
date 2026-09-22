const TOKEN_KEY = "svl_academy_portal_token";
const USER_KEY = "svl_academy_portal_user";
const ADMIN_TOKEN_KEY = "svl_academy_admin_token";

export function getPortalToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function getAdminTokenLocal() {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getStoredPortalUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPortalSession({ token, user }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearPortalSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

function authHeaders(extra = {}) {
  const token = getPortalToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function portalLogin(username, password) {
  const res = await fetch("/api/academy/portal?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action: "login", username, password, website: "" }),
  });
  const data = await parseJson(res);
  setPortalSession({ token: data.token, user: data.user });
  return data;
}

export async function portalLogout() {
  try {
    await fetch("/api/academy/portal?action=logout", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "logout" }),
    });
  } catch {
    // ignore
  }
  clearPortalSession();
}

export async function fetchPortalMe() {
  const res = await fetch("/api/academy/portal?action=me", { headers: authHeaders() });
  return parseJson(res);
}

export async function fetchStudentDashboard() {
  const res = await fetch("/api/academy/portal?action=my-dashboard", { headers: authHeaders() });
  return parseJson(res);
}

export async function fetchInstructorDashboard() {
  const res = await fetch("/api/academy/portal?action=instructor-dashboard", {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function verifyCertificate(certificateId, email) {
  const res = await fetch("/api/academy/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action: "verify-certificate", certificateId, email, website: "" }),
  });
  return parseJson(res);
}

function adminHeaders(extra = {}) {
  const token = getAdminTokenLocal();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function portalAdmin(action, body = {}, method = "POST") {
  const isGet = method === "GET";
  const url = isGet
    ? `/api/academy/portal?action=${encodeURIComponent(action)}${body.role ? `&role=${encodeURIComponent(body.role)}` : ""}${body.id ? `&id=${encodeURIComponent(body.id)}` : ""}`
    : "/api/academy/portal";
  const res = await fetch(url, {
    method,
    headers: adminHeaders(isGet ? {} : { "Content-Type": "application/json" }),
    ...(isGet ? {} : { body: JSON.stringify({ action, ...body, website: "" }) }),
  });
  return parseJson(res);
}
