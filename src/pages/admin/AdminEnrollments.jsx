import { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import { fetchEnrollments } from "../../utils/adminApi";
import { getCourseByCode } from "../../data/academyCourses";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchEnrollments()
      .then((data) => {
        if (cancelled) return;
        setRows(data.enrollments || []);
        setStats(data.stats || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load enrollments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (loading) return <p className="text-slate-500">Loading enrollments…</p>;
  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">Enrollments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Full application records submitted through the Academy enrollment form.
        </p>
      </div>

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
                    onClick={() => setSelected(row)}
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

        <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm min-h-[320px]">
          {selected ? (
            <div className="space-y-3 text-sm">
              <h2 className="font-display text-xl font-bold text-[#00274c]">Application detail</h2>
              <p className="text-xs font-semibold text-[#c10020]">{selected.reference_number}</p>
              {[
                ["Name", selected.full_name],
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["WhatsApp", selected.whatsapp],
                ["Gender", selected.gender],
                ["Date of birth", selected.date_of_birth],
                ["County", selected.county],
                ["Country", selected.country],
                ["Education", selected.education_level],
                ["Occupation", selected.occupation],
                ["Employer / school", selected.employer],
                ["Programme type", selected.programme_type],
                ["Preferred session", selected.preferred_session],
                ["Heard about", selected.heard_about],
                ["Status", selected.status],
                ["Submitted", selected.created_at ? new Date(selected.created_at).toLocaleString() : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-50 py-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-[#00274c] text-right">{value || "—"}</span>
                </div>
              ))}
              <div>
                <p className="text-slate-500 mb-1">Courses</p>
                <ul className="space-y-1">
                  {(Array.isArray(selected.course_codes) ? selected.course_codes : []).map((code) => (
                    <li key={code} className="font-medium text-[#00274c]">
                      {courseLabel(code)}
                    </li>
                  ))}
                </ul>
              </div>
              {selected.motivation ? (
                <div>
                  <p className="text-slate-500 mb-1">Motivation</p>
                  <p className="text-[#00274c]">{selected.motivation}</p>
                </div>
              ) : null}
              {selected.notes ? (
                <div>
                  <p className="text-slate-500 mb-1">Notes</p>
                  <p className="text-[#00274c]">{selected.notes}</p>
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="rounded-xl bg-slate-50 p-2">
                  Laptop: {selected.has_laptop ? "Yes" : "No"}
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  Internet: {selected.has_internet ? "Yes" : "No"}
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  Basics: {selected.basic_computer_knowledge ? "Yes" : "No"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select an enrollment to view full details.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
