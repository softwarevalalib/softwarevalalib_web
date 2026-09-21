export async function fetchAcademyRatings() {
  const res = await fetch("/api/academy/ratings", { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Unable to load ratings");
  return res.json();
}

export async function submitCourseRating({ courseId, rating, reviewerKey }) {
  const res = await fetch("/api/academy/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ courseId, rating, reviewerKey, website: "" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Unable to submit rating");
  return data;
}

export async function submitEnrollment(payload) {
  const res = await fetch("/api/academy/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Unable to submit application");
  return data;
}

export function getOrCreateReviewerKey() {
  const keyName = "svl_academy_reviewer_key";
  try {
    let key = localStorage.getItem(keyName);
    if (!key) {
      key = `rk_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      localStorage.setItem(keyName, key);
    }
    return key;
  } catch {
    return `rk_session_${Date.now()}`;
  }
}

function getOrCreateId(storageKey, prefix) {
  try {
    let id = localStorage.getItem(storageKey);
    if (!id) {
      id = `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      localStorage.setItem(storageKey, id);
    }
    return id;
  } catch {
    return `${prefix}_${Date.now()}`;
  }
}

export function getVisitorId() {
  return getOrCreateId("svl_academy_visitor_id", "vid");
}

export function getTrackingSessionId() {
  try {
    let id = sessionStorage.getItem("svl_academy_session_id");
    if (!id) {
      id = `sid_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      sessionStorage.setItem("svl_academy_session_id", id);
    }
    return id;
  } catch {
    return `sid_${Date.now()}`;
  }
}

/** Persist Academy analytics events (and optional gtag). */
export function trackAcademyEvent(name, payload = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, payload);
    }
  } catch {
    // analytics optional
  }

  if (typeof window === "undefined") return;

  const body = {
    eventName: name,
    path: window.location.pathname + window.location.search,
    courseId: payload.courseId || null,
    courseCode: payload.course || payload.courseCode || null,
    source: payload.source || null,
    visitorId: getVisitorId(),
    sessionId: getTrackingSessionId(),
    referrer: document.referrer || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    metadata: payload,
    website: "",
  };

  try {
    const json = JSON.stringify(body);
    if (navigator.sendBeacon) {
      const blob = new Blob([json], { type: "application/json" });
      navigator.sendBeacon("/api/academy/insights", blob);
      return;
    }
  } catch {
    // fall through to fetch
  }

  fetch("/api/academy/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
