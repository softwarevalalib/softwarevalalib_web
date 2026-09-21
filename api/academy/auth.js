import {
  getSql,
  setCors,
  cleanText,
  verifyPassword,
  hashPassword,
  ensureAdminBootstrap,
  createSession,
  requireAdmin,
  parseBody,
  getBearerToken,
} from "./_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const sql = getSql();
    const url = new URL(req.url || "", "http://localhost");
    const action = cleanText(url.searchParams.get("action") || "", 40) || "login";

    if (req.method === "GET" && (action === "me" || action === "session")) {
      const admin = await requireAdmin(req, sql);
      if (!admin) return res.status(401).json({ error: "Unauthorized" });
      return res.status(200).json({ admin });
    }

    if (req.method === "POST" && action === "logout") {
      const token = getBearerToken(req);
      if (token) {
        await sql`DELETE FROM academy_admin_sessions WHERE token = ${token}`;
      }
      return res.status(200).json({ ok: true });
    }

    if (req.method === "POST" && action === "change-password") {
      const admin = await requireAdmin(req, sql);
      if (!admin) return res.status(401).json({ error: "Unauthorized" });

      const body = parseBody(req);
      const currentPassword = String(body.currentPassword || "");
      const newPassword = String(body.newPassword || "");

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters." });
      }

      const rows = await sql`
        SELECT password_hash FROM academy_admins WHERE id = ${admin.id} LIMIT 1
      `;
      if (!verifyPassword(currentPassword, rows[0]?.password_hash)) {
        return res.status(400).json({ error: "Current password is incorrect." });
      }

      await sql`
        UPDATE academy_admins
        SET password_hash = ${hashPassword(newPassword)}, updated_at = NOW()
        WHERE id = ${admin.id}
      `;

      // Invalidate other sessions except current
      const token = getBearerToken(req);
      if (token) {
        await sql`
          DELETE FROM academy_admin_sessions
          WHERE admin_id = ${admin.id} AND token <> ${token}
        `;
      }

      return res.status(200).json({ ok: true, message: "Password updated successfully." });
    }

    if (req.method === "POST" && (action === "login" || !action || action === "")) {
      await ensureAdminBootstrap(sql);
      const body = parseBody(req);
      if (body.website) return res.status(200).json({ ok: true });

      const email = cleanText(body.email, 120).toLowerCase();
      const password = String(body.password || "");

      if (!email.includes("@") || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const rows = await sql`
        SELECT id, email, name, password_hash
        FROM academy_admins
        WHERE email = ${email}
        LIMIT 1
      `;
      const row = rows[0];
      if (!row || !verifyPassword(password, row.password_hash)) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const session = await createSession(sql, row.id);
      return res.status(200).json({
        token: session.token,
        expiresAt: session.expiresAt,
        admin: { id: row.id, email: row.email, name: row.name || "Admin" },
      });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("academy auth error:", error);
    const message =
      error?.message?.includes("ACADEMY_ADMIN")
        ? error.message
        : "Unable to process authentication request.";
    return res.status(500).json({ error: message });
  }
}
