import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchStudentDashboard } from "../../utils/portalApi";

export default function StudentDashboard() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudentDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Student Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {user?.fullName}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Courses", (user?.courseCodes || []).length],
          ["Grades", data.grades?.length || 0],
          ["Attendance records", data.attendance?.length || 0],
          ["Certificates", data.certificates?.length || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-[#00274c]">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="font-display font-bold text-[#00274c]">Your courses</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {(user?.courseCodes || []).length ? (
            user.courseCodes.map((c) => (
              <li key={c} className="font-medium text-[#00274c]">
                {c}
              </li>
            ))
          ) : (
            <li className="text-slate-500">No courses assigned yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function StudentGrades() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchStudentDashboard().then((d) => setRows(d.grades || []));
  }, []);
  return (
    <Section title="Grades">
      <Table
        headers={["Course", "Assessment", "Score", "Date"]}
        rows={rows.map((r) => [
          r.course_code,
          r.title,
          `${r.score ?? "—"} / ${r.max_score ?? 100}`,
          r.created_at ? new Date(r.created_at).toLocaleDateString() : "—",
        ])}
      />
    </Section>
  );
}

export function StudentAttendance() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchStudentDashboard().then((d) => setRows(d.attendance || []));
  }, []);
  return (
    <Section title="Attendance">
      <Table
        headers={["Course", "Date", "Status"]}
        rows={rows.map((r) => [r.course_code, r.session_date, r.status])}
      />
    </Section>
  );
}

export function StudentFees() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchStudentDashboard().then((d) => setRows(d.payments || []));
  }, []);
  return (
    <Section title="Fees & Payments">
      <p className="mb-3 text-sm text-slate-500">
        Tuition is paid in three installments: 40% · 30% · 30%.
      </p>
      <Table
        headers={["Amount", "Installment", "Method", "Status", "Date"]}
        rows={rows.map((r) => [
          `US$${r.amount}`,
          r.installment_number ? `#${r.installment_number}` : "—",
          r.payment_method || "—",
          r.status,
          r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "—",
        ])}
      />
    </Section>
  );
}

export function StudentCertificates() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchStudentDashboard().then((d) => setRows(d.certificates || []));
  }, []);
  return (
    <Section title="Certificates">
      <Table
        headers={["Certificate ID", "Course", "Issued"]}
        rows={rows.map((r) => [
          r.certificate_id,
          r.course_title,
          r.issue_date ? new Date(r.issue_date).toLocaleDateString() : "—",
        ])}
      />
    </Section>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">{title}</h1>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

function Table({ headers, rows }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No records yet.</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-wider text-slate-400">
        <tr>
          {headers.map((h) => (
            <th key={h} className="pb-3 pr-4">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t border-slate-100">
            {row.map((cell, j) => (
              <td key={j} className="py-3 pr-4 capitalize">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
