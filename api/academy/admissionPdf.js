import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ACADEMY_KNOWLEDGE } from "./knowledge.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLACK = rgb(0.12, 0.16, 0.22);
const WHITE = rgb(1, 1, 1);

function sanitizeName(name) {
  return (
    String(name || "Student")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60) || "Student"
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function buildAdmissionFileName(studentName, date = todayISO()) {
  return `Admission_Letter_${sanitizeName(studentName)}_${date}.pdf`;
}

function resolveTemplatePath() {
  const candidates = [
    join(__dirname, "data", "admission_letter_master.pdf"),
    join(process.cwd(), "api/academy/data/admission_letter_master.pdf"),
    join(process.cwd(), "public/assets/academy/templates/admission_letter_master.pdf"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  throw new Error("Official admission letter template not found in assets.");
}

/** Tuition split: 40% / 30% / 30% */
export function calcInstallmentFees(courses = []) {
  const tuitionTotal = courses.reduce((sum, c) => sum + Number(c.tuition || 0), 0);
  const registrationTotal = courses.reduce((sum, c) => sum + Number(c.registrationFee || 0), 0);
  const first = Math.round(tuitionTotal * 0.4);
  const second = Math.round(tuitionTotal * 0.3);
  const third = Math.max(0, tuitionTotal - first - second);
  return { tuitionTotal, registrationTotal, first, second, third };
}

export function formatAdmissionReference(ref) {
  const raw = String(ref || "");
  const match = raw.match(/SVL-ACA-(\d{4})-(\d+)/i);
  if (match) return `SVL/ADM/${match[1]}/${match[2]}`;
  return raw.replace(/-/g, "/");
}

export function buildAdmissionMerge(enrollment, courses) {
  const fees = calcInstallmentFees(courses);
  const fullName = enrollment.full_name || "Applicant";
  const firstName = String(fullName).split(/\s+/)[0];
  const issueDate = new Date().toISOString().slice(0, 10);
  const regLabel = fees.registrationTotal > 0 ? `US$${fees.registrationTotal}` : "US$0";
  const tuitionLabel = fees.tuitionTotal > 0 ? `US$${fees.tuitionTotal}` : "See catalogue";

  return {
    issue_date: issueDate,
    reference_number: enrollment.reference_number,
    admission_ref: formatAdmissionReference(enrollment.reference_number),
    student_full_name: fullName,
    student_first_name: firstName,
    student_address: [enrollment.county, enrollment.country].filter(Boolean).join(", ") || "Liberia",
    city: enrollment.county || "",
    country: enrollment.country || "Liberia",
    student_id: enrollment.reference_number,
    program_courses: courses.map((c) => ({
      title: c.title,
      code: c.code,
      duration: c.duration,
      tuition: c.tuition,
      registrationFee: c.registrationFee,
      session: enrollment.preferred_session || c.sessionGroup || "TBC",
    })),
    study_mode: "100% Online (Live + Self-paced)",
    commencement_date: ACADEMY_KNOWLEDGE.cohort.classesBegin,
    registration_deadline: ACADEMY_KNOWLEDGE.cohort.enrollment,
    orientation_date: ACADEMY_KNOWLEDGE.cohort.orientation,
    orientation_time: "6:00 PM (GMT)",
    orientation_venue: "Online",
    registration_fee: regLabel,
    tuition_total: tuitionLabel,
    first_installment: `US$${fees.first}`,
    second_installment: `US$${fees.second}`,
    third_installment: `US$${fees.third}`,
    payment_schedule: `Pay registration fee ${regLabel} and tuition ${tuitionLabel} in 3 installments: 1st 40% (US$${fees.first}), 2nd 30% (US$${fees.second}), 3rd 30% (US$${fees.third}).`,
    director_name: "Solomon Borkai",
    director_title: "Director / General Manager",
    template_version: "official-master-overlay-v3",
  };
}

function wipe(page, x, y, w, h) {
  page.drawRectangle({
    x,
    y: y - 3,
    width: w,
    height: h,
    color: WHITE,
    borderWidth: 0,
  });
}

function fit(font, text, size, maxW) {
  let s = String(text || "—");
  while (font.widthOfTextAtSize(s, size) > maxW && s.length > 3) s = `${s.slice(0, -2)}…`;
  return s;
}

function write(page, font, x, y, text, size = 10, maxW = 300) {
  page.drawText(fit(font, text, size, maxW), { x, y, size, font, color: BLACK });
}

function wrapWrite(page, font, x, y, text, size, maxW, lineH = 12, maxLines = 3) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxW) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  const used = lines.slice(0, maxLines);
  used.forEach((ln, i) => write(page, font, x, y - i * lineH, ln, size, maxW));
  return used.length;
}

function formatCourses(merge) {
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return "See enrollment record";
  if (courses.length === 1) return `${courses[0].title} (${courses[0].code})`;
  return courses.map((c) => `${c.title} (${c.code})`).join("; ");
}

function formatDurations(merge) {
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return "See schedule";
  const unique = [...new Set(courses.map((c) => c.duration).filter(Boolean))];
  return unique.length === 1 ? unique[0] : courses.map((c) => `${c.code}: ${c.duration}`).join("; ");
}

/**
 * Fill the official SVL Training Academy admission letter from assets.
 * Coordinates measured from admission_letter_master.pdf text layer.
 */
export async function generateAdmissionPdf(merge) {
  const templateBytes = readFileSync(resolveTemplatePath());
  const pdf = await PDFDocument.load(templateBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page1 = pdf.getPages()[0];
  const page2 = pdf.getPages()[1];

  const fullName = merge.student_full_name || "Applicant";
  const firstName = merge.student_first_name || String(fullName).split(/\s+/)[0];
  const address = merge.student_address || "Liberia";
  const ref = merge.admission_ref || formatAdmissionReference(merge.reference_number);
  const studentId = merge.student_id || merge.reference_number || ref;
  const courseLabel = formatCourses(merge);
  const durationLabel = formatDurations(merge);
  const studyMode = merge.study_mode || "100% Online (Live + Self-paced)";
  const commence = merge.commencement_date || "See cohort schedule";
  const deadline = merge.registration_deadline || "As communicated by Admissions";
  const orientation = [merge.orientation_date, merge.orientation_time, merge.orientation_venue]
    .filter(Boolean)
    .join(" · ");
  const regFee = merge.registration_fee || "US$0";
  const firstPay = merge.first_installment || "—";
  const paymentLine =
    merge.payment_schedule ||
    `Pay the registration fee of ${regFee} and the first installment of tuition of ${firstPay}.`;

  // Header date / ref placeholders
  wipe(page1, 108, 614, 200, 14);
  write(page1, font, 111, 614, merge.issue_date || todayISO(), 10, 190);

  wipe(page1, 125, 597, 280, 14);
  write(page1, font, 129, 597, ref, 10, 270);

  // Address block
  wipe(page1, 76, 572, 430, 14);
  write(page1, font, 79, 572, fullName, 10, 420);
  wipe(page1, 76, 557, 430, 14);
  write(page1, font, 79, 557, address, 10, 420);

  // Dear line — cover entire "Dear [Applicant First Name],"
  wipe(page1, 76, 513, 320, 14);
  write(page1, font, 79, 513, `Dear ${firstName},`, 10, 300);

  // Details table value column (wipe all placeholder values)
  const valueX = 218;
  const valueW = 340;
  wipe(page1, valueX, 408, valueW, 14);
  write(page1, font, 220, 408, fullName, 10, 330);

  wipe(page1, valueX, 387, valueW, 14);
  write(page1, font, 220, 387, studentId, 10, 330);

  wipe(page1, valueX, 355, valueW, 28);
  wrapWrite(page1, font, 220, 366, courseLabel, courseLabel.length > 60 ? 8 : 9, 330, 11, 2);

  wipe(page1, valueX, 345, valueW, 14);
  write(page1, font, 220, 345, durationLabel, durationLabel.length > 50 ? 8 : 10, 330);

  wipe(page1, valueX, 324, valueW, 14);
  write(page1, font, 220, 324, studyMode, 9, 330);

  wipe(page1, valueX, 303, valueW, 14);
  write(page1, font, 220, 303, commence, 10, 330);

  wipe(page1, valueX, 282, valueW, 14);
  write(page1, font, 220, 282, deadline, 10, 330);

  // Terms: payment + orientation bullets
  wipe(page1, 110, 148, 460, 36);
  wrapWrite(page1, font, 113, 165, paymentLine, 8.5, 450, 11, 3);

  wipe(page1, 110, 108, 460, 28);
  wrapWrite(
    page1,
    font,
    113,
    118,
    `Attend the orientation session on ${orientation}.`,
    9,
    450,
    11,
    2
  );

  if (page2) {
    wipe(page2, 88, 417, 240, 14);
    write(page2, font, 92, 417, fullName, 10, 220);
    wipe(page2, 76, 398, 340, 14);
    write(page2, font, 79, 398, fit(font, courseLabel, 9, 320), 9, 320);
  }

  const bytes = await pdf.save();
  return {
    bytes: Buffer.from(bytes),
    fileName: buildAdmissionFileName(fullName, merge.issue_date || todayISO()),
    templateVersion: merge.template_version || "official-master-overlay-v3",
  };
}
