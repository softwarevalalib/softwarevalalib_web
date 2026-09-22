import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ACADEMY_KNOWLEDGE } from "./knowledge.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const NAVY = rgb(0, 0.153, 0.298); // #00274c
const RED = rgb(0.757, 0, 0.125); // #c10020
const BLACK = rgb(0.12, 0.16, 0.22);
const GRAY = rgb(0.45, 0.48, 0.52);
const WHITE = rgb(1, 1, 1);
const LINE = rgb(0.85, 0.88, 0.91);

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

  const regLabel =
    fees.registrationTotal > 0
      ? `US$${fees.registrationTotal}${courses.length > 1 ? " (combined registration)" : ""}`
      : "As listed for your programme";

  const tuitionLabel = fees.tuitionTotal > 0 ? `US$${fees.tuitionTotal}` : "See course catalogue";

  const installmentText =
    fees.tuitionTotal > 0
      ? `Tuition ${tuitionLabel} is payable in three installments: 1st payment 40% (US$${fees.first}), 2nd payment 30% (US$${fees.second}), and final payment 30% (US$${fees.third}). Registration fee: ${regLabel}.`
      : "Tuition installment schedule confirmed by Admissions.";

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
    orientation_venue: "Online (link shared before orientation)",
    registration_fee: regLabel,
    tuition_total: tuitionLabel,
    tuition_fee: tuitionLabel,
    first_installment: `US$${fees.first} (40%)`,
    second_installment: `US$${fees.second} (30%)`,
    third_installment: `US$${fees.third} (30%)`,
    payment_schedule: installmentText,
    director_name: "Solomon Borkai",
    director_title: "Director / General Manager",
    template_version: "svl-generated-v3",
  };
}

function formatCourses(merge) {
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return "See enrollment record";
  if (courses.length === 1) return `${courses[0].title} (${courses[0].code})`;
  return courses.map((c, i) => `${i + 1}. ${c.title} (${c.code})`).join("\n");
}

function formatDurations(merge) {
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return "See course schedule";
  const unique = [...new Set(courses.map((c) => c.duration).filter(Boolean))];
  if (unique.length === 1) return unique[0];
  return courses.map((c) => `${c.code}: ${c.duration}`).join("; ");
}

function formatCourseFees(merge) {
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return merge.tuition_total || "—";
  if (courses.length === 1) {
    const c = courses[0];
    return `Tuition US$${c.tuition || 0}${c.registrationFee ? ` + Registration US$${c.registrationFee}` : ""}`;
  }
  return courses
    .map((c) => `${c.code}: Tuition US$${c.tuition || 0}${c.registrationFee ? ` + Reg. US$${c.registrationFee}` : ""}`)
    .join("; ");
}

function wrapLines(font, text, size, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawTableRow(page, font, bold, { label, value, y, xLabel = 72, xValue = 220, width = 468 }) {
  page.drawText(label, { x: xLabel, y, size: 10, font: bold, color: NAVY });
  const lines = wrapLines(font, value, 10, width - (xValue - xLabel));
  lines.slice(0, 3).forEach((ln, i) => {
    page.drawText(ln, { x: xValue, y: y - i * 12, size: 10, font, color: BLACK });
  });
  page.drawLine({ start: { x: xLabel, y: y - 14 }, end: { x: xLabel + width, y: y - 14 }, thickness: 0.5, color: LINE });
  return y - 14 - Math.max(0, lines.length - 1) * 12;
}

/**
 * Generate a clean SVL Training Academy admission letter PDF
 * with correct alignment, course fees, and 40/30/30 payment schedule.
 */
export async function generateAdmissionPdf(merge) {
  const useLegacyTemplate = process.env.ADMISSION_USE_LEGACY_TEMPLATE === "1";
  if (useLegacyTemplate) {
    return generateAdmissionPdfLegacyOverlay(merge);
  }
  return generateAdmissionPdfClean(merge);
}

async function generateAdmissionPdfClean(merge) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page1 = pdf.addPage([612, 792]);
  const page2 = pdf.addPage([612, 792]);
  const margin = 72;
  const fullName = merge.student_full_name || "Applicant";
  const firstName = merge.student_first_name || String(fullName).split(/\s+/)[0];
  const ref = merge.admission_ref || formatAdmissionReference(merge.reference_number);
  const courseLabel = formatCourses(merge);
  const feesLabel = formatCourseFees(merge);
  const paymentLine = merge.payment_schedule || "";

  // --- Page 1 header ---
  page1.drawRectangle({ x: 0, y: 752, width: 612, height: 40, color: NAVY });
  page1.drawText("SVL TRAINING ACADEMY", { x: margin, y: 765, size: 14, font: bold, color: WHITE });
  page1.drawText("Software Vala Liberia", { x: margin, y: 752, size: 9, font, color: rgb(0.85, 0.88, 0.95) });
  page1.drawText("LETTER OF ADMISSION — ONLINE", { x: 330, y: 758, size: 11, font: bold, color: WHITE });

  let y = 720;
  page1.drawText(`Date: ${merge.issue_date || todayISO()}`, { x: margin, y, size: 10, font, color: BLACK });
  y -= 16;
  page1.drawText(`Ref. No.: ${ref}`, { x: margin, y, size: 10, font, color: BLACK });
  y -= 24;
  page1.drawText(fullName, { x: margin, y, size: 10, font: bold, color: BLACK });
  y -= 14;
  page1.drawText(merge.student_address || "Liberia", { x: margin, y, size: 10, font, color: BLACK });
  y -= 28;
  page1.drawText(`Dear ${firstName},`, { x: margin, y, size: 10, font, color: BLACK });
  y -= 18;

  const intro =
    "Congratulations! On behalf of the management and staff of SVL Training Academy, we are pleased to inform you that your application has been reviewed and you have been offered admission into the programme stated below.";
  for (const ln of wrapLines(font, intro, 10, 468)) {
    page1.drawText(ln, { x: margin, y, size: 10, font, color: BLACK });
    y -= 14;
  }
  y -= 10;

  page1.drawText("Admission Details", { x: margin, y, size: 11, font: bold, color: RED });
  y -= 18;
  page1.drawLine({ start: { x: margin, y }, end: { x: margin + 468, y }, thickness: 1, color: NAVY });
  y -= 16;

  y = drawTableRow(page1, font, bold, { label: "Student Name", value: fullName, y });
  y -= 4;
  y = drawTableRow(page1, font, bold, { label: "Student ID / Ref.", value: merge.student_id || ref, y });
  y -= 4;
  y = drawTableRow(page1, font, bold, { label: "Program / Course", value: courseLabel.replace(/\n/g, "; "), y });
  y -= 4;
  y = drawTableRow(page1, font, bold, { label: "Duration", value: formatDurations(merge), y });
  y -= 4;
  y = drawTableRow(page1, font, bold, { label: "Mode of Study", value: merge.study_mode, y });
  y -= 4;
  y = drawTableRow(page1, font, bold, { label: "Commencement Date", value: merge.commencement_date, y });
  y -= 4;
  y = drawTableRow(page1, font, bold, { label: "Registration Deadline", value: merge.registration_deadline, y });
  y -= 4;
  y = drawTableRow(page1, font, bold, { label: "Course Fees", value: feesLabel, y });
  y -= 16;

  page1.drawText("Terms of Enrollment", { x: margin, y, size: 11, font: bold, color: RED });
  y -= 16;
  const terms = [
    "Confirm your acceptance by signing and returning the acceptance slip on page 2.",
    paymentLine,
    "Submit copies of your academic certificates, a valid national ID, and two passport-size photographs.",
    `Attend orientation on ${[merge.orientation_date, merge.orientation_time, merge.orientation_venue].filter(Boolean).join(" · ")}.`,
    "This offer will lapse if fees are not paid by the registration deadline.",
  ];
  for (const term of terms) {
    for (const ln of wrapLines(font, term, 9.5, 450)) {
      page1.drawText(`•  ${ln}`, { x: margin + 8, y, size: 9.5, font, color: BLACK });
      y -= 13;
    }
    y -= 4;
  }

  // --- Page 2 ---
  page2.drawRectangle({ x: 0, y: 752, width: 612, height: 40, color: NAVY });
  page2.drawText("SVL TRAINING ACADEMY — ADMISSION (continued)", { x: margin, y: 762, size: 11, font: bold, color: WHITE });

  y = 700;
  page2.drawText("Should you have any questions, contact Admissions at info@softwarevalalib.app.", {
    x: margin,
    y,
    size: 10,
    font,
    color: BLACK,
  });
  y -= 40;
  page2.drawText("Yours sincerely,", { x: margin, y, size: 10, font, color: BLACK });
  y -= 36;
  page2.drawLine({ start: { x: margin, y: y + 10 }, end: { x: margin + 180, y: y + 10 }, thickness: 0.5, color: BLACK });
  y -= 6;
  page2.drawText(merge.director_name || "Solomon Borkai", { x: margin, y, size: 10, font: bold, color: BLACK });
  y -= 14;
  page2.drawText(merge.director_title || "Director / General Manager", { x: margin, y, size: 10, font, color: GRAY });
  y -= 14;
  page2.drawText("SVL Training Academy", { x: margin, y, size: 10, font, color: GRAY });

  y -= 40;
  page2.drawText("ACCEPTANCE SLIP", { x: margin, y, size: 12, font: bold, color: RED });
  y -= 24;
  page2.drawText(`I, ${fullName}, hereby accept the offer of admission into the`, { x: margin, y, size: 10, font, color: BLACK });
  y -= 14;
  const progLine = `${courseLabel.replace(/\n/g, "; ")} programme at SVL Training Academy and agree to abide by its rules and regulations.`;
  for (const ln of wrapLines(font, progLine, 10, 468)) {
    page2.drawText(ln, { x: margin, y, size: 10, font, color: BLACK });
    y -= 14;
  }
  y -= 24;
  page2.drawText("Signature: ________________________________", { x: margin, y, size: 10, font, color: BLACK });
  page2.drawText(`Date: ${merge.issue_date || todayISO()}`, { x: 340, y, size: 10, font, color: BLACK });

  page2.drawText("info@softwarevalalib.app  |  www.softwarevalalib.app", {
    x: margin,
    y: 48,
    size: 8,
    font,
    color: GRAY,
  });

  const bytes = await pdf.save();
  return {
    bytes: Buffer.from(bytes),
    fileName: buildAdmissionFileName(fullName, merge.issue_date || todayISO()),
    templateVersion: merge.template_version || "svl-generated-v3",
  };
}

/** Legacy template overlay — opt-in via ADMISSION_USE_LEGACY_TEMPLATE=1 */
async function generateAdmissionPdfLegacyOverlay(merge) {
  const templatePath = [
    join(__dirname, "data", "admission_letter_master.pdf"),
    join(process.cwd(), "public/assets/academy/templates/admission_letter_master.pdf"),
  ].find((p) => existsSync(p));
  if (!templatePath) return generateAdmissionPdfClean(merge);

  const templateBytes = readFileSync(templatePath);
  const pdf = await PDFDocument.load(templateBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page1 = pdf.getPages()[0];
  const fullName = merge.student_full_name || "Applicant";
  page1.drawText(fullName, { x: 220, y: 408, size: 10, font, color: BLACK });

  const bytes = await pdf.save();
  return {
    bytes: Buffer.from(bytes),
    fileName: buildAdmissionFileName(fullName, merge.issue_date || todayISO()),
    templateVersion: "official-master-legacy",
  };
}
