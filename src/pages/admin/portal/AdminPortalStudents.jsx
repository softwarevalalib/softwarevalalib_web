import { useCallback, useEffect, useState } from "react";
import { portalAdmin } from "../../../utils/portalApi";
import { fetchEnrollments } from "../../../utils/adminApi";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#c10020]";

export default function AdminPortalStudents() {
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [creds, setCreds] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [u, e] = await Promise.all([
      portalAdmin("list-users", { role: "student" }, "GET"),
      fetchEnrollments(),
    ]);
    setUsers(u.users || []);
    setPending((e.enrollments || []).filter((r) => r.status === "pending"));
  }, []);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const approve = async (enrollment) => {
    setBusy(true);
    setError("");
    setMessage("");
    setCreds(null);
    try {
      const data = await portalAdmin("approve-enrollment", { enrollmentId: enrollment.id });
      setCreds(data.credentials);
      setMessage(`Approved ${enrollment.full_name}. Share credentials securely.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPw = async (userId) => {
    setBusy(true);
    try {
      const data = await portalAdmin("reset-password", { userId });
      setCreds(data.credentials);
      setMessage("Password reset. Share the new password with the student.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Portal Students</h1>
        <p className="text-sm text-slate-500">
          Approve pending applications to create portal logins. Students sign in with their enrollment
          email and password <code className="font-mono text-xs">SVL</code> + last name (e.g. Jane Doe →{" "}
          <code className="font-mono text-xs">SVLDoe</code>).
        </p>
      </div>

      {error ? <Alert tone="red">{error}</Alert> : null}
      {message ? <Alert tone="green">{message}</Alert> : null}
      {creds ? (
        <div className="rounded-xl border border-[#00274c]/20 bg-[#00274c]/5 p-4 text-sm">
          <p className="font-bold text-[#00274c]">Login credentials</p>
          <p>
            Email / username: <code className="font-mono">{creds.username}</code>
          </p>
          <p>
            Password: <code className="font-mono">{creds.password}</code>
          </p>
          {creds.note ? <p className="mt-1 text-xs text-slate-600">{creds.note}</p> : null}
          <p className="mt-1 text-xs text-slate-500">
            Portal login: /academy/portal/login — student should change password after first login.
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="font-display font-bold text-[#00274c]">Pending enrollments</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2">Applicant</th>
                <th className="pb-2">Courses</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="py-3">
                    <p className="font-semibold text-[#00274c]">{row.full_name}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                    <p className="text-xs text-[#c10020]">{row.reference_number}</p>
                  </td>
                  <td className="py-3 text-xs">
                    {(Array.isArray(row.course_codes) ? row.course_codes : []).join(", ")}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      className="rounded-full bg-[#c10020] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      disabled={busy}
                      onClick={() => approve(row)}
                    >
                      Approve & create login
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pending.length ? <p className="text-sm text-slate-500 mt-2">No pending enrollments.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="font-display font-bold text-[#00274c]">Active portal students</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Username</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-3">
                    <p className="font-semibold text-[#00274c]">{u.full_name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="py-3 font-mono text-xs">{u.username}</td>
                  <td className="py-3 capitalize">{u.status}</td>
                  <td className="py-3 space-x-2">
                    <button
                      type="button"
                      className="text-xs font-bold text-[#00274c] underline"
                      disabled={busy}
                      onClick={() => resetPw(u.id)}
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      className="text-xs font-bold text-red-600 underline"
                      disabled={busy}
                      onClick={async () => {
                        if (!window.confirm("Delete this portal user?")) return;
                        await portalAdmin("delete-user", { userId: u.id });
                        await load();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length ? <p className="text-sm text-slate-500 mt-2">No portal students yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

function Alert({ tone, children }) {
  const cls =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <p className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</p>;
}

export { field };
