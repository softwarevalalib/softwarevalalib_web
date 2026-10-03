import { getAttribution } from "./attribution";

/** Records a public conversion action. Failures stay silent so the page still works. */
export function trackAction(event, page = "") {
  const attribution = getAttribution();
  fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      action: "track",
      event,
      page: page || (typeof window !== "undefined" ? window.location.pathname : ""),
      website: "",
      ...attribution,
    }),
    keepalive: true,
  }).catch(() => {});
}
