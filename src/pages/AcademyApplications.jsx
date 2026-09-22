import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import Footer from "../components/Footer";
import { getCourseByCode } from "../data/academyCourses";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#00274c] outline-none focus:border-[#c10020]";

function courseLabel(code) {
  const c = getCourseByCode(code);
  return c ? `${code} — ${c.shortTitle || c.title}` : code;
}

export default function AcademyApplications() {
  const [email, setEmail] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [enrollment, setEnrollment] = useState(null);
  const [letters, setLetters] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "My Applications | SVL Training Academy";
    try {
      const saved = sessionStorage.getItem("svl_academy_application_lookup");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.referenceNumber) setReferenceNumber(parsed.referenceNumber);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!enrollment || letters.length) return undefined;
    const t = setInterval(() => {
      lookup();
    }, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment?.id, letters.length]);

  const lookup = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/academy/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "lookup", email, referenceNumber, website: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setEnrollment(data.enrollment);
      setLetters(data.admissionLetters || []);
      setForm({
        fullName: data.enrollment.full_name || "",
        phone: data.enrollment.phone || "",
        whatsapp: data.enrollment.whatsapp || "",
        county: data.enrollment.county || "",
        country: data.enrollment.country || "",
        educationLevel: data.enrollment.education_level || "",
        occupation: data.enrollment.occupation || "",
        employer: data.enrollment.employer || "",
        preferredSession: data.enrollment.preferred_session || "",
        motivation: data.enrollment.motivation || "",
        notes: data.enrollment.notes || "",
      });
      setEditing(false);
      sessionStorage.setItem(
        "svl_academy_application_lookup",
        JSON.stringify({ email, referenceNumber })
      );
    } catch (err) {
      setEnrollment(null);
      setLetters([]);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/academy/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          action: "update",
          email,
          referenceNumber,
          patch: form,
          website: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setEnrollment(data.enrollment);
      setEditing(false);
      setMessage(data.message || "Saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeApp = async () => {
    if (!window.confirm("Delete this pending application? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/academy/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "delete", email, referenceNumber, website: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setEnrollment(null);
      setLetters([]);
      setMessage(data.message || "Application deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-[#00274c] text-white">
        <div className="section-container section-padding py-12 sm:py-14">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              SVL Training Academy
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold">My Applications</h1>
            <p className="mt-3 max-w-2xl text-white/80 text-sm sm:text-base">
              View, edit, or delete a pending application and download your admission letter when ready.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container max-w-3xl space-y-6">
          <form onSubmit={lookup} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-display text-xl font-bold text-[#00274c]">Find your application</h2>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#00274c]" htmlFor="appEmail">
                Email used on the application
              </label>
              <input
                id="appEmail"
                type="email"
                required
                className={fieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#00274c]" htmlFor="appRef">
                Application reference
              </label>
              <input
                id="appRef"
                required
                placeholder="SVL-ACA-2026-000123"
                className={fieldClass}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Looking up…" : "View application"}
            </button>
          </form>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
              {message}
            </p>
          ) : null}

          {enrollment ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#c10020]">{enrollment.reference_number}</p>
                  <h2 className="font-display text-2xl font-bold text-[#00274c]">
                    {enrollment.full_name}
                  </h2>
                  <p className="text-sm text-slate-500 capitalize">Status: {enrollment.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-outline !py-2 !text-xs"
                    onClick={() => lookup()}
                    disabled={busy}
                  >
                    View / Refresh
                  </button>
                  <button
                    type="button"
                    className="btn-outline !py-2 !text-xs"
                    onClick={() => setEditing((v) => !v)}
                    disabled={enrollment.status !== "pending"}
                  >
                    {editing ? "Cancel edit" : "Edit"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-40"
                    onClick={removeApp}
                    disabled={busy || enrollment.status !== "pending"}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {!editing ? (
                <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                  {[
                    ["Email", enrollment.email],
                    ["Phone", enrollment.phone],
                    ["WhatsApp", enrollment.whatsapp],
                    ["County", enrollment.county],
                    ["Country", enrollment.country],
                    ["Education", enrollment.education_level],
                    ["Occupation", enrollment.occupation],
                    ["Session", enrollment.preferred_session],
                    ["Submitted", enrollment.created_at ? new Date(enrollment.created_at).toLocaleString() : "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs uppercase tracking-wider text-slate-400">{label}</dt>
                      <dd className="mt-0.5 font-medium text-[#00274c]">{value || "—"}</dd>
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <dt className="text-xs uppercase tracking-wider text-slate-400">Courses</dt>
                    <dd className="mt-1 space-y-1">
                      {(Array.isArray(enrollment.course_codes) ? enrollment.course_codes : []).map((code) => (
                        <p key={code} className="font-medium text-[#00274c]">
                          {courseLabel(code)}
                        </p>
                      ))}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["fullName", "Full name"],
                    ["phone", "Phone"],
                    ["whatsapp", "WhatsApp"],
                    ["county", "County"],
                    ["country", "Country"],
                    ["educationLevel", "Education"],
                    ["occupation", "Occupation"],
                    ["preferredSession", "Preferred session"],
                  ].map(([key, label]) => (
                    <label key={key} className="text-sm font-semibold text-[#00274c]">
                      {label}
                      <input
                        className={`${fieldClass} mt-1 font-normal`}
                        value={form[key] || ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </label>
                  ))}
                  <label className="sm:col-span-2 text-sm font-semibold text-[#00274c]">
                    Motivation
                    <textarea
                      rows={3}
                      className={`${fieldClass} mt-1 font-normal`}
                      value={form.motivation || ""}
                      onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                    />
                  </label>
                  <button type="button" className="btn-primary sm:col-span-2" onClick={saveEdit} disabled={busy}>
                    Save changes
                  </button>
                </div>
              )}

              <div className="border-t border-slate-100 pt-5">
                <h3 className="font-display font-bold text-[#00274c]">Admission letter</h3>
                {letters.length ? (
                  <ul className="mt-3 space-y-3">
                    {letters.map((letter) => (
                      <li
                        key={letter.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#00274c]">{letter.fileName}</p>
                          <p className="text-xs text-slate-500">
                            {letter.status}
                            {letter.generatedAt
                              ? ` · ${new Date(letter.generatedAt).toLocaleString()}`
                              : ""}
                          </p>
                        </div>
                        <a
                          href={letter.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary !py-2 !text-xs"
                        >
                          Download PDF
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Your admission letter is being prepared and is usually ready within 10–30 minutes
                    after a successful application. This page refreshes automatically — or use{" "}
                    <strong>View / Refresh</strong>.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <p className="text-center text-sm">
            <Link to="/academy" className="font-semibold text-[#00274c] hover:underline">
              Back to Academy
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
