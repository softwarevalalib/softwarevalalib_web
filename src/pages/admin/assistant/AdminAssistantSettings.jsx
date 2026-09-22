import { useEffect, useState } from "react";
import { getAdminToken } from "../../../utils/adminApi";

export default function AdminAssistantSettings() {
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/academy/assistant-admin?action=settings", {
      headers: { Accept: "application/json", Authorization: `Bearer ${getAdminToken()}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setSettings(data.settings);
      })
      .catch((err) => setError(err.message));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch("/api/academy/assistant-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify({ action: "update_settings", settings }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setSettings(data.settings);
    setMessage("Settings saved.");
  };

  if (!settings && !error) return <p className="text-slate-500">Loading settings…</p>;
  if (error && !settings) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Assistant settings</h1>
        <p className="mt-1 text-sm text-slate-500">Control greeting, admission letter timing, and support contacts.</p>
      </div>

      <form onSubmit={save} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <label className="flex items-center gap-3 text-sm font-semibold text-[#00274c]">
          <input
            type="checkbox"
            checked={!!settings.assistant_enabled}
            onChange={(e) => setSettings({ ...settings, assistant_enabled: e.target.checked })}
          />
          Assistant enabled
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-[#00274c]">
          <input
            type="checkbox"
            checked={!!settings.greeting_enabled}
            onChange={(e) => setSettings({ ...settings, greeting_enabled: e.target.checked })}
          />
          5-second greeting enabled
        </label>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#00274c]">Greeting delay (ms)</label>
          <input
            type="number"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            value={settings.greeting_delay_ms || 5000}
            onChange={(e) => setSettings({ ...settings, greeting_delay_ms: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#00274c]">Admission letter trigger</label>
          <select
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            value={settings.admission_letter_trigger || "after_admin_approval"}
            onChange={(e) => setSettings({ ...settings, admission_letter_trigger: e.target.value })}
          >
            <option value="immediately_after_valid_application">
              Immediately after valid application (letters auto-issued; no admin approval)
            </option>
            <option value="after_admin_approval">After admin approval (legacy — auto-issue still runs)</option>
            <option value="after_first_payment">After first payment confirmation (legacy — auto-issue still runs)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#00274c]">Human support email</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            value={settings.human_support_email || ""}
            onChange={(e) => setSettings({ ...settings, human_support_email: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#00274c]">Human support phone</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            value={settings.human_support_phone || ""}
            onChange={(e) => setSettings({ ...settings, human_support_phone: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#00274c]">Welcome message</label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            value={settings.welcome_message || ""}
            onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
          />
        </div>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="btn-primary">
          Save settings
        </button>
      </form>
    </div>
  );
}
