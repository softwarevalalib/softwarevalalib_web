const SESSION_KEY = "svl_academy_chat_session";
const DISMISS_KEY = "svl_academy_chat_greet_dismissed";

export function getChatSessionKey() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

export function setChatSessionKey(key) {
  try {
    sessionStorage.setItem(SESSION_KEY, key);
  } catch {
    // ignore
  }
}

export function isGreetingDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissGreeting() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // ignore
  }
}

function getVisitorId() {
  try {
    let id = localStorage.getItem("svl_academy_visitor_id");
    if (!id) {
      id = `vid_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      localStorage.setItem("svl_academy_visitor_id", id);
    }
    return id;
  } catch {
    return `vid_${Date.now()}`;
  }
}

async function postAssistant(payload) {
  const res = await fetch("/api/academy/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      ...payload,
      sessionKey: payload.sessionKey || getChatSessionKey(),
      visitorId: getVisitorId(),
      pageUrl: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
      website: "",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Assistant unavailable");
  if (data.sessionKey) setChatSessionKey(data.sessionKey);
  return data;
}

export function bootstrapAssistant() {
  return postAssistant({ action: "bootstrap" });
}

export function sendAssistantMessage(message, extra = {}) {
  return postAssistant({ action: "chat", message, ...extra });
}

export function assistantAction(action, extra = {}) {
  return postAssistant({ action, ...extra });
}

export function trackAssistantEvent(eventType, metadata = {}) {
  return postAssistant({ action: "event", eventType, metadata }).catch(() => {});
}
