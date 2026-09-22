import { useCallback, useEffect, useMemo, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import {
  deleteEnrollment,
  fetchEnrollmentDetail,
  fetchEnrollments,
  generateAdmissionLetter,
  resendAdmissionLetter,
  updateEnrollment,
} from "../../utils/adminApi";
import { getCourseByCode } from "../../data/academyCourses";

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#00274c] outline-none focus:border-[#c10020]";

function courseLabel(code) {
  const c = getCourseByCode(code);
  return c ? `${code} — ${c.shortTitle || c.title}` : code;
}

export default function AdminEnrollments() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [letters, setLetters] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const data = await fetchEnrollments();
    setRows(data.enrollments || []);
    setStats(data.stats || null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadList()
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load enrollments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadList]);

  const loadDetail = async (row) => {
    setSelected(row);
    setEditing(false);
    setMessage("");
    setError("");
    try {
      const data = await fetchEnrollmentDetail(row.id);
      setSelected(data.enrollment);
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
        status: data.enrollment.status || "pending",
      });
    } catch (err) {
      setError(err.message);
      setLetters([]);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (!q) return true;
      const hay = [
        row.reference_number,
        row.full_name,
        row.email,
        row.phone,
        row.county,
        row.country,
        ...(Array.isArray(row.course_codes) ? row.course_codes : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, status]);

  const saveEdit = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await updateEnrollment(selected.id, form);
      setSelected(data.enrollment);
      setEditing(false);
      setMessage(data.message || "Saved.");
      await loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeStudent = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete application ${selected.reference_number} for ${selected.full_name}? This cannot be undone.`)) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteEnrollment(selected.id);
      setSelected(null);
      setLetters([]);
      setMessage("Application deleted.");
      await loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const regenerateLetter = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await generateAdmissionLetter(selected.reference_number, { regenerate: letters.length > 0 });
      await loadDetail(selected);
      setMessage("Admission letter generated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading enrollments…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">Students & Applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Admin-only: view, edit, delete student applications and download admission letters.
        </p>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={stats?.total} />
        <StatCard label="Pending" value={stats?.pending} />
        <StatCard label="Approved" value={stats?.approved} />
        <StatCard label="Enrolled" value={stats?.enrolled} />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} />
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, reference, course…"
          className="flex-1 min-w-[220px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="enrolled">Enrolled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Courses</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${
                      selected?.id === row.id ? "bg-[#00274c]/[0.04]" : ""
                    }`}
                    onClick={() => loadDetail(row)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#00274c]">{row.full_name}</p>
                      <p className="text-xs text-slate-500">{row.reference_number}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {(Array.isArray(row.course_codes) ? row.course_codes : []).join(", ")}
                    </td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No enrollments match your filters.</p>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm min-h-[320px] space-y-4">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#00274c]">{selected.full_name}</h2>
                  <p className="text-xs font-semibold text-[#c10020]">{selected.reference_number}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#00274c] hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setEditing((v) => !v)}
                    disabled={busy}
                  >
                    {editing ? "Cancel" : "Edit"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"
                    onClick={removeStudent}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {!editing ? (
                <dl className="space-y-2 text-sm">
                  {[
                    ["Email", selected.email],
                    ["Phone", selected.phone],
                    ["WhatsApp", selected.whatsapp],
                    ["County", selected.county],
                    ["Country", selected.country],
                    ["Education", selected.education_level],
                    ["Occupation", selected.occupation],
                    ["Session", selected.preferred_session],
                    ["Status", selected.status],
                    ["Submitted", selected.created_at ? new Date(selected.created_at).toLocaleString() : "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 border-b border-slate-50 py-1.5">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-medium text-[#00274c] text-right capitalize">{value || "—"}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-slate-500 mb-1">Courses</dt>
                    <dd className="space-y-1">
                      {(Array.isArray(selected.course_codes) ? selected.course_codes : []).map((code) => (
                        <p key={code} className="font-medium text-[#00274c]">
                          {courseLabel(code)}
                        </p>
                      ))}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="grid gap-3 text-sm">
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
                    <label key={key} className="block font-semibold text-[#00274c]">
                      {label}
                      <input
                        className={fieldClass}
                        value={form[key] || ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </label>
                  ))}
                  <label className="block font-semibold text-[#00274c]">
                    Status
                    <select
                      className={fieldClass}
                      value={form.status || "pending"}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="enrolled">Enrolled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </label>
                  <button type="button" className="btn-primary !py-2 !text-xs" onClick={saveEdit} disabled={busy}>
                    Save changes
                  </button>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-[#00274c]">Admission letter</h3>
                  <button
                    type="button"
                    className="rounded-full bg-[#00274c] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                    onClick={regenerateLetter}
                    disabled={busy}
                  >
                    {letters.length ? "Regenerate" : "Generate"}
                  </button>
                </div>
                {letters.length ? (
                  <ul className="mt-3 space-y-2">
                    {letters.map((letter) => (
                      <li
                        key={letter.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#00274c]">{letter.fileName}</p>
                          <p className="text-[11px] text-slate-500">
                            {letter.status}
                            {letter.generatedAt ? ` · ${new Date(letter.generatedAt).toLocaleString()}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={letter.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-[#c10020] px-3 py-1.5 text-[11px] font-bold text-white"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-[#00274c]"
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await resendAdmissionLetter(letter.id);
                                setMessage("Admission letter resent to student.");
                              } catch (err) {
                                setError(err.message);
                              } finally {
                                setBusy(false);
                              }
                            }}
                            disabled={busy}
                          >
                            Resend
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    No letter on file yet. Generate one to preview the PDF with course fees and the 40/30/30 payment schedule.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a student to view details, edit, delete, or download their admission letter.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
