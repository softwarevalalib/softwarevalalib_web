import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAttribution } from "../utils/attribution";

const NEEDS = [
  "Website",
  "Custom Software",
  "Management System",
  "Mobile App",
  "E-Commerce",
  "Digital Marketing",
  "Hosting",
  "Cloud",
  "Cybersecurity",
  "Networking",
  "CCTV",
  "Business Email",
  "Not Sure",
];

const BUDGETS = [
  "Under $500",
  "$500-$1,000",
  "$1,001-$3,000",
  "$3,001-$5,000",
  "$5,000+",
  "Need Consultation",
];

const METHODS = ["Phone", "WhatsApp", "Email", "Meeting"];

const NEED_ALIASES = {
  "Website development": "Website",
  "Custom software": "Custom Software",
  "Management systems": "Management System",
  "E-commerce": "E-Commerce",
  "Mobile app development": "Mobile App",
  "Digital marketing": "Digital Marketing",
  SEO: "Digital Marketing",
  "Web hosting": "Hosting",
  Maintenance: "Hosting",
  "Business email": "Business Email",
  Cybersecurity: "Cybersecurity",
  Networking: "Networking",
  CCTV: "CCTV",
};

function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-[#00274c]">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]";

export default function Consultation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preset = NEED_ALIASES[params.get("need") || ""] || "";
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    whatsapp: "",
    location: "",
    industry: "",
    servicesInterested: preset ? [preset] : [],
    businessChallenge: "",
    budgetRange: "",
    preferredContactMethod: "",
    website: "",
  });

  const steps = useMemo(
    () => ["Organization", "What you need", "Your challenge", "Budget", "Contact method", "Review"],
    [],
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleNeed = (need) => {
    setForm((f) => {
      const has = f.servicesInterested.includes(need);
      return {
        ...f,
        servicesInterested: has
          ? f.servicesInterested.filter((n) => n !== need)
          : [...f.servicesInterested, need],
      };
    });
  };

  const validate = () => {
    if (step === 0) {
      if (form.companyName.trim().length < 2) return "Enter the organization name.";
      if (form.contactName.trim().length < 2) return "Enter the contact person.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email.";
      if (!form.phone.trim() && !form.whatsapp.trim()) return "Enter a phone or WhatsApp number.";
    }
    if (step === 1 && !form.servicesInterested.length) return "Select at least one need.";
    if (step === 2 && form.businessChallenge.trim().length < 10) {
      return "Describe the challenge in a few sentences.";
    }
    if (step === 4 && !form.preferredContactMethod) return "Choose how we should contact you.";
    return "";
  };

  const next = () => {
    const message = validate();
    setError(message);
    if (!message) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const submit = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    setError("");
    const attribution = getAttribution();
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, source: "Website", ...attribution }),
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
    <section className="section-padding bg-slate-50 min-h-[70vh]">
      <div className="section-container max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">Consultation</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-[#00274c]">
          Let&apos;s understand what your business needs.
        </h1>
        <p className="mt-3 text-slate-600">
          Step {step + 1} of {steps.length}: {steps[step]}
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
          {step === 0 ? (
            <>
              <Field label="Business / organization name">
                <input className={inputClass} value={form.companyName} onChange={set("companyName")} required />
              </Field>
              <Field label="Contact person">
                <input className={inputClass} value={form.contactName} onChange={set("contactName")} required />
              </Field>
              <Field label="Email">
                <input type="email" className={inputClass} value={form.email} onChange={set("email")} required />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={form.phone} onChange={set("phone")} />
              </Field>
              <Field label="WhatsApp">
                <input className={inputClass} value={form.whatsapp} onChange={set("whatsapp")} />
              </Field>
              <Field label="Location">
                <input className={inputClass} value={form.location} onChange={set("location")} />
              </Field>
              <Field label="Industry">
                <input className={inputClass} value={form.industry} onChange={set("industry")} />
              </Field>
            </>
          ) : null}
          {step === 1 ? (
            <fieldset>
              <legend className="text-sm font-semibold text-[#00274c]">Select all that apply</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {NEEDS.map((need) => (
                  <label key={need} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.servicesInterested.includes(need)}
                      onChange={() => toggleNeed(need)}
                    />
                    {need}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {step === 2 ? (
            <Field label="Tell us about your challenge">
              <textarea className={inputClass} rows={6} value={form.businessChallenge} onChange={set("businessChallenge")} />
            </Field>
          ) : null}
          {step === 3 ? (
            <fieldset>
              <legend className="text-sm font-semibold text-[#00274c]">Budget range (optional)</legend>
              <div className="mt-3 space-y-2">
                {BUDGETS.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="budget"
                      checked={form.budgetRange === b}
                      onChange={() => setForm((f) => ({ ...f, budgetRange: b }))}
                    />
                    {b}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {step === 4 ? (
            <fieldset>
              <legend className="text-sm font-semibold text-[#00274c]">Preferred contact method</legend>
              <div className="mt-3 space-y-2">
                {METHODS.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="method"
                      checked={form.preferredContactMethod === m}
                      onChange={() => setForm((f) => ({ ...f, preferredContactMethod: m }))}
                    />
                    {m}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {step === 5 ? (
            <dl className="space-y-2 text-sm text-slate-700">
              <div><dt className="text-slate-500">Organization</dt><dd>{form.companyName}</dd></div>
              <div><dt className="text-slate-500">Contact</dt><dd>{form.contactName} · {form.email}</dd></div>
              <div><dt className="text-slate-500">Needs</dt><dd>{form.servicesInterested.join(", ")}</dd></div>
              <div><dt className="text-slate-500">Challenge</dt><dd>{form.businessChallenge}</dd></div>
            </dl>
          ) : null}
          <input
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={set("website")}
            aria-hidden="true"
          />
          {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
          <div className="flex gap-3 pt-2">
            {step > 0 ? (
              <button type="button" className="btn-outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            ) : null}
            {step < steps.length - 1 ? (
              <button type="button" className="btn-primary" onClick={next}>
                Continue
              </button>
            ) : (
              <button type="button" className="btn-primary" disabled={busy} onClick={submit}>
                {busy ? "Submitting…" : "Submit consultation"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
