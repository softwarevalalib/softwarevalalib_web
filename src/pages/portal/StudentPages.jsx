import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  downloadGradePdf,
  fetchStudentDashboard,
  portalAction,
  readFileAsBase64,
} from "../../utils/portalApi";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#c10020]";

function Alert({ tone = "red", children }) {
  const cls =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";
  return <p className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</p>;
}

export default function StudentDashboard() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudentDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  const cards = [
    { label: "Grades", value: data.grades?.length || 0 },
    { label: "Assignments", value: data.assignments?.length || 0 },
    { label: "Classes", value: data.classrooms?.length || 0 },
    { label: "Attendance", value: data.attendance?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Student Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome, {user?.fullName}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-[#00274c]">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wider text-slate-400">Enrolled courses</p>
        <p className="mt-2 text-sm text-[#00274c] font-semibold">
          {(Array.isArray(user?.courseCodes) ? user.courseCodes : []).join(", ") || "—"}
        </p>
      </div>
    </div>
  );
}

export function StudentGrades() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudentDashboard()
      .then((d) => setRows(d.grades || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">My Grades</h1>
      <p className="text-sm text-slate-500">Approved grades only. Download the official PDF anytime.</p>
      {error ? <Alert>{error}</Alert> : null}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
        {rows.map((g) => (
          <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 py-2">
            <div>
              <p className="font-semibold text-[#00274c]">{g.title}</p>
              <p className="text-xs text-slate-500">
                {g.course_code} · {g.score}/{g.max_score}
                {g.grade_letter ? ` · ${g.grade_letter}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[#c10020]"
              onClick={() => downloadGradePdf(g.id).catch((e) => setError(e.message))}
            >
              Download PDF
            </button>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-slate-500">No approved grades yet.</p> : null}
      </div>
    </div>
  );
}

export function StudentAttendance() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchStudentDashboard().then((d) => setRows(d.attendance || []));
  }, []);
  return (
    <Panel title="My Attendance">
      {rows.map((a) => (
        <p key={a.id} className="text-sm border-b border-slate-50 py-2">
          {a.session_date} · {a.course_code} · <span className="font-semibold">{a.status}</span>
        </p>
      ))}
      {!rows.length ? <Empty /> : null}
    </Panel>
  );
}

export function StudentFees() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchStudentDashboard().then((d) => setRows(d.payments || []));
  }, []);
  return (
    <Panel title="My Fees">
      {rows.map((p) => (
        <p key={p.id} className="text-sm border-b border-slate-50 py-2">
          US${p.amount} · {p.course_code || "—"} · {p.status}
          {p.installment_number ? ` · installment ${p.installment_number}` : ""}
        </p>
      ))}
      {!rows.length ? <Empty /> : null}
    </Panel>
  );
}

export function StudentCertificates() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetchStudentDashboard().then((d) => setRows(d.certificates || []));
  }, []);
  return (
    <Panel title="My Certificates">
      {rows.map((c) => (
        <p key={c.id} className="text-sm border-b border-slate-50 py-2">
          {c.course_title} · {c.certificate_id} · {c.issue_date}
        </p>
      ))}
      {!rows.length ? <Empty /> : null}
    </Panel>
  );
}

export function StudentAssignments() {
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = () =>
    fetchStudentDashboard().then((d) => setRows(d.assignments || []));

  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!active) return;
    setError("");
    setMessage("");
    try {
      let attachment = {};
      if (file) {
        const f = await readFileAsBase64(file);
        attachment = {
          attachmentBase64: f.base64,
          attachmentName: f.name,
          attachmentMime: f.mime,
        };
      }
      await portalAction("submit-assignment", {
        assignmentId: active.id,
        content,
        ...attachment,
      });
      setMessage("Assignment submitted. Your instructor can grade it now.");
      setContent("");
      setFile(null);
      setActive(null);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">Assignments</h1>
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="green">{message}</Alert> : null}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        {rows.map((a) => (
          <div key={a.id} className="border border-slate-100 rounded-xl p-4 space-y-2">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold text-[#00274c]">{a.title}</p>
                <p className="text-xs text-slate-500">
                  {a.course_code}
                  {a.due_at ? ` · due ${new Date(a.due_at).toLocaleString()}` : ""}
                </p>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {a.submission_status
                  ? a.submission_status === "graded"
                    ? `Graded: ${a.submission_score}/${a.submission_max_score}`
                    : "Submitted"
                  : "Not submitted"}
              </p>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.description || "—"}</p>
            {a.submission_feedback ? (
              <p className="text-sm text-emerald-700">Feedback: {a.submission_feedback}</p>
            ) : null}
            <button
              type="button"
              className="text-xs font-semibold text-[#c10020]"
              onClick={() => {
                setActive(a);
                setContent(a.submission_content || "");
              }}
            >
              {a.submission_id ? "Update submission" : "Do assignment"}
            </button>
          </div>
        ))}
        {!rows.length ? <Empty /> : null}
      </div>

      {active ? (
        <form onSubmit={submit} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-display font-bold text-[#00274c]">Submit: {active.title}</h2>
          <label className="block text-sm font-semibold text-[#00274c]">
            Your work
            <textarea
              className={field}
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-[#00274c]">
            File attachment (optional)
            <input type="file" className={field} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Send to instructor
            </button>
            <button type="button" className="btn-outline" onClick={() => setActive(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function StudentClassroom() {
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    fetchStudentDashboard().then((d) => setRows(d.classrooms || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">ClassRoom</h1>
      <p className="text-sm text-slate-500">Upcoming and past live classes for your enrolled courses.</p>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
        {rows.map((s) => (
          <div key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-50 py-2">
            <div>
              <p className="font-semibold text-[#00274c]">{s.title}</p>
              <p className="text-xs text-slate-500">
                {s.course_code} · {s.session_date} · {s.start_time || "—"}–{s.end_time || "—"}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                className="text-xs font-semibold text-slate-600 underline"
                onClick={() => setActive(s)}
              >
                Details
              </button>
              <a
                href={s.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#c10020]"
              >
                Join class
              </a>
            </div>
          </div>
        ))}
        {!rows.length ? <Empty /> : null}
      </div>
      {active ? (
        <div className="rounded-2xl border border-[#00274c]/15 bg-white p-5 shadow-sm space-y-2">
          <h3 className="font-display font-bold text-[#00274c]">{active.title}</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{active.description || "—"}</p>
          <p className="text-sm">
            {active.platform} · {active.session_date} · {active.start_time} – {active.end_time}
          </p>
          <a href={active.meeting_url} target="_blank" rel="noreferrer" className="btn-primary inline-flex !py-2 !px-4 !text-sm">
            Join now
          </a>
          <button type="button" className="block text-xs underline text-slate-500" onClick={() => setActive(null)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">{title}</h1>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-slate-500">No records yet.</p>;
}
