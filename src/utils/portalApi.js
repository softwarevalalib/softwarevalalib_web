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

function adminHeaders(extra = {}) {
  const token = getAdminTokenLocal();
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

function isTransientNetworkError(err) {
  const msg = String(err?.message || err || "");
  return (
    err?.name === "AbortError" ||
    /Failed to fetch|NetworkError|network|timeout|ERR_TIMED_OUT|Load failed/i.test(msg)
  );
}

async function fetchWithRetry(url, options = {}, { retries = 2, delayMs = 800 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      // Retry cold-start / gateway timeouts
      if ((res.status === 408 || res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (!isTransientNetworkError(err) || attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastError || new Error("Request failed");
}

export async function portalLogin(username, password) {
  const res = await fetchWithRetry(
    "/api/academy/portal?action=login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ action: "login", username, password, website: "" }),
    },
    { retries: 2, delayMs: 1000 },
  );
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

/** Authenticated portal action (student or instructor). */
export async function portalAction(action, body = {}, method = "POST") {
  const isGet = method === "GET";
  const params = new URLSearchParams({ action });
  if (isGet) {
    Object.entries(body).forEach(([k, v]) => {
      if (v != null && v !== "") params.set(k, String(v));
    });
  }
  const res = await fetch(isGet ? `/api/academy/portal?${params}` : "/api/academy/portal", {
    method,
    headers: authHeaders(isGet ? {} : { "Content-Type": "application/json" }),
    ...(isGet ? {} : { body: JSON.stringify({ action, ...body, website: "" }) }),
  });
  return parseJson(res);
}

export async function fetchPublicCourses() {
  const res = await fetch("/api/academy/portal?action=public-list-courses", {
    headers: { Accept: "application/json" },
  });
  return parseJson(res);
}

export function gradePdfUrl(gradeId) {
  return `/api/academy/portal?action=download-grade-pdf&id=${encodeURIComponent(gradeId)}`;
}

export async function downloadGradePdf(gradeId) {
  const res = await fetch(gradePdfUrl(gradeId), { headers: authHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Unable to download grade PDF");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SVL_Grade_${gradeId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function verifyCertificate(certificateId, email) {
  const res = await fetch("/api/academy/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ action: "verify-certificate", certificateId, email, website: "" }),
  });
  return parseJson(res);
}

export async function portalAdmin(action, body = {}, method = "POST") {
  const isGet = method === "GET";
  const params = new URLSearchParams({ action });
  if (isGet) {
    Object.entries(body).forEach(([k, v]) => {
      if (v != null && v !== "") params.set(k, String(v));
    });
  }
  const res = await fetch(isGet ? `/api/academy/portal?${params}` : "/api/academy/portal", {
    method,
    headers: adminHeaders(isGet ? {} : { "Content-Type": "application/json" }),
    ...(isGet ? {} : { body: JSON.stringify({ action, ...body, website: "" }) }),
  });
  return parseJson(res);
}

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve({
        base64,
        name: file.name,
        mime: file.type || "application/octet-stream",
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
