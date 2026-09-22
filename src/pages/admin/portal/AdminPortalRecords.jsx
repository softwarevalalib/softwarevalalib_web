import { useCallback, useEffect, useState } from "react";
import { portalAdmin } from "../../../utils/portalApi";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#c10020]";

export default function AdminPortalGrades() {
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId: "",
    courseCode: "",
    title: "",
    score: "",
    maxScore: "100",
    assessmentType: "assignment",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [g, s] = await Promise.all([
      portalAdmin("list-grades", {}, "GET"),
      portalAdmin("list-users", { role: "student" }, "GET"),
    ]);
    setGrades(g.grades || []);
    setStudents(s.users || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const setGradeStatus = async (gradeId, status) => {
    setError("");
    setMessage("");
    try {
      await portalAdmin("approve-grade", { gradeId, status });
      setMessage(status === "approved" ? "Grade approved — student can view and download PDF." : `Grade marked ${status}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Grades"
        subtitle="Approve instructor submissions so students can see scores and download PDFs. You can also record grades directly."
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <form
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await portalAdmin("add-grade", {
              ...form,
              score: Number(form.score),
              maxScore: Number(form.maxScore) || 100,
            });
            setForm({
              studentId: "",
              courseCode: "",
              title: "",
              score: "",
              maxScore: "100",
              assessmentType: "assignment",
            });
            await load();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <label className="text-sm font-semibold text-[#00274c]">
          Student
          <select
            className={field}
            required
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          >
            <option value="">Select…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Course code
          <input
            className={field}
            required
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Assessment title
          <input
            className={field}
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Score
          <input
            className={field}
            type="number"
            required
            value={form.score}
            onChange={(e) => setForm({ ...form, score: e.target.value })}
          />
        </label>
        <button type="submit" className="btn-primary sm:col-span-2 !py-2">
          Add grade (auto-approved)
        </button>
      </form>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-2">Student</th>
              <th className="pb-2">Course</th>
              <th className="pb-2">Title</th>
              <th className="pb-2">Score</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-t border-slate-100">
                <td className="py-3">{g.student_name}</td>
                <td className="py-3">{g.course_code}</td>
                <td className="py-3">{g.title}</td>
                <td className="py-3">
                  {g.score}/{g.max_score}
                </td>
                <td className="py-3 capitalize">{g.status || "approved"}</td>
                <td className="py-3 space-x-2 whitespace-nowrap">
                  {g.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="text-xs font-bold text-emerald-700 underline"
                        onClick={() => setGradeStatus(g.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="text-xs font-bold text-amber-700 underline"
                        onClick={() => setGradeStatus(g.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600 underline"
                    onClick={async () => {
                      await portalAdmin("delete-grade", { gradeId: g.id });
                      await load();
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!grades.length ? <p className="text-sm text-slate-500 mt-2">No grades yet.</p> : null}
      </div>
    </div>
  );
}

export function AdminPortalAttendance() {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId: "",
    courseCode: "",
    sessionDate: new Date().toISOString().slice(0, 10),
    status: "present",
  });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [a, s] = await Promise.all([
      portalAdmin("list-attendance", {}, "GET"),
      portalAdmin("list-users", { role: "student" }, "GET"),
    ]);
    setRows(a.attendance || []);
    setStudents(s.users || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  return (
    <div className="space-y-6">
      <Header title="Attendance" subtitle="Record live-session attendance." />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <form
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await portalAdmin("add-attendance", form);
            await load();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <label className="text-sm font-semibold text-[#00274c]">
          Student
          <select
            className={field}
            required
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          >
            <option value="">Select…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Course code
          <input
            className={field}
            required
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Session date
          <input
            type="date"
            className={field}
            required
            value={form.sessionDate}
            onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Status
          <select
            className={field}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </label>
        <button type="submit" className="btn-primary sm:col-span-2 !py-2">
          Add attendance
        </button>
      </form>
      <DataTable
        headers={["Student", "Course", "Date", "Status"]}
        rows={rows.map((r) => [r.student_name, r.course_code, r.session_date, r.status])}
        onDelete={async (i) => {
          await portalAdmin("delete-attendance", { attendanceId: rows[i].id });
          await load();
        }}
      />
    </div>
  );
}

export function AdminPortalFees() {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId: "",
    courseCode: "",
    amount: "",
    installmentNumber: "1",
    paymentMethod: "Mobile Money",
    status: "paid",
    reference: "",
  });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([
      portalAdmin("list-payments", {}, "GET"),
      portalAdmin("list-users", { role: "student" }, "GET"),
    ]);
    setRows(p.payments || []);
    setStudents(s.users || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  return (
    <div className="space-y-6">
      <Header
        title="Fees Payments"
        subtitle="Record tuition payments. Schedule: 1st 40%, 2nd 30%, 3rd 30%."
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <form
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await portalAdmin("add-payment", {
              ...form,
              amount: Number(form.amount),
              installmentNumber: Number(form.installmentNumber),
            });
            await load();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <label className="text-sm font-semibold text-[#00274c]">
          Student
          <select
            className={field}
            required
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          >
            <option value="">Select…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Amount (US$)
          <input
            className={field}
            type="number"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Installment
          <select
            className={field}
            value={form.installmentNumber}
            onChange={(e) => setForm({ ...form, installmentNumber: e.target.value })}
          >
            <option value="1">1st — 40%</option>
            <option value="2">2nd — 30%</option>
            <option value="3">3rd — 30%</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Payment method
          <input
            className={field}
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
          />
        </label>
        <button type="submit" className="btn-primary sm:col-span-2 !py-2">
          Record payment
        </button>
      </form>
      <DataTable
        headers={["Student", "Amount", "Installment", "Status"]}
        rows={rows.map((r) => [
          r.student_name,
          `US$${r.amount}`,
          r.installment_number ? `#${r.installment_number}` : "—",
          r.status,
        ])}
        onDelete={async (i) => {
          await portalAdmin("delete-payment", { paymentId: rows[i].id });
          await load();
        }}
      />
    </div>
  );
}

export function AdminPortalCertificates() {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId: "",
    studentName: "",
    studentEmail: "",
    courseTitle: "",
    courseCode: "",
    certificateId: "",
    fileName: "",
    fileBase64: "",
    fileMime: "application/pdf",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      portalAdmin("list-certificates", {}, "GET"),
      portalAdmin("list-users", { role: "student" }, "GET"),
    ]);
    setRows(c.certificates || []);
    setStudents(s.users || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      setForm((f) => ({
        ...f,
        fileName: file.name,
        fileMime: file.type || "application/pdf",
        fileBase64: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Certificates"
        subtitle="Upload certificates. Students verify on the Academy page with ID + email."
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <form
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            const data = await portalAdmin("upload-certificate", form);
            setMessage(`Uploaded. Certificate ID: ${data.certificate.certificate_id}`);
            setForm({
              studentId: "",
              studentName: "",
              studentEmail: "",
              courseTitle: "",
              courseCode: "",
              certificateId: "",
              fileName: "",
              fileBase64: "",
              fileMime: "application/pdf",
            });
            await load();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <label className="text-sm font-semibold text-[#00274c] sm:col-span-2">
          Link portal student (optional)
          <select
            className={field}
            value={form.studentId}
            onChange={(e) => {
              const s = students.find((x) => x.id === e.target.value);
              setForm({
                ...form,
                studentId: e.target.value,
                studentName: s?.full_name || form.studentName,
                studentEmail: s?.email || form.studentEmail,
              });
            }}
          >
            <option value="">Manual entry</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Student name
          <input
            className={field}
            required
            value={form.studentName}
            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Student email
          <input
            type="email"
            className={field}
            required
            value={form.studentEmail}
            onChange={(e) => setForm({ ...form, studentEmail: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Course title
          <input
            className={field}
            required
            value={form.courseTitle}
            onChange={(e) => setForm({ ...form, courseTitle: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Course code
          <input
            className={field}
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c] sm:col-span-2">
          Certificate file (PDF/image)
          <input
            type="file"
            accept=".pdf,image/*"
            className={field}
            required={!form.fileBase64}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        <button type="submit" className="btn-primary sm:col-span-2 !py-2">
          Upload certificate
        </button>
      </form>
      <DataTable
        headers={["Certificate ID", "Student", "Course", "Issued"]}
        rows={rows.map((r) => [
          r.certificate_id,
          r.student_name,
          r.course_title,
          r.issue_date ? new Date(r.issue_date).toLocaleDateString() : "—",
        ])}
        onDelete={async (i) => {
          await portalAdmin("delete-certificate", { certificateId: rows[i].id });
          await load();
        }}
      />
    </div>
  );
}

function Header({ title, subtitle }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#00274c]">{title}</h1>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function DataTable({ headers, rows, onDelete }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-x-auto">
      {!rows.length ? (
        <p className="text-sm text-slate-500">No records yet.</p>
      ) : (
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              {headers.map((h) => (
                <th key={h} className="pb-2 pr-3">
                  {h}
                </th>
              ))}
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {row.map((cell, j) => (
                  <td key={j} className="py-3 pr-3 capitalize">
                    {cell}
                  </td>
                ))}
                <td className="py-3">
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600 underline"
                    onClick={() => onDelete(i)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
