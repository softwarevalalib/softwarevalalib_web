import { useCallback, useEffect, useState } from "react";
import { portalAdmin } from "../../../utils/portalApi";

export function AdminPortalClassroom() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const data = await portalAdmin("list-classroom", {}, "GET");
    setRows(data.sessions || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">ClassRoom Sessions</h1>
        <p className="text-sm text-slate-500">
          All Meet/Zoom sessions created by instructors. Students enrolled in the course see these in real time.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
        {rows.map((s) => (
          <div key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-50 py-2">
            <div>
              <p className="font-semibold text-[#00274c]">{s.title}</p>
              <p className="text-xs text-slate-500">
                {s.course_code} · {s.session_date} · {s.start_time || "—"}–{s.end_time || "—"} ·{" "}
                {s.instructor_name || "Instructor"} · {s.platform || "Meet/Zoom"}
              </p>
              {s.description ? <p className="text-sm text-slate-600 mt-1">{s.description}</p> : null}
            </div>
            <a
              href={s.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#c10020]"
            >
              Open link
            </a>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-slate-500">No classroom sessions yet.</p> : null}
      </div>
    </div>
  );
}

export function AdminPortalAssignments() {
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(null);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const data = await portalAdmin("list-assignments", {}, "GET");
    setRows(data.assignments || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const openSubs = async (assignment) => {
    setActive(assignment);
    const data = await portalAdmin(
      "list-assignment-submissions",
      { assignmentId: assignment.id },
      "GET"
    );
    setSubs(data.submissions || []);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Assignments</h1>
        <p className="text-sm text-slate-500">
          All course assignments and student submissions across the Academy Portal.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        {rows.map((a) => (
          <div key={a.id} className="border-b border-slate-50 pb-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold text-[#00274c]">{a.title}</p>
                <p className="text-xs text-slate-500">
                  {a.course_code}
                  {a.due_at ? ` · due ${new Date(a.due_at).toLocaleString()}` : ""}
                  {a.created_by_name ? ` · by ${a.created_by_name}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-[#c10020]"
                onClick={() => openSubs(a).catch((e) => setError(e.message))}
              >
                View submissions
              </button>
            </div>
            {a.description ? <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.description}</p> : null}
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-slate-500">No assignments yet.</p> : null}
      </div>

      {active ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-2">
          <h2 className="font-display font-bold text-[#00274c]">Submissions — {active.title}</h2>
          {subs.map((s) => (
            <div key={s.id} className="border-b border-slate-50 py-2 text-sm">
              <p className="font-semibold text-[#00274c]">{s.student_name || s.student_id}</p>
              <p className="text-xs text-slate-500">
                {s.status}
                {s.score != null ? ` · ${s.score}/${s.max_score || 100}` : ""}
              </p>
              {s.content ? <p className="mt-1 text-slate-600 whitespace-pre-wrap">{s.content}</p> : null}
              {s.feedback ? <p className="text-emerald-700">Feedback: {s.feedback}</p> : null}
            </div>
          ))}
          {!subs.length ? <p className="text-sm text-slate-500">No submissions yet.</p> : null}
          <button type="button" className="text-xs underline text-slate-500" onClick={() => setActive(null)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default AdminPortalClassroom;
