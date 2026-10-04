export function managementTarget(env = process.env) {
  const base = String(env.SVL_MANAGEMENT_URL || "").trim().replace(/\/$/, "");
  const key = String(env.INTEGRATION_API_KEY || "").trim();
  if (!base || !key) return null;
  return { base, key };
}

export async function forwardToManagement(path, body) {
  const target = managementTarget();
  if (!target) return { skipped: true };
  try {
    const response = await fetch(`${target.base}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${target.key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) console.error("management sync failed", path, response.status);
    return { skipped: false, ok: response.ok };
  } catch {
    console.error("management sync failed", path);
    return { skipped: false, ok: false };
  }
}

export async function forwardEnrollment(enrollment, phone) {
  let codes = enrollment?.course_codes;
  if (typeof codes === "string") {
    try { codes = JSON.parse(codes); } catch { codes = []; }
  }
  const list = Array.isArray(codes) ? codes : [];
  const courseSlug = String(list[0] || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!courseSlug || !enrollment?.reference_number) return { skipped: true };
  const parts = String(enrollment.full_name || "").trim().split(/\s+/);
  return forwardToManagement("/api/v1/public/enrollments", {
    eventId: enrollment.reference_number,
    studentReference: enrollment.reference_number,
    firstName: parts[0] || "Student",
    lastName: parts.slice(1).join(" ") || "Applicant",
    email: enrollment.email,
    phone: phone || "",
    courseSlug,
  });
}
