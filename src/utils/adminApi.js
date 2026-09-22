const TOKEN_KEY = "svl_academy_admin_token";
const ADMIN_KEY = "svl_academy_admin_user";

export function getAdminToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getStoredAdmin() {
  try {
    const raw = sessionStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminSession({ token, admin }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
  } catch {
    // ignore
  }
}

function authHeaders(extra = {}) {
  const token = getAdminToken();
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

export async function adminLogin(email, password) {
  const res = await fetch("/api/academy/auth?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, website: "" }),
  });
  const data = await parseJson(res);
  setAdminSession({ token: data.token, admin: data.admin });
  return data;
}

export async function adminLogout() {
  try {
    await fetch("/api/academy/auth?action=logout", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: "{}",
    });
  } catch {
    // ignore network errors on logout
  }
  clearAdminSession();
}

export async function fetchAdminMe() {
  const res = await fetch("/api/academy/auth?action=me", {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function changeAdminPassword(currentPassword, newPassword) {
  const res = await fetch("/api/academy/auth?action=change-password", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return parseJson(res);
}

export async function fetchDashboard(days = 30) {
  const res = await fetch(`/api/academy/dashboard?days=${days}`, {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function fetchInsights(days = 30) {
  const res = await fetch(`/api/academy/insights?days=${days}&limit=150`, {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function fetchEnrollments() {
  const res = await fetch("/api/academy/enroll", {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function fetchEnrollmentDetail(id) {
  const res = await fetch(`/api/academy/applications?id=${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function updateEnrollment(id, patch) {
  const res = await fetch("/api/academy/applications", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "update", id, patch, website: "" }),
  });
  return parseJson(res);
}

export async function deleteEnrollment(id) {
  const res = await fetch("/api/academy/applications", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "delete", id, website: "" }),
  });
  return parseJson(res);
}

export async function generateAdmissionLetter(referenceNumber, { regenerate = false } = {}) {
  const res = await fetch("/api/academy/admission", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      action: regenerate ? "regenerate" : "generate",
      referenceNumber,
      website: "",
    }),
  });
  return parseJson(res);
}

export async function resendAdmissionLetter(documentId) {
  const res = await fetch("/api/academy/admission", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "resend", id: documentId, website: "" }),
  });
  return parseJson(res);
}

export async function fetchRatingsAdmin() {
  const res = await fetch("/api/academy/ratings", {
    headers: { Accept: "application/json" },
  });
  return parseJson(res);
}
