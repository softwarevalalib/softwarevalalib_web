import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminLogin, getAdminToken } from "../utils/adminApi";
import { useEffect } from "react";

export default function AcademyLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Admin Login | SVL Training Academy";
    if (getAdminToken()) navigate("/academy/admin", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await adminLogin(email.trim(), password);
      navigate("/academy/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center section-padding">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c10020]">
          SVL Training Academy
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-[#00274c]">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with your academy admin email and password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <div>
            <label htmlFor="adminEmail" className="mb-1.5 block text-sm font-semibold text-[#00274c]">
              Email
            </label>
            <input
              id="adminEmail"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020] focus:ring-1 focus:ring-[#c10020]/30"
            />
          </div>
          <div>
            <label htmlFor="adminPassword" className="mb-1.5 block text-sm font-semibold text-[#00274c]">
              Password
            </label>
            <input
              id="adminPassword"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020] focus:ring-1 focus:ring-[#c10020]/30"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
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
        </p>
      </div>
    </div>
  );
}
