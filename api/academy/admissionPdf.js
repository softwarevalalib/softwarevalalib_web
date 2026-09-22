import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

function coverAndWrite(page, font, { x, y, width, height, text, size = 10, maxWidth }) {
  page.drawRectangle({
    x,
    y: y - 2,
    width,
    height: height || size + 4,
    color: WHITE,
  });
  const value = String(text || "—");
  const limit = maxWidth || width - 4;
  let draw = value;
  while (font.widthOfTextAtSize(draw, size) > limit && draw.length > 3) {
    draw = `${draw.slice(0, -2)}…`;
  }
  page.drawText(draw, { x: x + 1, y, size, font, color: BLACK });
}

function formatCourses(merge) {
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return String(merge.program_courses_text || "See enrollment record");
  if (courses.length === 1) return `${courses[0].title} (${courses[0].code})`;
  return courses.map((c, i) => `${i + 1}. ${c.title} (${c.code})`).join(" · ");
}

function formatDurations(merge) {
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return String(merge.duration || "See course schedule");
  const unique = [...new Set(courses.map((c) => c.duration).filter(Boolean))];
  if (unique.length === 1) return unique[0];
  return courses.map((c) => `${c.code}: ${c.duration}`).join(" · ");
}

function formatRegistrationFee(merge) {
  if (merge.registration_fee) return String(merge.registration_fee);
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return "As confirmed by Admissions";
  const total = courses.reduce((sum, c) => sum + Number(c.registrationFee || 0), 0);
  return `US$${total}`;
}

function formatFirstInstallment(merge) {
  if (merge.first_installment) return String(merge.first_installment);
  const courses = Array.isArray(merge.program_courses) ? merge.program_courses : [];
  if (!courses.length) return "As confirmed by Admissions";
  const total = courses.reduce((sum, c) => sum + Number(c.tuition || 0), 0);
  return `US$${total} (tuition total — payment schedule confirmed by Admissions)`;
}

/**
 * Fill the official SVL Training Academy admission letter template
 * (public/assets/academy/templates/admission_letter_master.pdf).
 * Coordinates measured from the master PDF text layer.
 */
export async function generateAdmissionPdf(merge) {
  const templateBytes = readFileSync(resolveTemplatePath());
  const pdf = await PDFDocument.load(templateBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const page1 = pages[0];
  const page2 = pages[1];

  const fullName = merge.student_full_name || "Applicant";
  const firstName = merge.student_first_name || String(fullName).split(/\s+/)[0];
  const address = [merge.student_address, merge.city, merge.country].filter(Boolean).join(", ");
  const year = String(merge.issue_date || todayISO()).slice(0, 4);
  const ref = merge.reference_number || `SVL/ADM/${year}/000000`;
  const studentId = merge.student_id || ref;
  const courseLabel = formatCourses(merge);
  const durationLabel = formatDurations(merge);
  const studyMode = merge.study_mode || "100% Online (Live + Self-paced)";
  const commence = merge.commencement_date || "See cohort schedule";
  const deadline = merge.registration_deadline || "As communicated by Admissions";
  const orientation = [merge.orientation_date, merge.orientation_time, merge.orientation_venue]
    .filter(Boolean)
    .join(" · ") || "As communicated by Admissions";
  const regFee = formatRegistrationFee(merge);
  const firstPay = formatFirstInstallment(merge);

  // --- Page 1 overlays (pdf-lib origin = bottom-left, Letter 612x792) ---
  // Date: [Date of Issue]
  coverAndWrite(page1, font, { x: 110, y: 614.3, width: 220, text: merge.issue_date || todayISO(), size: 10 });
  // Ref. No.: SVL/ADM/[Year]/[Number]
  coverAndWrite(page1, font, { x: 128, y: 597.5, width: 260, text: ref, size: 10 });
  // Address block
  coverAndWrite(page1, font, { x: 79, y: 572.2, width: 360, text: fullName, size: 10 });
  coverAndWrite(page1, font, { x: 79, y: 557.2, width: 400, text: address || "Liberia", size: 10 });
  // Dear [Applicant First Name],
  coverAndWrite(page1, font, { x: 79, y: 513.4, width: 260, text: `Dear ${firstName},`, size: 10 });

  // Details table value column (~x 220)
  coverAndWrite(page1, font, { x: 218, y: 408.2, width: 300, text: fullName, size: 10 });
  coverAndWrite(page1, font, { x: 218, y: 387.2, width: 300, text: studentId, size: 10 });
  coverAndWrite(page1, font, {
    x: 218,
    y: 366.4,
    width: 300,
    text: courseLabel,
    size: courseLabel.length > 70 ? 8 : 10,
  });
  coverAndWrite(page1, font, {
    x: 218,
    y: 345.4,
    width: 300,
    text: durationLabel,
    size: durationLabel.length > 60 ? 8 : 10,
  });
  coverAndWrite(page1, font, { x: 218, y: 324.4, width: 300, text: studyMode, size: 10 });
  coverAndWrite(page1, font, { x: 218, y: 303.5, width: 300, text: commence, size: 10 });
  coverAndWrite(page1, font, { x: 218, y: 282.5, width: 300, text: deadline, size: 10 });

  // Terms line with fee amounts
  coverAndWrite(page1, font, {
    x: 113,
    y: 164.5,
    width: 420,
    text: `Pay the registration fee of ${regFee} and the first installment of tuition of ${firstPay}.`,
    size: 9,
  });
  // Orientation
  coverAndWrite(page1, font, {
    x: 113,
    y: 118.1,
    width: 420,
    text: `Attend the orientation session on ${orientation}.`,
    size: 9,
  });

  // --- Page 2 acceptance slip name/program lines ---
  if (page2) {
    coverAndWrite(page2, font, {
      x: 90,
      y: 417.2,
      width: 220,
      text: fullName,
      size: 10,
    });
    coverAndWrite(page2, font, {
      x: 79,
      y: 397.7,
      width: 320,
      text: courseLabel.length > 55 ? `${courseLabel.slice(0, 52)}…` : courseLabel,
      size: 9,
    });
  }

  const bytes = await pdf.save();
  return {
    bytes: Buffer.from(bytes),
    fileName: buildAdmissionFileName(fullName, merge.issue_date || todayISO()),
    templateVersion: merge.template_version || "official-master-v1",
  };
}
