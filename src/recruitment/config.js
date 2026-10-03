export const APPLICATION_OPEN_AT = "2026-10-03T00:00:00Z";
export const APPLICATION_CLOSE_AT = "2026-10-17T23:59:00Z";
export const CLOSED_MESSAGE =
  "Applications for the current Software Vala Liberia Freelance Marketing Agent recruitment have closed.";

export function recruitmentState(now = Date.now()) {
  if (now < Date.parse(APPLICATION_OPEN_AT)) return "before";
  if (now > Date.parse(APPLICATION_CLOSE_AT)) return "closed";
  return "open";
}

export const DRAFT_KEY = "svl_ma_application_draft";
