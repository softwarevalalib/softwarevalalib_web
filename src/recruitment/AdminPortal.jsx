import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminLogin, adminLogout, fetchAdminMe, getAdminToken, getStoredAdmin } from "../utils/adminApi";

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "SELECTED", "WAITLISTED", "NOT_SELECTED", "WITHDRAWN", "ONBOARDING", "ACTIVE_AGENT"];
const SCREENING = [
  ["communication", "Communication & Professionalism", 25],
  ["network", "Relevant Business/Professional Network", 20],
  ["sales", "Sales/Marketing/Relationship Ability", 20],
  ["technology", "Understanding of Technology/Business Problems", 15],
  ["reliability", "Reliability, Record Keeping & Digital Literacy", 10],
  ["integrity", "Integrity & Policy Compliance", 10],
];
const INTERVIEW = [
  ["communication", "Communication & Confidence", 20],
  ["mindset", "Business Development Mindset", 20],
  ["prospecting", "Prospecting / Network Potential", 20],
  ["judgment", "Scenario Judgment", 15],
  ["professionalism", "Professionalism & Integrity", 15],
  ["availability", "Availability & Commitment", 10],
];
const ONBOARDING = [
  ["torReviewed", "TOR reviewed"],
  ["commissionPolicyReviewed", "Commission policy reviewed"],
  ["agreementSigned", "Agent agreement signed"],
  ["identityVerified", "Identity and contact verification completed"],
  ["trainingCompleted", "Training completed"],
  ["referralRulesExplained", "Referral rules explained"],
  ["reportingExplained", "Reporting process explained"],
  ["brandRulesExplained", "Brand rules explained"],
];

function asList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function asObject(value) {
  if (value && typeof value === "object") return value;
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

async function recruitment(path, options = {}) {
  const token = getAdminToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (options.csv) return response;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function AdminPortal() {
  const [params, setParams] = useSearchParams();
  const [admin, setAdmin] = useState(() => getStoredAdmin());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [board, setBoard] = useState(null);
  const [application, setApplication] = useState(null);
  const [audit, setAudit] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [reviewerFilter, setReviewerFilter] = useState("");
  const [draft, setDraft] = useState({});

  async function loadBoard() {
    const data = await recruitment("/api/leads?area=recruitment&action=list");
    setBoard(data);
  }

  useEffect(() => {
    if (!getAdminToken()) return undefined;
    const timer = setTimeout(() => {
      fetchAdminMe().then((data) => setAdmin(data.admin)).catch(() => setAdmin(null));
      loadBoard().catch((loadError) => setError(loadError.message));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = params.get("id");
    if (!id || !getAdminToken()) return;
    recruitment(`/api/leads?area=recruitment&action=one&id=${encodeURIComponent(id)}`)
      .then((data) => {
        setApplication(data.application);
        const screening = asObject(data.application.screening_parts);
        const interview = asObject(data.application.interview_parts);
        setDraft({
          applicationStatus: data.application.application_status,
          screeningParts: screening,
          screeningNotes: data.application.screening_notes || "",
          interviewParts: interview,
          interviewDate: data.application.interview_date || "",
          interviewTime: data.application.interview_time || "",
          interviewFormat: data.application.interview_format || "",
          interviewer: data.application.interviewer || "",
          interviewNotes: data.application.interview_notes || "",
          strengths: data.application.strengths || "",
          concerns: data.application.concerns || "",
          recommendation: data.application.recommendation || "",
          internalNotes: data.application.internal_notes || "",
          assignedReviewer: data.application.assigned_reviewer || "",
          onboarding: asObject(data.application.onboarding),
        });
      })
      .catch((loadError) => setError(loadError.message));
    recruitment(`/api/leads?area=recruitment&action=audit&id=${encodeURIComponent(id)}`)
      .then((data) => setAudit(data.audit || []))
      .catch(() => setAudit([]));
  }, [params]);

  const rows = useMemo(() => {
    const list = board?.applications || [];
    return list.filter((row) => {
      const haystack = `${row.application_reference} ${row.full_name} ${row.phone} ${row.email}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (statusFilter && row.application_status !== statusFilter) return false;
      if (countyFilter && row.county !== countyFilter) return false;
      if (roleFilter && row.professional_status !== roleFilter) return false;
      if (reviewerFilter && (row.assigned_reviewer || "") !== reviewerFilter) return false;
      if (sectorFilter && !asList(row.preferred_sectors).includes(sectorFilter)) return false;
      return true;
    });
  }, [board, query, statusFilter, countyFilter, roleFilter, sectorFilter, reviewerFilter]);

  const counts = Object.fromEntries((board?.counts || []).map((row) => [row.application_status, row.total]));
  const total = (board?.counts || []).reduce((sum, row) => sum + row.total, 0);
  const sectorCounts = {};
  for (const row of board?.applications || []) {
    if (row.test_record) continue;
    for (const sector of asList(row.preferred_sectors)) sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
  }

  async function login(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await adminLogin(email, password);
      setAdmin(data.admin);
      await loadBoard();
    } catch (loginError) {
      setError(loginError.message);
    }
  }

  async function save(extra = {}) {
    setError("");
    const payload = { action: "review", id: application.id, ...draft, ...extra };
    const screening = scorePayload(draft.screeningParts, SCREENING.map(([key]) => key));
    const interview = scorePayload(draft.interviewParts, INTERVIEW.map(([key]) => key));
    if (screening.error || interview.error) {
      setError(screening.error || interview.error);
      return;
    }
    if (screening.omit) delete payload.screeningParts;
    else payload.screeningParts = screening.values;
    if (interview.omit) delete payload.interviewParts;
    else payload.interviewParts = interview.values;
    const data = await recruitment("/api/leads?area=recruitment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setApplication((current) => ({ ...current, application_status: data.applicationStatus, agent_id: data.agentId, screening_score: data.screeningScore, interview_score: data.interviewScore }));
    await loadBoard();
  }

  async function downloadFile(path, filename) {
    const response = await fetch(path, { headers: { Authorization: `Bearer ${getAdminToken()}` } });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Download failed");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!admin) {
    return (
      <main className="section-container section-padding max-w-md">
        <h1 className="font-display text-3xl font-bold text-[#00274c]">Staff sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Use your existing Software Vala Liberia admin account.</p>
        {error ? <p className="mt-4 text-red-700" role="alert">{error}</p> : null}
        <form className="mt-6 space-y-4" onSubmit={login}>
          <label className="block text-sm font-semibold">Email<input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="block text-sm font-semibold">Password<input className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button className="btn-primary" type="submit">Sign in</button>
        </form>
      </main>
    );
  }

  return (
    <main className="section-container section-padding">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">Marketing agent recruitment</p>
          <h1 className="font-display text-3xl font-bold text-[#00274c]">Applications</h1>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl border px-4 py-3 text-sm font-semibold" type="button" onClick={() => downloadFile("/api/leads?area=recruitment&action=export", "svl-marketing-agent-applications.csv").catch((downloadError) => setError(downloadError.message))}>Export CSV</button>
          <button className="rounded-xl border px-4 py-3 text-sm" type="button" onClick={() => { adminLogout(); setAdmin(null); }}>Sign out</button>
        </div>
      </div>
      {error ? <p className="mt-4 text-red-700" role="alert">{error}</p> : null}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total applications", total],
          ["Today", board?.today || 0],
          ["Submitted", counts.SUBMITTED || 0],
          ["Under review", counts.UNDER_REVIEW || 0],
          ["Shortlisted", counts.SHORTLISTED || 0],
          ["Interview scheduled", counts.INTERVIEW_SCHEDULED || 0],
          ["Interviewed", counts.INTERVIEWED || 0],
          ["Selected", counts.SELECTED || 0],
          ["Waitlisted", counts.WAITLISTED || 0],
          ["Not selected", counts.NOT_SELECTED || 0],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="font-display text-2xl font-bold text-[#00274c]">{value}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Breakdown title="By county" rows={board?.byCounty || []} labelKey="county" />
        <Breakdown title="By professional status" rows={board?.byProfessionalStatus || []} labelKey="professional_status" />
        <Breakdown title="By source" rows={board?.bySource || []} labelKey="source" />
      </section>
      <section className="mt-4">
        <h2 className="font-semibold text-[#00274c]">Preferred sectors</h2>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">{Object.entries(sectorCounts).map(([sector, count]) => <li key={sector} className="rounded-full bg-white border px-3 py-1">{sector}: {count}</li>)}</ul>
      </section>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <input className="rounded-xl border px-4 py-3" placeholder="Search name, phone, email, reference" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="rounded-xl border px-4 py-3" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
        <select className="rounded-xl border px-4 py-3" value={countyFilter} onChange={(event) => setCountyFilter(event.target.value)}><option value="">All counties</option>{(board?.byCounty || []).map((row) => <option key={row.county}>{row.county}</option>)}</select>
        <select className="rounded-xl border px-4 py-3" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All professional statuses</option>{(board?.byProfessionalStatus || []).map((row) => <option key={row.professional_status}>{row.professional_status}</option>)}</select>
        <input className="rounded-xl border px-4 py-3" placeholder="Preferred sector" value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)} />
        <input className="rounded-xl border px-4 py-3" placeholder="Reviewer" value={reviewerFilter} onChange={(event) => setReviewerFilter(event.target.value)} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b">{["Reference", "Applicant", "Phone", "Email", "County", "Status", "Score", "Reviewer"].map((heading) => <th key={heading} className="py-2 pr-3">{heading}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="py-2 pr-3"><button className="font-semibold text-[#00274c] underline" type="button" onClick={() => setParams({ id: row.id })}>{row.application_reference}</button></td>
                <td className="pr-3">{row.full_name}{row.test_record ? " (test)" : ""}</td>
                <td className="pr-3">{row.phone}</td>
                <td className="pr-3">{row.email}</td>
                <td className="pr-3">{row.county}</td>
                <td className="pr-3">{row.application_status}</td>
                <td className="pr-3">{row.screening_score ?? "—"}</td>
                <td>{row.assigned_reviewer || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {application ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#00274c]">{application.full_name}</h2>
          <p>{application.application_reference} · {application.email} · {application.phone} · WhatsApp {application.whatsapp}</p>
          <p>{application.county}, {application.city_area} · {application.professional_status} · {application.occupation || "Occupation not provided"}</p>
          <p>Screening score: {application.screening_score ?? "Not scored"}{application.screening_score == null ? "" : ` · ${band(application.screening_score)}`}. Interview score: {application.interview_score ?? "Not scored"}.</p>
          <p>Email notification: {application.email_notification_status}</p>
          {application.agent_id ? <p>Agent ID: {application.agent_id} · Referral: https://softwarevalalib.app/consultation?ref={application.agent_id}</p> : null}
          <p>Preferred sectors: {asList(application.preferred_sectors).join(", ")}</p>
          <p>Experience: {asList(application.experience_categories).join(", ")}</p>
          <p>Network sectors: {asList(application.network_sectors).join(", ")}</p>
          <p>Outreach: {asList(application.outreach_methods).join(", ")}</p>
          <p>Background: {application.professional_background}</p>
          <p>Network: {application.network_description}</p>
          <p>School scenario: {application.scenario_school_response}</p>
          <p>Pricing scenario: {application.scenario_pricing_response}</p>
          <p>Website scenario: {application.scenario_website_response}</p>
          <p>Availability: {application.weekly_availability}. Training: {application.available_for_training ? "Yes" : "No"}. Reports: {application.willing_to_report ? "Yes" : "No"}.</p>
          <p>Markets another technology company: {application.markets_other_technology_company ? "Yes" : "No"}. {application.conflict_details}</p>
          <p>Source: {application.utm_source || "Direct"} / {application.utm_medium || "—"} / {application.utm_campaign || "—"}</p>
          {application.resume_file_key ? <button className="underline" type="button" onClick={() => downloadFile(`/api/leads?area=recruitment&action=cv&id=${application.id}`, application.resume_file_key).catch((downloadError) => setError(downloadError.message))}>Download CV</button> : <p>No CV uploaded.</p>}
          <label className="block text-sm font-semibold">Status
            <select className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.applicationStatus || ""} onChange={(event) => setDraft({ ...draft, applicationStatus: event.target.value })}>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Assigned reviewer<input className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.assignedReviewer || ""} onChange={(event) => setDraft({ ...draft, assignedReviewer: event.target.value })} /></label>
          <fieldset>
            <legend className="font-semibold">Screening scorecard</legend>
            {SCREENING.map(([key, label, max]) => (
              <label key={key} className="mt-2 block text-sm">{label} (0–{max})
                <input className="mt-1 w-full rounded-xl border px-3 py-2" type="number" min="0" max={max} value={draft.screeningParts?.[key] ?? ""} onChange={(event) => setDraft({ ...draft, screeningParts: { ...draft.screeningParts, [key]: Number(event.target.value) } })} />
              </label>
            ))}
            <label className="mt-2 block text-sm">Screening notes<textarea className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.screeningNotes || ""} onChange={(event) => setDraft({ ...draft, screeningNotes: event.target.value })} /></label>
          </fieldset>
          <fieldset>
            <legend className="font-semibold">Interview scorecard</legend>
            <label className="mt-2 block text-sm">Date<input className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.interviewDate || ""} onChange={(event) => setDraft({ ...draft, interviewDate: event.target.value })} /></label>
            <label className="mt-2 block text-sm">Time<input className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.interviewTime || ""} onChange={(event) => setDraft({ ...draft, interviewTime: event.target.value })} /></label>
            <label className="mt-2 block text-sm">Format<input className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.interviewFormat || ""} onChange={(event) => setDraft({ ...draft, interviewFormat: event.target.value })} /></label>
            <label className="mt-2 block text-sm">Interviewer<input className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.interviewer || ""} onChange={(event) => setDraft({ ...draft, interviewer: event.target.value })} /></label>
            {INTERVIEW.map(([key, label, max]) => (
              <label key={key} className="mt-2 block text-sm">{label} (0–{max})
                <input className="mt-1 w-full rounded-xl border px-3 py-2" type="number" min="0" max={max} value={draft.interviewParts?.[key] ?? ""} onChange={(event) => setDraft({ ...draft, interviewParts: { ...draft.interviewParts, [key]: Number(event.target.value) } })} />
              </label>
            ))}
            <label className="mt-2 block text-sm">Interview notes<textarea className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.interviewNotes || ""} onChange={(event) => setDraft({ ...draft, interviewNotes: event.target.value })} /></label>
            <label className="mt-2 block text-sm">Strengths<textarea className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.strengths || ""} onChange={(event) => setDraft({ ...draft, strengths: event.target.value })} /></label>
            <label className="mt-2 block text-sm">Concerns<textarea className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.concerns || ""} onChange={(event) => setDraft({ ...draft, concerns: event.target.value })} /></label>
            <label className="mt-2 block text-sm">Recommendation
              <select className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.recommendation || ""} onChange={(event) => setDraft({ ...draft, recommendation: event.target.value })}>
                <option value="">Select</option>
                {["STRONGLY RECOMMEND", "RECOMMEND", "CONSIDER", "DO NOT RECOMMEND"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </fieldset>
          <label className="block text-sm font-semibold">Internal notes<textarea className="mt-1 w-full rounded-xl border px-3 py-2" value={draft.internalNotes || ""} onChange={(event) => setDraft({ ...draft, internalNotes: event.target.value })} /></label>
          <fieldset>
            <legend className="font-semibold">Onboarding</legend>
            {ONBOARDING.map(([key, label]) => (
              <label key={key} className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(draft.onboarding?.[key])} onChange={(event) => setDraft({ ...draft, onboarding: { ...draft.onboarding, [key]: event.target.checked } })} />
                {label}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="button" onClick={() => save().catch((saveError) => setError(saveError.message))}>Save review</button>
            <button className="btn-navy" type="button" onClick={() => save({ activateAgent: true }).catch((saveError) => setError(saveError.message))}>Activate agent</button>
            <button className="rounded-xl border px-4 py-3 text-sm" type="button" onClick={() => recruitment("/api/leads?area=recruitment", { method: "POST", body: JSON.stringify({ action: "retry-email", id: application.id }) }).then(() => loadBoard()).catch((saveError) => setError(saveError.message))}>Retry notification</button>
          </div>
          <div>
            <h3 className="font-semibold">Status history</h3>
            <ul className="mt-2 space-y-1 text-sm">{audit.map((item, index) => <li key={`${item.created_at}-${index}`}>{item.created_at} · {item.actor} · {item.action}</li>)}</ul>
          </div>
          <Link to="/admin" onClick={() => { setApplication(null); setParams({}); }}>Close profile</Link>
        </section>
      ) : null}
    </main>
  );
}

function band(score) {
  if (score >= 80) return "Strong shortlist consideration";
  if (score >= 65) return "Review / possible shortlist";
  if (score >= 50) return "Hold / secondary review";
  return "Normally not shortlisted";
}

function scorePayload(parts, keys) {
  const present = keys.filter((key) => parts?.[key] !== "" && parts?.[key] !== undefined && parts?.[key] !== null);
  if (!present.length) return { omit: true };
  if (present.length !== keys.length) return { error: "Complete every score in the scorecard, or leave it blank." };
  const values = {};
  for (const key of keys) values[key] = Number(parts[key]);
  return { values };
}

function Breakdown({ title, rows, labelKey }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-[#00274c]">{title}</h2>
      <ul className="mt-2 space-y-1 text-sm">{rows.map((row) => <li key={row[labelKey]}>{row[labelKey]}: {row.total}</li>)}</ul>
    </article>
  );
}
