import { useCallback, useEffect, useState } from "react";
import { portalAdmin } from "../../../utils/portalApi";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#c10020]";

export default function AdminPortalInstructors() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", username: "", password: "" });
  const [creds, setCreds] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await portalAdmin("list-users", { role: "instructor" }, "GET");
    setUsers(data.users || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await portalAdmin("create-user", { role: "instructor", ...form });
      setCreds(data.credentials);
      setForm({ fullName: "", email: "", phone: "", username: "", password: "" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Instructors</h1>
        <p className="text-sm text-slate-500">Create instructor accounts and assign portal login credentials.</p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {creds ? (
        <div className="rounded-xl border border-[#00274c]/20 bg-[#00274c]/5 p-4 text-sm">
          <p className="font-bold text-[#00274c]">Instructor credentials</p>
          <p>
            Username: <code className="font-mono">{creds.username}</code>
          </p>
          <p>
            Password: <code className="font-mono">{creds.password}</code>
          </p>
        </div>
      ) : null}

      <form onSubmit={create} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2">
        {[
          ["fullName", "Full name"],
          ["email", "Email"],
          ["phone", "Phone"],
          ["username", "Username (optional)"],
          ["password", "Password (optional, min 8)"],
        ].map(([key, label]) => (
          <label key={key} className="text-sm font-semibold text-[#00274c]">
            {label}
            <input
              className={field}
              type={key === "password" ? "password" : "text"}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={key === "fullName" || key === "email"}
            />
          </label>
        ))}
        <button type="submit" className="btn-primary sm:col-span-2 !py-2" disabled={busy}>
          Create instructor
        </button>
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Username</th>
              <th className="pb-2">Email</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-3 font-semibold text-[#00274c]">{u.full_name}</td>
                <td className="py-3 font-mono text-xs">{u.username}</td>
                <td className="py-3">{u.email}</td>
                <td className="py-3">
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600 underline"
                    onClick={async () => {
                      if (!window.confirm("Delete instructor?")) return;
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
        {!users.length ? <p className="text-sm text-slate-500">No instructors yet.</p> : null}
      </div>
    </div>
  );
}
