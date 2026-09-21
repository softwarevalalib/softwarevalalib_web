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

export function trackAcademyEvent(name, payload = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, payload);
    }
  } catch {
    // analytics optional
  }
}
