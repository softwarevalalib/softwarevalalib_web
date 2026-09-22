import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let COURSES = null;

function loadCourses() {
  if (COURSES) return COURSES;
  try {
    const raw = readFileSync(join(__dirname, "data", "courses.json"), "utf8");
    COURSES = JSON.parse(raw);
  } catch {
    COURSES = [];
  }
  return COURSES;
}

export const ACADEMY_KNOWLEDGE = {
  faq: [
    { q: "Are classes online?", a: "Yes. SVL Training Academy programmes are delivered 100% online with live sessions and self-paced practice." },
    { q: "How long are the courses?", a: "Most technology courses run 6–16 weeks. Professional Certificate, Diploma, and Comprehensive programmes are typically 12 weeks." },
    { q: "Can I enroll in more than one course?", a: "Yes. You can select multiple courses in one application on /academy/enroll or with the Academy Assistant." },
    { q: "Do I receive a certificate?", a: "Yes. Learners who meet attendance and assessment requirements receive a professional certificate from SVL Training Academy." },
    { q: "What equipment do I need?", a: "A personal laptop, basic computer knowledge, and reliable internet. Minimum 80% live-session attendance and 70% average score are recommended." },
    { q: "Can I pay in installments?", a: "Flexible installment options may be available after your application is reviewed. Final terms are confirmed during enrollment processing. Official merchant details are shared after approval — never invented online." },
    { q: "How do online classes work?", a: "About 3 hours/week live class plus about 3 hours/week self-paced activities for 12-week professional programmes." },
    { q: "What happens after I submit?", a: "You receive a reference number immediately. Your admission letter is generated automatically (usually ready within 10–30 minutes) and emailed to you — admin approval is not required before the letter is sent. You can view, edit, or delete a pending application and download your letter at /academy/applications. Admissions may still follow up within 24–48 hours about orientation and payment." },
    { q: "How does enrollment work?", a: "Choose a course, click Select to enroll (or use the enrollment form), share your personal details, review the summary, and confirm. After submission you get a reference number and an automatic admission letter within about 10–30 minutes." },
    { q: "Where can I download my admission letter?", a: "Open /academy/applications, enter the email and reference number from your application, then use Download PDF when the letter is ready. Letters are usually available within 10–30 minutes." },
    { q: "Where is Software Vala Liberia located?", a: "ELWA Junction, Monrovia, Liberia." },
  ],
  programmes: [
    { name: "Foundation Certificate", tuition: 125, registration: 10, duration: "12 Weeks" },
    { name: "Professional Diploma", tuition: 150, registration: 10, duration: "12 Weeks", note: "Requires an appropriate Certificate qualification." },
    { name: "Comprehensive Professional", tuition: 175, registration: 10, duration: "12 Weeks + Capstone" },
  ],
  sessions: [
    { id: "A", label: "Group A", days: "Mondays & Thursdays", time: "8:00–9:30 PM" },
    { id: "B", label: "Group B", days: "Tuesdays & Wednesdays", time: "8:00–9:30 PM" },
    { id: "C", label: "Group C", days: "Fridays", time: "5:30–8:30 PM" },
    { id: "D", label: "Group D", days: "Saturdays", time: "9:30 AM–12:30 PM" },
  ],
  timezone: "All times are Liberia time (GMT).",
  cohort: {
    name: "Cohort 1",
    enrollment: "September 14 – October 10, 2026",
    orientation: "October 13, 2026",
    classesBegin: "October 15, 2026",
    midterm: "Week of November 23, 2026",
    finals: "Week of January 4, 2027",
    ends: "January 7, 2027",
  },
  payments: [
    "Lonestar Mobile Money — official merchant details shared after application review",
    "Orange Money — official merchant details shared after application review",
    "Bank Transfer — account details provided in enrollment confirmation",
    "In-Person Payment — available after confirmation at SVL offices",
  ],
  assessment: "Assignments 20%, Quizzes 20%, Practical Exercises 20%, Final Project/Exam 40%. Recommended passing average 70% with at least 80% live-session attendance.",
  enrollUrl: "/academy/enroll",
};

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s$+-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function searchAcademyCourses({ query = "", level, maxTuition, category, limit = 6 } = {}) {
  const courses = loadCourses();
  const tokens = tokenize(query);
  let scored = courses.map((c) => {
    const hay = [
      c.title,
      c.shortTitle,
      c.code,
      c.category,
      c.programmeType,
      c.level,
      c.description,
      ...(c.learningOutcomes || []),
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += t.length > 3 ? 3 : 1;
    }
    if (c.featured || c.popular) score += 0.5;
    return { course: c, score };
  });

  scored = scored.filter((row) => {
    if (level && level !== "All" && !String(row.course.level).toLowerCase().includes(String(level).toLowerCase())) {
      return false;
    }
    if (typeof maxTuition === "number" && row.course.tuition > maxTuition) return false;
    if (category && !String(row.course.category).toLowerCase().includes(String(category).toLowerCase())) {
      return false;
    }
    return tokens.length === 0 ? true : row.score > 0;
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((r) => r.course);
}

export function getCourseDetails(codeOrSlug) {
  const key = String(codeOrSlug || "").toLowerCase();
  return (
    loadCourses().find(
      (c) =>
        c.code.toLowerCase() === key ||
        c.slug.toLowerCase() === key ||
        c.id.toLowerCase() === key
    ) || null
  );
}

export function recommendCourses({ goal = "", education = "", experience = "", level = "", limit = 5 } = {}) {
  const query = [goal, education, experience, level].filter(Boolean).join(" ");
  const results = searchAcademyCourses({ query, level: level || undefined, limit: Math.max(limit, 8) });
  return results.slice(0, limit).map((c) => ({
    ...c,
    why: `Matches your interest in “${goal || "skills development"}” at ${c.level} level (${c.duration}, US$${c.tuition}).`,
  }));
}

export function getFaqAnswer(question) {
  const tokens = tokenize(question);
  let best = null;
  let bestScore = 0;
  for (const item of ACADEMY_KNOWLEDGE.faq) {
    const hay = tokenize(`${item.q} ${item.a}`);
    const score = tokens.filter((t) => hay.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 2 ? best : null;
}

export function courseCardPayload(course, why) {
  return {
    type: "course_card",
    code: course.code,
    slug: course.slug,
    title: course.title,
    level: course.level,
    duration: course.duration,
    tuition: course.tuition,
    registrationFee: course.registrationFee,
    category: course.category,
    why: why || null,
    viewUrl: `/academy/courses/${course.slug}`,
    enrollUrl: `/academy/enroll?course=${encodeURIComponent(course.code)}`,
  };
}

export const ENROLLMENT_FIELDS = [
  { key: "fullName", label: "Full name", required: true },
  { key: "email", label: "Email", required: true, disclosure: true },
  { key: "phone", label: "Phone", required: true },
  { key: "whatsapp", label: "WhatsApp number", required: false },
  { key: "dateOfBirth", label: "Date of birth", required: false },
  { key: "gender", label: "Gender", required: false },
  { key: "county", label: "County", required: false },
  { key: "country", label: "Country", required: false },
  { key: "educationLevel", label: "Highest education level", required: false },
  { key: "occupation", label: "Current occupation / status", required: false },
  { key: "employer", label: "School / institution / employer", required: false },
  { key: "programmeType", label: "Programme type", required: false },
  { key: "preferredSession", label: "Preferred session group (A–D)", required: false },
  { key: "hasLaptop", label: "Do you have laptop access? (yes/no)", required: false, boolean: true },
  { key: "hasInternet", label: "Do you have reliable internet? (yes/no)", required: false, boolean: true },
  { key: "basicComputerKnowledge", label: "Basic computer knowledge? (yes/no)", required: false, boolean: true },
  { key: "heardAbout", label: "How did you hear about SVL Training Academy?", required: false },
  { key: "motivation", label: "Why do you want to enroll?", required: false },
];
