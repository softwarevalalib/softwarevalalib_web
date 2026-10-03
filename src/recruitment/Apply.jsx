import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAttribution } from "../utils/attribution";
import { sendToCompany } from "../utils/sendEmail";
import { trackAction } from "../utils/trackAction";
import { CLOSED_MESSAGE, DRAFT_KEY, recruitmentState } from "./config";

const EMPTY = {
  fullName: "", phone: "", whatsapp: "", email: "", county: "", cityArea: "", is18OrOlder: "",
  professionalStatus: "", occupation: "", organization: "", educationLevel: "", professionalBackground: "",
  experienceCategories: [], experienceDescription: "", networkSectors: [], preferredSectors: [], networkDescription: "",
  outreachMethods: [], scenarioSchoolResponse: "", scenarioPricingResponse: "", scenarioWebsiteResponse: "",
  weeklyAvailability: "", availableForTraining: "", willingToReport: "", marketsOtherTechnologyCompany: "", conflictDetails: "",
  accurate: false, independent: false, noGuarantee: false, consent: false, noFee: false, website: "",
};
const STATUSES = ["Student", "Recent Graduate", "Employed", "Self-Employed", "Freelancer", "Entrepreneur", "Consultant", "Sales Professional", "Marketing Professional", "Other"];
const EXPERIENCE = ["Sales", "Marketing", "Business Development", "Customer Service", "Digital Marketing", "Social Media Marketing", "Client Acquisition", "Promotion", "Consulting", "Entrepreneurship", "Community Engagement", "No Formal Experience Yet", "Other"];
const SECTORS = ["Education", "Healthcare", "NGOs / Nonprofits", "Construction / Engineering", "Retail / E-Commerce", "SMEs", "Financial Services", "Microfinance", "Credit Unions", "Professional Services", "Hospitality", "Churches", "Associations", "Real Estate", "Logistics / Transportation", "Government / Public Institutions", "Other"];
const OUTREACH = ["Physical Business Visits", "Phone Calls", "WhatsApp", "Email", "LinkedIn", "Facebook", "Instagram", "Events", "Professional Referrals", "Community Networks", "Other"];
const HOURS = ["Less than 5", "5-10", "11-20", "21-30", "30+"];
const inputClass = "mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]";

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return { form: EMPTY, step: 1 };
    const parsed = JSON.parse(saved);
    return { form: { ...EMPTY, ...parsed.form, website: "" }, step: parsed.step || 1 };
  } catch {
    return { form: EMPTY, step: 1 };
  }
}

function toggle(list, value, max) {
  if (list.includes(value)) return list.filter((item) => item !== value);
  if (max && list.length >= max) return list;
  return [...list, value];
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

export default function Apply() {
  const navigate = useNavigate();
  const initial = loadDraft();
  const [step, setStep] = useState(initial.step);
  const [form, setForm] = useState(initial.form);
  const [resume, setResume] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const windowState = recruitmentState();
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    trackAction(windowState === "closed" ? "application_closed_view" : "application_started", "/apply");
  }, [windowState]);

  useEffect(() => {
    const draft = { ...form, website: "" };
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form: draft, step }));
  }, [form, step]);

  useEffect(() => {
    if (!siteKey) return undefined;
    window.svlTurnstile = (token) => setTurnstileToken(token);
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      delete window.svlTurnstile;
      script.remove();
    };
  }, [siteKey]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate(currentStep) {
    if (currentStep === 1) {
      if (form.fullName.trim().length < 3) return "Enter your full name.";
      if (digits(form.phone).length < 7 || digits(form.whatsapp).length < 7) return "Enter a valid phone and WhatsApp number.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
      if (!form.county.trim() || !form.cityArea.trim()) return "Enter your county and city or area.";
      if (form.is18OrOlder !== "yes") return "Applicants must be at least 18 years old.";
    }
    if (currentStep === 2) {
      if (!form.professionalStatus) return "Choose your professional status.";
      if (form.professionalBackground.trim().length < 20) return "Describe your professional background.";
    }
    if (currentStep === 3) {
      if (!form.experienceCategories.length) return "Select your experience.";
      if (!form.preferredSectors.length || form.preferredSectors.length > 3) return "Choose one to three preferred sectors.";
    }
    if (currentStep === 4) {
      if (!form.outreachMethods.length) return "Select at least one outreach method.";
      if ([form.scenarioSchoolResponse, form.scenarioPricingResponse, form.scenarioWebsiteResponse].some((value) => value.trim().length < 20)) {
        return "Answer each scenario in a few sentences.";
      }
    }
    if (currentStep === 5) {
      if (!form.weeklyAvailability) return "Choose your weekly availability.";
      if (form.availableForTraining !== "yes" || form.willingToReport !== "yes") return "Training and activity reporting are required for this opportunity.";
      if (form.marketsOtherTechnologyCompany === "yes" && form.conflictDetails.trim().length < 10) return "Briefly explain the other technology services you market.";
    }
    if (currentStep === 6 && ![form.accurate, form.independent, form.noGuarantee, form.consent, form.noFee].every(Boolean)) {
      return "Confirm every declaration before submitting.";
    }
    return "";
  }

  function next() {
    const message = validate(step);
    if (message) {
      setError(message);
      trackAction("application_validation_error", "/apply");
      return;
    }
    setError("");
    trackAction("application_step_completed", "/apply");
    setStep((value) => Math.min(7, value + 1));
  }

  async function submit(event) {
    event.preventDefault();
    const message = [1, 2, 3, 4, 5, 6].map(validate).find(Boolean);
    if (message) {
      setError(message);
      trackAction("application_validation_error", "/apply");
      return;
    }
    if (resume && resume.size > 3 * 1024 * 1024) {
      setError("Resume must be under 3 MB.");
      return;
    }
    setBusy(true);
    const attribution = getAttribution();
    const payload = {
      ...form,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmContent: attribution.utmContent,
      utmTerm: attribution.utmTerm,
      is18OrOlder: true,
      availableForTraining: true,
      willingToReport: true,
      marketsOtherTechnologyCompany: form.marketsOtherTechnologyCompany === "yes",
      scenarioSchool: form.scenarioSchoolResponse,
      scenarioPricing: form.scenarioPricingResponse,
      scenarioWebsite: form.scenarioWebsiteResponse,
      declareAccurate: form.accurate,
      declareIndependent: form.independent,
      declareNotGuaranteed: form.noGuarantee,
      declareConsent: form.consent,
      declareNoFee: form.noFee,
      turnstileToken,
    };
    if (resume) {
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error("Could not read the CV."));
        reader.readAsDataURL(resume);
      });
      payload.resume = { name: resume.name, type: resume.type, dataBase64 };
    }
    const response = await fetch("/api/leads?area=recruitment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setBusy(false);
      setError(data.error || "The application could not be submitted.");
      if (response.status === 409) trackAction("application_duplicate_detected", "/apply");
      else trackAction("application_validation_error", "/apply");
      return;
    }
    if (data.emailNotificationStatus !== "SENT" && data.emailAck) {
      try {
        await sendToCompany({
          subject: `NEW SVL MARKETING AGENT APPLICATION — ${data.applicationReference} — ${form.fullName}`,
          fields: {
            application_reference: data.applicationReference,
            full_name: form.fullName,
            phone: form.phone,
            whatsapp: form.whatsapp,
            email: form.email,
            county: form.county,
            city_area: form.cityArea,
            professional_status: form.professionalStatus,
            occupation: form.occupation || "Not provided",
            organization: form.organization || "Not provided",
            education: form.educationLevel || "Not provided",
            professional_background: form.professionalBackground,
            experience_categories: form.experienceCategories.join(", "),
            preferred_sectors: form.preferredSectors.join(", "),
            school_scenario: form.scenarioSchoolResponse,
            pricing_scenario: form.scenarioPricingResponse,
            website_scenario: form.scenarioWebsiteResponse,
            cv: resume ? "Uploaded" : "Not uploaded",
            admin_review: `https://application.softwarevalalib.app/admin?id=${data.id}`,
          },
        });
        await fetch("/api/leads?area=recruitment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ack-email", applicationReference: data.applicationReference, emailAck: data.emailAck }),
        });
      } catch {
        // The saved application stays in the database for an admin retry.
      }
    }
    localStorage.removeItem(DRAFT_KEY);
    trackAction("application_submitted", "/apply");
    navigate(`/thank-you?ref=${encodeURIComponent(data.applicationReference)}&name=${encodeURIComponent(data.firstName || "")}`);
  }

  if (windowState !== "open") {
    return (
      <main className="section-container section-padding">
        <h1 className="font-display text-3xl font-bold text-[#00274c]">{windowState === "before" ? "Applications are not open yet" : "Applications closed"}</h1>
        <p className="mt-4">{windowState === "before" ? "Applications open on 3 October 2026." : CLOSED_MESSAGE}</p>
        {windowState === "closed" ? <p className="mt-3">Thank you to everyone who applied. Submitted applications are now under review. Shortlisted applicants will be contacted through the information provided in their applications.</p> : null}
        <Link to="/" className="btn-primary mt-6">Return to the recruitment page</Link>
      </main>
    );
  }

  return (
    <main className="section-container section-padding max-w-3xl">
      <p className="text-sm font-semibold text-[#00274c]" aria-live="polite">Step {step} of 7</p>
      <div className="mt-2 h-2 rounded-full bg-slate-200" aria-hidden="true"><div className="h-2 rounded-full bg-[#c10020]" style={{ width: `${(step / 7) * 100}%` }} /></div>
      {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800" role="alert">{error}</p> : null}
      <form onSubmit={submit} className="mt-6 space-y-4 pb-28">
        {step === 1 ? (
          <>
            <Field label="Full name" value={form.fullName} onChange={(value) => setField("fullName", value)} required />
            <Field label="Phone number" value={form.phone} onChange={(value) => setField("phone", value)} required />
            <Field label="WhatsApp number" value={form.whatsapp} onChange={(value) => setField("whatsapp", value)} required />
            <Field label="Email address" type="email" value={form.email} onChange={(value) => setField("email", value)} required />
            <Field label="County" value={form.county} onChange={(value) => setField("county", value)} required />
            <Field label="City / general area" value={form.cityArea} onChange={(value) => setField("cityArea", value)} required />
            <fieldset>
              <legend className="text-sm font-semibold">Are you at least 18 years old?</legend>
              {["yes", "no"].map((value) => (
                <label key={value} className="mt-2 flex min-h-11 items-center gap-2"><input type="radio" name="age" checked={form.is18OrOlder === value} onChange={() => setField("is18OrOlder", value)} /> {value === "yes" ? "Yes" : "No"}</label>
              ))}
            </fieldset>
            {form.is18OrOlder === "no" ? <p className="text-red-800">Applicants must be at least 18 years old.</p> : null}
          </>
        ) : null}
        {step === 2 ? (
          <>
            <label className="block text-sm font-semibold">Current professional status *
              <select className={inputClass} value={form.professionalStatus} onChange={(event) => setField("professionalStatus", event.target.value)} required>
                <option value="">Select</option>
                {STATUSES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <Field label="Current occupation / role" value={form.occupation} onChange={(value) => setField("occupation", value)} />
            <Field label="Organization / institution" value={form.organization} onChange={(value) => setField("organization", value)} />
            <Field label="Highest relevant education or training" value={form.educationLevel} onChange={(value) => setField("educationLevel", value)} />
            <Area label="Short professional background" value={form.professionalBackground} onChange={(value) => setField("professionalBackground", value)} />
          </>
        ) : null}
        {step === 3 ? (
          <>
            <Checks legend="Do you have experience in any of the following?" options={EXPERIENCE} values={form.experienceCategories} onToggle={(value) => setField("experienceCategories", toggle(form.experienceCategories, value))} />
            <Area label="Briefly describe your relevant experience" value={form.experienceDescription} onChange={(value) => setField("experienceDescription", value)} />
            <Checks legend="Which sectors do you have contacts or useful networks in?" options={SECTORS} values={form.networkSectors} onToggle={(value) => setField("networkSectors", toggle(form.networkSectors, value))} />
            <Checks legend="Which two or three sectors would you prefer to focus on?" options={SECTORS} values={form.preferredSectors} onToggle={(value) => setField("preferredSectors", toggle(form.preferredSectors, value, 3))} />
            <p className="text-sm text-slate-600">{form.preferredSectors.length} of 3 selected</p>
            <Area label="Describe your existing network" value={form.networkDescription} onChange={(value) => setField("networkDescription", value)} />
          </>
        ) : null}
        {step === 4 ? (
          <>
            <Checks legend="Which outreach methods are you comfortable using?" options={OUTREACH} values={form.outreachMethods} onToggle={(value) => setField("outreachMethods", toggle(form.outreachMethods, value))} />
            <Area label="A school manages registration, grades, and fees manually. How would you begin the conversation before introducing an SVL solution?" value={form.scenarioSchoolResponse} onChange={(value) => setField("scenarioSchoolResponse", value)} />
            <Area label="A client asks for the final price before speaking with SVL. How would you respond?" value={form.scenarioPricingResponse} onChange={(value) => setField("scenarioPricingResponse", value)} />
            <Area label="A business has an outdated website that generates no inquiries. What would you do next?" value={form.scenarioWebsiteResponse} onChange={(value) => setField("scenarioWebsiteResponse", value)} />
          </>
        ) : null}
        {step === 5 ? (
          <>
            <label className="block text-sm font-semibold">Hours per week for prospecting and follow-up
              <select className={inputClass} value={form.weeklyAvailability} onChange={(event) => setField("weeklyAvailability", event.target.value)}>
                <option value="">Select</option>
                {HOURS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <YesNo label="Are you available for SVL orientation and training?" name="training" value={form.availableForTraining} onChange={(value) => setField("availableForTraining", value)} />
            <YesNo label="Are you willing to submit regular activity reports?" name="reports" value={form.willingToReport} onChange={(value) => setField("willingToReport", value)} />
            <YesNo label="Do you currently market technology services for another company?" name="conflict" value={form.marketsOtherTechnologyCompany} onChange={(value) => setField("marketsOtherTechnologyCompany", value)} />
            {form.marketsOtherTechnologyCompany === "yes" ? <Area label="Please explain the company, services, and any potential conflict." value={form.conflictDetails} onChange={(value) => setField("conflictDetails", value)} /> : null}
          </>
        ) : null}
        {step === 6 ? (
          <>
            <label className="block text-sm font-semibold">CV / resume (PDF, DOC, or DOCX, optional, maximum 3 MB)
              <input className="mt-2 block w-full" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setResume(event.target.files?.[0] || null)} />
            </label>
            {["accurate", "independent", "noGuarantee", "consent", "noFee"].map((key) => (
              <label key={key} className="flex min-h-11 items-start gap-2 text-sm">
                <input type="checkbox" checked={form[key]} onChange={(event) => setField(key, event.target.checked)} />
                <span>{
                  key === "accurate" ? "I confirm that the information provided is accurate to the best of my knowledge." :
                  key === "independent" ? "I understand that this is an independent, commission-based opportunity and not a guaranteed salaried position." :
                  key === "noGuarantee" ? "I understand that submitting this application does not guarantee selection." :
                  key === "consent" ? "I consent to SVL using this information to evaluate my application and administer this recruitment process." :
                  "I understand that SVL will never require an application or recruitment fee for this opportunity."
                }</span>
              </label>
            ))}
            {siteKey ? <div className="cf-turnstile" data-sitekey={siteKey} data-callback="svlTurnstile" /> : null}
          </>
        ) : null}
        {step === 7 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm space-y-2">
            <p><strong>{form.fullName}</strong> · {form.email}</p>
            <p>{form.phone} · WhatsApp {form.whatsapp}</p>
            <p>{form.county}, {form.cityArea}</p>
            <p>{form.professionalStatus} · {form.occupation}</p>
            <p>Preferred sectors: {form.preferredSectors.join(", ") || "None selected"}</p>
            <p>CV: {resume ? resume.name : "Not uploaded"}</p>
            <button type="button" className="text-[#00274c] underline" onClick={() => setStep(1)}>Edit personal information</button>
          </div>
        ) : null}
        <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true" inert="">
          <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setField("website", event.target.value)} /></label>
        </div>
        <div className="sticky bottom-0 z-10 flex gap-3 border-t border-slate-200 bg-slate-50 py-3">
          {step > 1 ? <button type="button" className="min-h-11 rounded-xl border px-5 py-3" onClick={() => setStep((value) => value - 1)}>Back</button> : <Link to="/" className="min-h-11 rounded-xl border px-5 py-3">Back</Link>}
          {step < 7 ? <button type="button" className="btn-primary min-h-11" onClick={next}>Continue</button> : <button className="btn-primary min-h-11" disabled={busy}>{busy ? "Submitting" : "Submit application"}</button>}
        </div>
      </form>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return <label className="block text-sm font-semibold">{label}{required ? " *" : ""}<input className={inputClass} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Area({ label, value, onChange }) {
  return <label className="block text-sm font-semibold">{label}<textarea className={`${inputClass} min-h-28`} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Checks({ legend, options, values, onToggle }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => <label key={option} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} />{option}</label>)}
      </div>
    </fieldset>
  );
}
function YesNo({ label, name, value, onChange }) {
  return <fieldset><legend className="text-sm font-semibold">{label}</legend>{["yes", "no"].map((item) => <label key={item} className="mt-2 flex min-h-11 items-center gap-2"><input type="radio" name={name} checked={value === item} onChange={() => onChange(item)} />{item === "yes" ? "Yes" : "No"}</label>)}</fieldset>;
}
