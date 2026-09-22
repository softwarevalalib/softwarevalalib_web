import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  downloadGradePdf,
  fetchInstructorDashboard,
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

export default function InstructorDashboard() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInstructorDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  const cards = [
    { label: "Assigned courses", value: data.courses?.length || 0 },
    { label: "Students", value: data.students?.length || 0 },
    { label: "Assignments", value: data.assignments?.length || 0 },
    { label: "Classroom sessions", value: data.classrooms?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Instructor Dashboard</h1>
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
      <p className="text-sm text-slate-500">Only courses assigned to you by Admin.</p>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        {rows.length ? (
          rows.map((c) => (
            <div key={c.id} className="border-b border-slate-50 pb-3 last:border-0">
              <p className="font-semibold text-[#00274c]">
                {c.code} — {c.title}
              </p>
              <p className="text-xs text-slate-500">
                {c.duration || "—"} · Tuition US${c.tuition || 0} · {c.status}
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
  const [courses, setCourses] = useState([]);
  const [courseCode, setCourseCode] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [perf, setPerf] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInstructorDashboard().then((d) => {
      setCourses(d.courses || []);
      if (d.courses?.[0]) setCourseCode(d.courses[0].code);
    });
  }, []);

  useEffect(() => {
    if (!courseCode) return;
    portalAction("list-students-by-course", { courseCode }, "GET")
      .then((d) => setRows(d.students || []))
      .catch((e) => setError(e.message));
  }, [courseCode]);

  const viewPerformance = async (studentId) => {
    setError("");
    try {
      const data = await portalAction("student-performance", { studentId }, "GET");
      setSelected(studentId);
      setPerf(data);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">Students</h1>
      <label className="block text-sm font-semibold text-[#00274c] max-w-md">
        Filter by course
        <select className={field} value={courseCode} onChange={(e) => setCourseCode(e.target.value)}>
          {courses.map((c) => (
            <option key={c.id} value={c.code}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </label>
      {error ? <Alert>{error}</Alert> : null}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-3">Name</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-3 font-medium text-[#00274c]">{s.full_name}</td>
                <td className="py-3">{s.email}</td>
                <td className="py-3">
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#c10020] hover:underline"
                    onClick={() => viewPerformance(s.id)}
                  >
                    View records
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="text-sm text-slate-500">No students for this course.</p> : null}
      </div>
      {perf && selected ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-display font-bold text-[#00274c]">
            Performance — {perf.student?.full_name}
          </h2>
          <p className="text-xs text-slate-500">
            Grades: {perf.grades?.length || 0} · Attendance: {perf.attendance?.length || 0} ·
            Assignment submissions: {perf.submissions?.length || 0}
          </p>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div>
              <p className="font-semibold mb-2">Grades</p>
              {(perf.grades || []).slice(0, 8).map((g) => (
                <p key={g.id} className="text-slate-600 border-b border-slate-50 py-1">
                  {g.title}: {g.score}/{g.max_score} ({g.status || "approved"})
                </p>
              ))}
            </div>
            <div>
              <p className="font-semibold mb-2">Attendance</p>
              {(perf.attendance || []).slice(0, 8).map((a) => (
                <p key={a.id} className="text-slate-600 border-b border-slate-50 py-1">
                  {a.session_date}: {a.status}
                </p>
              ))}
            </div>
            <div>
              <p className="font-semibold mb-2">Assignments</p>
              {(perf.submissions || []).slice(0, 8).map((s) => (
                <p key={s.id} className="text-slate-600 border-b border-slate-50 py-1">
                  {s.assignment_title}: {s.status}
                  {s.score != null ? ` · ${s.score}/${s.max_score}` : ""}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function InstructorAttendance() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    courseCode: "",
    studentId: "",
    sessionDate: new Date().toISOString().slice(0, 10),
    status: "present",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInstructorDashboard().then((d) => {
      setCourses(d.courses || []);
      setRows(d.attendance || []);
      if (d.courses?.[0]) setForm((f) => ({ ...f, courseCode: d.courses[0].code }));
    });
  }, []);

  useEffect(() => {
    if (!form.courseCode) return;
    portalAction("list-students-by-course", { courseCode: form.courseCode }, "GET").then((d) =>
      setStudents(d.students || [])
    );
  }, [form.courseCode]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await portalAction("instructor-add-attendance", form);
      setMessage("Attendance recorded.");
      const d = await fetchInstructorDashboard();
      setRows(d.attendance || []);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">Attendance</h1>
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="green">{message}</Alert> : null}
      <form onSubmit={submit} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#00274c]">
          Course
          <select
            className={field}
            required
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value, studentId: "" })}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Student
          <select
            className={field}
            required
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Date
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
        <button type="submit" className="btn-primary sm:col-span-2 w-fit">
          Save attendance
        </button>
      </form>
      <RecordList
        title="Recent attendance"
        rows={rows}
        render={(a) => `${a.session_date} · ${a.course_code} · ${a.student_name || a.student_id} · ${a.status}`}
      />
    </div>
  );
}

export function InstructorGrades() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    courseCode: "",
    studentId: "",
    title: "",
    score: "",
    maxScore: "100",
    assessmentType: "assessment",
    notes: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = () =>
    fetchInstructorDashboard().then((d) => {
      setCourses(d.courses || []);
      setRows(d.grades || []);
      if (!form.courseCode && d.courses?.[0]) {
        setForm((f) => ({ ...f, courseCode: d.courses[0].code }));
      }
    });

  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!form.courseCode) return;
    portalAction("list-students-by-course", { courseCode: form.courseCode }, "GET").then((d) =>
      setStudents(d.students || [])
    );
  }, [form.courseCode]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await portalAction("instructor-submit-grade", {
        ...form,
        score: form.score === "" ? null : Number(form.score),
        maxScore: Number(form.maxScore) || 100,
      });
      setMessage(data.message || "Grade submitted for admin approval.");
      setForm((f) => ({ ...f, title: "", score: "", notes: "" }));
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">Grades</h1>
      <p className="text-sm text-slate-500">
        Submit grades for admin approval. Students see grades after Admin approves.
      </p>
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="green">{message}</Alert> : null}
      <form onSubmit={submit} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#00274c]">
          Course
          <select
            className={field}
            required
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value, studentId: "" })}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Student
          <select
            className={field}
            required
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c] sm:col-span-2">
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
            type="number"
            className={field}
            required
            value={form.score}
            onChange={(e) => setForm({ ...form, score: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Max score
          <input
            type="number"
            className={field}
            value={form.maxScore}
            onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
          />
        </label>
        <button type="submit" className="btn-primary sm:col-span-2 w-fit">
          Submit for admin approval
        </button>
      </form>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
        {(rows || []).map((g) => (
          <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 py-2 text-sm">
            <div>
              <p className="font-semibold text-[#00274c]">
                {g.student_name} · {g.title}
              </p>
              <p className="text-xs text-slate-500">
                {g.course_code} · {g.score}/{g.max_score} · {g.status || "approved"}
              </p>
            </div>
            {g.status === "approved" || !g.status ? (
              <button
                type="button"
                className="text-xs font-semibold text-[#c10020]"
                onClick={() => downloadGradePdf(g.id).catch((e) => setError(e.message))}
              >
                Download PDF
              </button>
            ) : null}
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-slate-500">No grades yet.</p> : null}
      </div>
    </div>
  );
}

export function InstructorAssignments() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({
    courseCode: "",
    title: "",
    description: "",
    dueAt: "",
    file: null,
  });
  const [gradeForm, setGradeForm] = useState({ submissionId: "", score: "", feedback: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = async () => {
    const d = await fetchInstructorDashboard();
    setCourses(d.courses || []);
    setAssignments(d.assignments || []);
    if (!form.courseCode && d.courses?.[0]) {
      setForm((f) => ({ ...f, courseCode: d.courses[0].code }));
    }
  };

  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      let attachment = {};
      if (form.file) {
        const file = await readFileAsBase64(form.file);
        attachment = {
          attachmentBase64: file.base64,
          attachmentName: file.name,
          attachmentMime: file.mime,
        };
      }
      await portalAction("create-assignment", {
        courseCode: form.courseCode,
        title: form.title,
        description: form.description,
        dueAt: form.dueAt || null,
        ...attachment,
      });
      setMessage("Assignment sent to enrolled students.");
      setForm((f) => ({ ...f, title: "", description: "", dueAt: "", file: null }));
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const openSubs = async (assignmentId) => {
    setSelected(assignmentId);
    const d = await portalAction("list-assignment-submissions", { assignmentId }, "GET");
    setSubmissions(d.submissions || []);
  };

  const gradeSub = async (e) => {
    e.preventDefault();
    try {
      await portalAction("grade-assignment-submission", {
        submissionId: gradeForm.submissionId,
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback,
      });
      setMessage("Assignment graded. Student can see the score in real time.");
      if (selected) await openSubs(selected);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">Assignments</h1>
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="green">{message}</Alert> : null}
      <form onSubmit={create} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3">
        <label className="text-sm font-semibold text-[#00274c]">
          Course
          <select
            className={field}
            required
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Title
          <input
            className={field}
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Description
          <textarea
            className={field}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Due date
          <input
            type="datetime-local"
            className={field}
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Attachment (optional)
          <input
            type="file"
            className={field}
            onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
          />
        </label>
        <button type="submit" className="btn-primary w-fit">
          Send assignment
        </button>
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
        {assignments.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 py-2">
            <div>
              <p className="font-semibold text-[#00274c]">{a.title}</p>
              <p className="text-xs text-slate-500">
                {a.course_code}
                {a.due_at ? ` · due ${new Date(a.due_at).toLocaleString()}` : ""}
              </p>
            </div>
            <button type="button" className="text-xs font-semibold text-[#c10020]" onClick={() => openSubs(a.id)}>
              View submissions
            </button>
          </div>
        ))}
        {!assignments.length ? <p className="text-sm text-slate-500">No assignments yet.</p> : null}
      </div>

      {selected ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-display font-bold text-[#00274c]">Submissions</h2>
          {submissions.map((s) => (
            <div key={s.id} className="border border-slate-100 rounded-xl p-3 text-sm space-y-1">
              <p className="font-semibold">
                {s.student_name} · {s.status}
                {s.score != null ? ` · ${s.score}/${s.max_score}` : ""}
              </p>
              <p className="text-slate-600 whitespace-pre-wrap">{s.content || "—"}</p>
              {s.status !== "graded" ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[#c10020]"
                  onClick={() => setGradeForm({ submissionId: s.id, score: "", feedback: "" })}
                >
                  Grade this
                </button>
              ) : null}
            </div>
          ))}
          {!submissions.length ? <p className="text-sm text-slate-500">No submissions yet.</p> : null}
          {gradeForm.submissionId ? (
            <form onSubmit={gradeSub} className="grid gap-2 sm:grid-cols-2 border-t border-slate-100 pt-3">
              <label className="text-sm font-semibold">
                Score
                <input
                  type="number"
                  className={field}
                  required
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Feedback
                <textarea
                  className={field}
                  rows={2}
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                />
              </label>
              <button type="submit" className="btn-primary w-fit">
                Save grade
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function InstructorClassroom() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({
    courseCode: "",
    title: "",
    description: "",
    sessionDate: new Date().toISOString().slice(0, 10),
    startTime: "19:00",
    endTime: "20:30",
    meetingUrl: "",
    platform: "Google Meet",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);

  const reload = async () => {
    const d = await fetchInstructorDashboard();
    setCourses(d.courses || []);
    setSessions(d.classrooms || []);
    if (!form.courseCode && d.courses?.[0]) {
      setForm((f) => ({ ...f, courseCode: d.courses[0].code }));
    }
  };

  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await portalAction("create-classroom", form);
      setMessage("Class scheduled. Enrolled students can see it and join.");
      setForm((f) => ({ ...f, title: "", description: "", meetingUrl: "" }));
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">ClassRoom</h1>
      <p className="text-sm text-slate-500">
        Schedule live sessions with Google Meet or Zoom. Only students enrolled in the selected course
        receive the class.
      </p>
      {error ? <Alert>{error}</Alert> : null}
      {message ? <Alert tone="green">{message}</Alert> : null}
      <form onSubmit={submit} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#00274c]">
          Course
          <select
            className={field}
            required
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Platform
          <select
            className={field}
            value={form.platform}
            onChange={(e) => setForm({ ...form, platform: e.target.value })}
          >
            <option>Google Meet</option>
            <option>Zoom</option>
            <option>Other</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-[#00274c] sm:col-span-2">
          Title
          <input
            className={field}
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c] sm:col-span-2">
          Description
          <textarea
            className={field}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c]">
          Date
          <input
            type="date"
            className={field}
            required
            value={form.sessionDate}
            onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm font-semibold text-[#00274c]">
            Start
            <input
              type="time"
              className={field}
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold text-[#00274c]">
            End
            <input
              type="time"
              className={field}
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </label>
        </div>
        <label className="text-sm font-semibold text-[#00274c] sm:col-span-2">
          Meeting link
          <input
            className={field}
            required
            placeholder="https://meet.google.com/… or Zoom URL"
            value={form.meetingUrl}
            onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
          />
        </label>
        <button type="submit" className="btn-primary w-fit">
          Send to students
        </button>
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-[#00274c]">Class history</h2>
        {sessions.map((s) => (
          <div key={s.id} className="border-b border-slate-50 py-2 flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold text-[#00274c]">{s.title}</p>
              <p className="text-xs text-slate-500">
                {s.course_code} · {s.session_date} · {s.start_time || "—"}–{s.end_time || "—"} ·{" "}
                {s.platform}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[#c10020]"
              onClick={() => setActive(s)}
            >
              View details
            </button>
          </div>
        ))}
        {!sessions.length ? <p className="text-sm text-slate-500">No classroom sessions yet.</p> : null}
      </div>

      {active ? (
        <div className="rounded-2xl border border-[#00274c]/15 bg-white p-5 shadow-sm space-y-2">
          <h3 className="font-display font-bold text-[#00274c]">{active.title}</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{active.description || "—"}</p>
          <p className="text-sm">
            {active.session_date} · {active.start_time} – {active.end_time}
          </p>
          <a
            href={active.meeting_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex btn-primary !py-2 !px-4 !text-sm"
          >
            Open class link
          </a>
          <button type="button" className="block text-xs text-slate-500 underline" onClick={() => setActive(null)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RecordList({ title, rows, render }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
      <h2 className="font-display font-bold text-[#00274c]">{title}</h2>
      {(rows || []).slice(0, 30).map((r) => (
        <p key={r.id} className="text-sm text-slate-600 border-b border-slate-50 py-1">
          {render(r)}
        </p>
      ))}
      {!rows?.length ? <p className="text-sm text-slate-500">No records yet.</p> : null}
    </div>
  );
}
