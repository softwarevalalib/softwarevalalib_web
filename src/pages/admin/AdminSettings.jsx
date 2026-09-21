import { useState } from "react";
import { changeAdminPassword, getStoredAdmin } from "../../utils/adminApi";

export default function AdminSettings() {
  const admin = getStoredAdmin();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setBusy(true);
    try {
      const data = await changeAdminPassword(currentPassword, newPassword);
      setMessage({ type: "success", text: data.message || "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Unable to update password." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your admin account security.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-display font-bold text-[#00274c]">Account</h2>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as <strong>{admin?.email}</strong>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="font-display font-bold text-[#00274c]">Reset password</h2>
        <p className="text-sm text-slate-500">
          Enter your current password, then choose a new one (minimum 8 characters).
        </p>

        <div>
          <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-semibold text-[#00274c]">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-sm font-semibold text-[#00274c]">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-[#00274c]">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]"
          />
        </div>

        {message.text ? (
          <p
            className={`rounded-xl px-4 py-3 text-sm ${
              message.type === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
            role="status"
          >
            {message.text}
          </p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
