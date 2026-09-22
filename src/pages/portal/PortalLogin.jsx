import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { portalLogin } from "../../utils/portalApi";

export default function PortalLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await portalLogin(username, password);
      if (data.user.role === "instructor") navigate("/academy/portal/instructor", { replace: true });
      else navigate("/academy/portal/student", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">SVL Training Academy</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-[#00274c]">Portal Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Students: enrollment email + password <span className="font-mono text-xs">SVL</span> + last name.
          Instructors use the username and password issued by Admin.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-[#00274c]">
            Email (students) or username (instructors)
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-semibold text-[#00274c]">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/academy" className="font-semibold text-[#00274c] hover:underline">
            Back to Academy
          </Link>
          {" · "}
          <Link to="/academy/login" className="font-semibold text-[#00274c] hover:underline">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}
