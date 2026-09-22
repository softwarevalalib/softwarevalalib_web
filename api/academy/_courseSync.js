import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadCatalogueCourses() {
  const path = join(__dirname, "data", "courses.json");
  if (!existsSync(path)) return [];
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(raw) ? raw : raw.courses || [];
  } catch {
    return [];
  }
}

/** Insert any catalogue courses missing from portal DB (does not overwrite admin edits). */
export async function syncCatalogueIntoPortal(sql) {
  const catalogue = loadCatalogueCourses();
  let inserted = 0;
  for (const c of catalogue) {
    const code = String(c.code || "").trim();
    const title = String(c.title || "").trim();
    if (!code || !title) continue;
    const result = await sql`
      INSERT INTO academy_portal_courses (
        code, title, description, long_description, duration, tuition, registration_fee,
        category, level, slug, image, programme_type, status
      ) VALUES (
        ${code},
        ${title},
        ${c.description || null},
        ${c.longDescription || c.description || null},
        ${c.duration || null},
        ${Number(c.tuition) || 0},
        ${Number(c.registrationFee) || 0},
        ${c.category || c.categoryFilter || null},
        ${c.level || null},
        ${c.slug || null},
        ${c.image || null},
        ${c.programmeType || null},
        ${c.status === "draft" ? "inactive" : "active"}
      )
      ON CONFLICT (code) DO NOTHING
      RETURNING id
    `;
    if (result[0]) inserted += 1;
  }
  return { total: catalogue.length, inserted };
}

export function mapPortalCourseToPublic(row) {
  return {
    id: row.slug || row.code?.toLowerCase() || row.id,
    code: row.code,
    slug: row.slug || String(row.code || "").toLowerCase(),
    title: row.title,
    shortTitle: row.title,
    description: row.description || "",
    longDescription: row.long_description || row.description || "",
    category: row.category || "General",
    categoryFilter: row.category || "General",
    programmeType: row.programme_type || "Technology",
    level: row.level || "Professional",
    duration: row.duration || "",
    tuition: Number(row.tuition) || 0,
    registrationFee: Number(row.registration_fee) || 0,
    currency: "USD",
    image: row.image || "/assets/academy/courses/certificate.svg",
    imageAlt: `${row.title} course flyer`,
    featured: false,
    popular: false,
    status: row.status === "active" ? "published" : "draft",
    learningOutcomes: [],
    requirements: [],
    tools: [],
    sessionGroup: "A",
  };
}
