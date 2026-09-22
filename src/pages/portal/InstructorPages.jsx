import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchInstructorDashboard } from "../../utils/portalApi";

export default function InstructorDashboard() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInstructorDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Instructor Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome, {user?.fullName}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400">Courses</p>
          <p className="mt-2 font-display text-3xl font-bold text-[#00274c]">
            {data.courses?.length || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400">Students</p>
          <p className="mt-2 font-display text-3xl font-bold text-[#00274c]">
            {data.students?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

export function InstructorCourses() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchInstructorDashboard().then((d) => setRows(d.courses || []));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">My Courses</h1>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        {rows.length ? (
          rows.map((c) => (
            <div key={c.id} className="border-b border-slate-50 pb-3">
              <p className="font-semibold text-[#00274c]">
                {c.code} — {c.title}
              </p>
              <p className="text-xs text-slate-500">
                {c.duration || "—"} · Tuition US${c.tuition || 0}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No courses assigned yet.</p>
        )}
      </div>
    </div>
  );
}

export function InstructorStudents() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchInstructorDashboard().then((d) => setRows(d.students || []));
  }, []);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">Students</h1>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-3">Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Courses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-3 font-medium text-[#00274c]">{s.full_name}</td>
                <td className="py-3">{s.email}</td>
                <td className="py-3 text-xs">
                  {(Array.isArray(s.course_codes) ? s.course_codes : []).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="text-sm text-slate-500">No students yet.</p> : null}
      </div>
    </div>
  );
}
