/**
 * Shared helpers for client feedback API (browser + server).
 */

export function getFeedbackApiUrl() {
  return "/api/feedback";
}

export async function fetchReviews() {
  const response = await fetch(getFeedbackApiUrl(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Unable to load live reviews.");
  }
  const data = await response.json();
  return Array.isArray(data.reviews) ? data.reviews : [];
}

export async function submitReview(payload) {
  const response = await fetch(getFeedbackApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Unable to submit your review.");
  }
  return data.review;
}
