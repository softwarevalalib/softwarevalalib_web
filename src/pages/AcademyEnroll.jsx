import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import Footer from "../components/Footer";
import academyCourses, { getCourseByCode } from "../data/academyCourses";
import { SESSION_GROUPS } from "../data/academyMeta";
import { submitEnrollment, trackAcademyEvent } from "../utils/academyApi";

const inputClass =
  "w-full rounded-xl border border-[#00274c]/15 bg-white px-4 py-3 text-[#00274c] outline-none transition focus:border-[#c10020] focus:ring-1 focus:ring-[#c10020]/30 placeholder:text-slate-400 disabled:opacity-60";

const labelClass = "block text-sm font-semibold text-[#00274c] mb-1.5";

const EDUCATION_LEVELS = [
  "High School",
  "Certificate",
  "Diploma",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Other",
];

const HEARD_ABOUT = [
  "Facebook",
  "WhatsApp",
  "Friend / Family",
  "Software Vala website",
  "School / Institution",
  "Radio / Media",
  "Other",
];

const PROGRAMME_TYPES = [
  "Technology Course",
  "Foundation Certificate",
  "Diploma",
  "Comprehensive",
  "Not sure yet",
];

const initialForm = {
  fullName: "",
  gender: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  whatsapp: "",
  county: "",
  country: "Liberia",
  educationLevel: "",
  occupation: "",
  employer: "",
  programmeType: "",
  preferredSession: "",
  hasLaptop: false,
  hasInternet: false,
  basicComputerKnowledge: false,
  heardAbout: "",
  motivation: "",
  notes: "",
  consentTerms: false,
  consentPrivacy: false,
  consentAccuracy: false,
  website: "",
};

function Field({ label, htmlFor, required, children, hint }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className={labelClass}>
        {label}
        {required ? <span className="text-[#c10020]"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 shadow-sm">
      <h2 className="font-display text-lg sm:text-xl font-bold text-[#00274c]">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export default function AcademyEnroll() {
  const [searchParams] = useSearchParams();
  const preselectCode = searchParams.get("course") || "";

  const publishedCourses = useMemo(
    () => academyCourses.filter((c) => c.status === "published"),
    []
  );

  const preselectedFromUrl = useMemo(() => {
    if (!preselectCode) return [];
    const match = getCourseByCode(preselectCode);
    return match && match.status === "published" ? [match.code] : [];
  }, [preselectCode]);

  const [form, setForm] = useState(initialForm);
  const [manualCodes, setManualCodes] = useState([]);
  const [removedCodes, setRemovedCodes] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [courseQuery, setCourseQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const selectedCodes = useMemo(() => {
    const next = new Set([
      ...preselectedFromUrl.filter((code) => !removedCodes.includes(code)),
      ...manualCodes,
    ]);
    return Array.from(next);
  }, [preselectedFromUrl, manualCodes, removedCodes]);

  useEffect(() => {
    document.title = "Enroll | SVL Training Academy";
    trackAcademyEvent("enrollment_started", {
      course: preselectCode || undefined,
    });
  }, [preselectCode]);

  const filteredCatalogue = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return publishedCourses;
    return publishedCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [courseQuery, publishedCourses]);

  const selectedCourses = useMemo(
    () => selectedCodes.map((code) => getCourseByCode(code)).filter(Boolean),
    [selectedCodes]
  );

  const toggleChecklist = (code) => {
    setChecklist((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const addSelected = () => {
    if (!checklist.length) return;
    setManualCodes((prev) => {
      const next = new Set(prev);
      checklist.forEach((code) => next.add(code));
      return Array.from(next);
    });
    setRemovedCodes((prev) => prev.filter((code) => !checklist.includes(code)));
    setChecklist([]);
  };

  const removeCourse = (code) => {
    setManualCodes((prev) => prev.filter((c) => c !== code));
    if (preselectedFromUrl.includes(code)) {
      setRemovedCodes((prev) => (prev.includes(code) ? prev : [...prev, code]));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (selectedCodes.length < 1) {
      setError("Select at least one course.");
      return;
    }
    if (!form.consentTerms || !form.consentPrivacy || !form.consentAccuracy) {
      setError("Please accept the required consent statements.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitEnrollment({
        ...form,
        courseCodes: selectedCodes,
      });
      // Honeypot filled → API returns { ok: true } without a reference
      if (!data.referenceNumber) {
        setSuccess({
          referenceNumber: "SVL-ACA-000000",
          fullName: form.fullName,
          courseCodes: selectedCodes,
          submittedAt: new Date().toISOString(),
        });
        return;
      }
      setSuccess(data);
      trackAcademyEvent("enrollment_submitted", {
        reference: data.referenceNumber,
        courses: selectedCodes.join(","),
      });
    } catch (err) {
      setError(err.message || "Unable to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const submittedCourses = (success.courseCodes || selectedCodes)
      .map((code) => getCourseByCode(code)?.title || code)
      .join(", ");
    const submittedDate = success.submittedAt
      ? new Date(success.submittedAt).toLocaleString("en-LR", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : new Date().toLocaleString();

    return (
      <div className="bg-slate-50 min-h-screen">
        <section className="section-padding">
          <div className="section-container max-w-2xl">
            <Reveal>
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 sm:p-10 text-center shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Application received
                </p>
                <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-[#00274c]">
                  Application Submitted Successfully
                </h1>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Thank you, {success.fullName || form.fullName}. Keep your reference number
                  handy — our team typically follows up within 24–48 hours.
                </p>

                <div className="mt-8 rounded-xl bg-slate-50 border border-slate-100 p-5 text-left space-y-3">
                  <p className="text-sm text-slate-500">Reference number</p>
                  <p className="font-display text-xl font-bold text-[#c10020] tracking-wide">
                    {success.referenceNumber}
                  </p>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Applicant</dt>
                      <dd className="font-semibold text-[#00274c] text-right">
                        {success.fullName || form.fullName}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Course(s)</dt>
                      <dd className="font-semibold text-[#00274c] text-right max-w-[60%]">
                        {submittedCourses}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Submitted</dt>
                      <dd className="font-semibold text-[#00274c] text-right">{submittedDate}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-8 text-left rounded-xl border border-slate-100 p-5">
                  <h2 className="font-display font-bold text-[#00274c]">Next steps</h2>
                  <ol className="mt-3 space-y-2 text-sm text-slate-600 list-decimal list-inside">
                    <li>Save your reference number for follow-up.</li>
                    <li>Watch your email and WhatsApp for confirmation within 24–48 hours.</li>
                    <li>Complete payment using the approved methods we share with you.</li>
                    <li>Join orientation and start your live online classes.</li>
                  </ol>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link to="/academy" className="btn-primary">
                    Return to Academy
                  </Link>
                  <Link to="/academy#courses" className="btn-outline">
                    View Other Courses
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-[#00274c] text-white">
        <div className="section-container section-padding !pb-12 !pt-16">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-wider text-[#ff6b81]">
              SVL Training Academy
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold">
              Enrollment Application
            </h1>
            <p className="mt-3 text-white/80 max-w-2xl leading-relaxed">
              Apply for one or more courses in a single submission. Accurate details help us
              process your application faster.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding !pt-10">
        <div className="section-container max-w-3xl">
          <form onSubmit={handleSubmit} className="relative space-y-6" noValidate>
            {/* Honeypot — hidden from humans */}
            <div className="absolute -left-[9999px] top-0 opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={handleChange}
              />
            </div>

            <Reveal>
              <SectionCard title="Course selection">
                <p className="text-sm text-slate-600 -mt-2">
                  Search and check courses, then click <strong>Add selected</strong>. You can
                  enroll in multiple programmes at once.
                </p>

                <label className="block">
                  <span className="sr-only">Search courses</span>
                  <input
                    type="search"
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                    placeholder="Search courses by title, code, or category…"
                    className={inputClass}
                  />
                </label>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {filteredCatalogue.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">No courses match your search.</p>
                  ) : (
                    filteredCatalogue.map((course) => {
                      const checked = checklist.includes(course.code);
                      const already = selectedCodes.includes(course.code);
                      return (
                        <label
                          key={course.id}
                          className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 ${
                            already ? "opacity-60" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 accent-[#c10020]"
                            checked={checked || already}
                            disabled={already}
                            onChange={() => toggleChecklist(course.code)}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[#00274c] leading-snug">
                              {course.title}
                            </span>
                            <span className="block text-xs text-slate-500 mt-0.5">
                              {course.code} · {course.category} · US${course.tuition}
                              {already ? " · Added" : ""}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={addSelected}
                  disabled={!checklist.length}
                  className="btn-navy !py-2.5 !text-xs disabled:opacity-40 disabled:pointer-events-none"
                >
                  Add selected
                </button>

                {selectedCourses.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedCourses.map((course) => (
                      <li
                        key={course.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-[#00274c]/5 px-3 py-2.5"
                      >
                        <span className="text-sm font-medium text-[#00274c]">
                          {course.code} — {course.shortTitle || course.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCourse(course.code)}
                          className="text-xs font-semibold text-[#c10020] hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No courses selected yet.</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Programme type" htmlFor="programmeType">
                    <select
                      id="programmeType"
                      name="programmeType"
                      value={form.programmeType}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      {PROGRAMME_TYPES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Preferred session"
                    htmlFor="preferredSession"
                    hint="Optional — matches Academy session groups"
                  >
                    <select
                      id="preferredSession"
                      name="preferredSession"
                      value={form.preferredSession}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">No preference</option>
                      {SESSION_GROUPS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}: {g.days}, {g.time}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </SectionCard>
            </Reveal>

            <Reveal>
              <SectionCard title="Personal information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Full name" htmlFor="fullName" required>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        autoComplete="name"
                        value={form.fullName}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label="Gender" htmlFor="gender">
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                  <Field label="Date of birth" htmlFor="dateOfBirth">
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email" required>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Phone" htmlFor="phone" required>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="WhatsApp number" htmlFor="whatsapp">
                    <input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      value={form.whatsapp}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="County" htmlFor="county">
                    <input
                      id="county"
                      name="county"
                      type="text"
                      value={form.county}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. Montserrado"
                    />
                  </Field>
                  <Field label="Country" htmlFor="country">
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={form.country}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </SectionCard>
            </Reveal>

            <Reveal>
              <SectionCard title="Education & professional information">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Highest education level" htmlFor="educationLevel">
                    <select
                      id="educationLevel"
                      name="educationLevel"
                      value={form.educationLevel}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      {EDUCATION_LEVELS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Current occupation / status" htmlFor="occupation">
                    <input
                      id="occupation"
                      name="occupation"
                      type="text"
                      value={form.occupation}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. Student, Entrepreneur"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="School / institution / employer" htmlFor="employer">
                      <input
                        id="employer"
                        name="employer"
                        type="text"
                        value={form.employer}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>
            </Reveal>

            <Reveal>
              <SectionCard title="Technology readiness">
                <div className="space-y-3">
                  {[
                    { name: "hasLaptop", label: "I have access to a personal laptop" },
                    { name: "hasInternet", label: "I have reliable internet access" },
                    {
                      name: "basicComputerKnowledge",
                      label: "I have basic computer knowledge",
                    },
                  ].map((item) => (
                    <label
                      key={item.name}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        name={item.name}
                        checked={form[item.name]}
                        onChange={handleChange}
                        className="mt-0.5 accent-[#c10020]"
                      />
                      <span className="text-sm text-[#00274c] font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>
              </SectionCard>
            </Reveal>

            <Reveal>
              <SectionCard title="Additional information">
                <Field label="How did you hear about SVL Training Academy?" htmlFor="heardAbout">
                  <select
                    id="heardAbout"
                    name="heardAbout"
                    value={form.heardAbout}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select…</option>
                    {HEARD_ABOUT.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Why do you want to enroll?" htmlFor="motivation">
                  <textarea
                    id="motivation"
                    name="motivation"
                    rows={3}
                    value={form.motivation}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>
                <Field label="Additional notes" htmlFor="notes">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>
              </SectionCard>
            </Reveal>

            <Reveal>
              <SectionCard title="Consent">
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consentTerms"
                      checked={form.consentTerms}
                      onChange={handleChange}
                      className="mt-0.5 accent-[#c10020]"
                      required
                    />
                    <span className="text-sm text-slate-700">
                      I agree to the SVL Training Academy terms of enrollment.{" "}
                      <span className="text-[#c10020]">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consentPrivacy"
                      checked={form.consentPrivacy}
                      onChange={handleChange}
                      className="mt-0.5 accent-[#c10020]"
                      required
                    />
                    <span className="text-sm text-slate-700">
                      I consent to Software Vala Liberia contacting me about this application
                      and related Academy communications. <span className="text-[#c10020]">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consentAccuracy"
                      checked={form.consentAccuracy}
                      onChange={handleChange}
                      className="mt-0.5 accent-[#c10020]"
                      required
                    />
                    <span className="text-sm text-slate-700">
                      I confirm that the information I provided is accurate to the best of my
                      knowledge. <span className="text-[#c10020]">*</span>
                    </span>
                  </label>
                </div>
              </SectionCard>
            </Reveal>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3 pb-4">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
              <Link to="/academy#courses" className="btn-outline">
                Browse Courses
              </Link>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
