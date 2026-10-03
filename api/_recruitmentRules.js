export const APPLICATION_OPEN_AT = "2026-10-03T00:00:00Z";
export const APPLICATION_CLOSE_AT = "2026-10-17T23:59:00Z";
export const CLOSED_MESSAGE =
  "Applications for the current Software Vala Liberia Freelance Marketing Agent recruitment have closed.";

export const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "SELECTED",
  "WAITLISTED",
  "NOT_SELECTED",
  "WITHDRAWN",
  "ONBOARDING",
  "ACTIVE_AGENT",
];

export const SCREENING = [
  { key: "communication", label: "Communication & Professionalism", max: 25 },
  { key: "network", label: "Relevant Business/Professional Network", max: 20 },
  { key: "sales", label: "Sales/Marketing/Relationship Ability", max: 20 },
  { key: "technology", label: "Understanding of Technology/Business Problems", max: 15 },
  { key: "reliability", label: "Reliability, Record Keeping & Digital Literacy", max: 10 },
  { key: "integrity", label: "Integrity & Policy Compliance", max: 10 },
];

export const INTERVIEW = [
  { key: "communication", label: "Communication & Confidence", max: 20 },
  { key: "mindset", label: "Business Development Mindset", max: 20 },
  { key: "prospecting", label: "Prospecting / Network Potential", max: 20 },
  { key: "judgment", label: "Scenario Judgment", max: 15 },
  { key: "professionalism", label: "Professionalism & Integrity", max: 15 },
  { key: "availability", label: "Availability & Commitment", max: 10 },
];

export const ONBOARDING = [
  "torReviewed",
  "commissionPolicyReviewed",
  "agreementSigned",
  "identityVerified",
  "trainingCompleted",
  "referralRulesExplained",
  "reportingExplained",
  "brandRulesExplained",
];

const OPEN_MS = Date.parse(APPLICATION_OPEN_AT);
const CLOSE_MS = Date.parse(APPLICATION_CLOSE_AT);

export function recruitmentWindow(now = Date.now()) {
  if (now < OPEN_MS) return "before";
  if (now > CLOSE_MS) return "closed";
  return "open";
}

export function sumScore(parts, rubric) {
  let total = 0;
  for (const item of rubric) {
    const raw = Number(parts?.[item.key]);
    if (!Number.isFinite(raw) || raw < 0 || raw > item.max) {
      return { error: `Score ${item.label} must be between 0 and ${item.max}.` };
    }
    total += raw;
  }
  return { total };
}

export function applicationReference(sequence) {
  return `SVL-MA-APP-2026-${String(sequence).padStart(6, "0")}`;
}

export function agentId(sequence) {
  return `SVL-MA-${String(sequence).padStart(4, "0")}`;
}

export function screeningBand(score) {
  if (score >= 80) return "Strong shortlist consideration";
  if (score >= 65) return "Review / possible shortlist";
  if (score >= 50) return "Hold / secondary review";
  return "Normally not shortlisted";
}

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").toLowerCase());
}

export function limitedList(values, allowed, max) {
  const unique = [];
  for (const value of Array.isArray(values) ? values : []) {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (!allowed.includes(clean) || unique.includes(clean)) continue;
    unique.push(clean);
    if (max && unique.length > max) return { error: `Choose no more than ${max}.` };
  }
  return { values: unique };
}

const CV_TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const CV_MAX_BYTES = 3 * 1024 * 1024;

export function inspectCv(file) {
  if (!file) return { ok: true };
  const name = String(file.name || "").toLowerCase();
  const ext = name.split(".").pop();
  const mime = String(file.type || "").toLowerCase();
  const expected = CV_TYPES[mime];
  if (!expected || expected !== ext) {
    return { error: "Upload a PDF, DOC, or DOCX resume." };
  }
  if (/[\\/]|\.(exe|js|html|svg|php|sh)$/i.test(name)) {
    return { error: "That file type is not accepted." };
  }
  const bytes = Buffer.from(String(file.dataBase64 || ""), "base64");
  if (!bytes.length || bytes.length > CV_MAX_BYTES) {
    return { error: "Resume must be under 3 MB." };
  }
  const pdf = bytes.subarray(0, 4).toString() === "%PDF";
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const ole = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (ext === "pdf" && !pdf) return { error: "The PDF resume could not be verified." };
  if (ext === "docx" && !zip) return { error: "The DOCX resume could not be verified." };
  if (ext === "doc" && !ole) return { error: "The DOC resume could not be verified." };
  return { ok: true, bytes, ext, mime };
}
