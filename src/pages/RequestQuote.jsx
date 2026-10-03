import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAttribution } from "../utils/attribution";
import { trackAction } from "../utils/trackAction";

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]";

export default function RequestQuote() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    service: "Custom Software",
    businessChallenge: "",
    timeline: "",
    budgetRange: "Need Consultation",
    preferredContactMethod: "Email",
    website: "",
  });

  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    trackAction("request_quote_submit", "/request-quote");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          action: "quote",
          ...form,
          servicesInterested: [form.service],
          source: "Website",
          ...getAttribution(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to submit.");
      navigate(`/thank-you?ref=${encodeURIComponent(data.leadNumber || "")}`, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to submit.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section-padding bg-slate-50">
      <div className="section-container max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">Quotation</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#00274c]">Request a quote</h1>
        <p className="mt-3 text-slate-600">Custom software and enterprise systems are quoted from the requirements you describe. This form does not accept file uploads; send documents on WhatsApp or email after you receive your reference number.</p>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <label className="block text-sm font-semibold text-[#00274c]">Organization<input className={inputClass} value={form.companyName} onChange={set("companyName")} required /></label>
          <label className="block text-sm font-semibold text-[#00274c]">Contact person<input className={inputClass} value={form.contactName} onChange={set("contactName")} required /></label>
          <label className="block text-sm font-semibold text-[#00274c]">Email<input type="email" className={inputClass} value={form.email} onChange={set("email")} required /></label>
          <label className="block text-sm font-semibold text-[#00274c]">Phone or WhatsApp<input className={inputClass} value={form.phone} onChange={set("phone")} required /></label>
          <label className="block text-sm font-semibold text-[#00274c]">Service
            <select className={inputClass} value={form.service} onChange={set("service")}>
              {["Website", "Custom Software", "Management System", "Mobile App", "E-Commerce", "Digital Marketing", "Hosting", "Cloud", "Cybersecurity", "Networking", "CCTV", "Business Email", "Not Sure"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#00274c]">Project description<textarea className={inputClass} rows={5} value={form.businessChallenge} onChange={set("businessChallenge")} required /></label>
          <label className="block text-sm font-semibold text-[#00274c]">Expected timeline<input className={inputClass} value={form.timeline} onChange={set("timeline")} /></label>
          <label className="block text-sm font-semibold text-[#00274c]">Budget range
            <select className={inputClass} value={form.budgetRange} onChange={set("budgetRange")}>
              {["Under $500", "$500-$1,000", "$1,001-$3,000", "$3,001-$5,000", "$5,000+", "Need Consultation"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#00274c]">Preferred contact
            <select className={inputClass} value={form.preferredContactMethod} onChange={set("preferredContactMethod")}>
              {["Phone", "WhatsApp", "Email", "Meeting"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <input className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} aria-hidden="true" />
          {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Submitting…" : "Request a quote"}</button>
        </form>
      </div>
    </section>
  );
}
