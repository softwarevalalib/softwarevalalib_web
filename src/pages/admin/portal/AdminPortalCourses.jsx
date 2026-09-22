import { useCallback, useEffect, useState } from "react";
import { portalAdmin } from "../../../utils/portalApi";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#c10020]";

export default function AdminPortalCourses() {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    duration: "",
    tuition: "",
    registrationFee: "",
    instructorId: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [syncInfo, setSyncInfo] = useState(null);

  const load = useCallback(async () => {
    const [c, i] = await Promise.all([
      portalAdmin("list-courses", {}, "GET"),
      portalAdmin("list-users", { role: "instructor" }, "GET"),
    ]);
    setCourses(c.courses || []);
    setSyncInfo(c.sync || null);
    setInstructors(i.users || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#00274c]">Portal Courses</h1>
          <p className="text-sm text-slate-500">
            Catalogue courses sync into the portal automatically. Edit here to update the live Academy
            catalogue and assign instructors.
          </p>
          {syncInfo ? (
            <p className="mt-1 text-xs text-slate-400">
              Last sync: {syncInfo.total} catalogue courses · {syncInfo.inserted} newly inserted
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn-outline !py-2 !px-4 !text-sm"
          onClick={async () => {
            setError("");
            try {
              const data = await portalAdmin("sync-courses");
              setCourses(data.courses || []);
              setSyncInfo(data.sync || null);
              setMessage(
                `Synced catalogue. ${data.sync?.inserted ?? 0} new course(s) added; existing admin edits preserved.`
              );
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          Sync from catalogue
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <form
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await portalAdmin("upsert-course", {
              ...form,
              tuition: Number(form.tuition) || 0,
              registrationFee: Number(form.registrationFee) || 0,
              instructorId: form.instructorId || null,
            });
            setForm({
              code: "",
              title: "",
              description: "",
              duration: "",
              tuition: "",
              registrationFee: "",
              instructorId: "",
            });
            setMessage("Course saved. Public catalogue updates immediately.");
            await load();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        {[
          ["code", "Course code"],
          ["title", "Title"],
          ["duration", "Duration"],
          ["tuition", "Tuition (US$)"],
          ["registrationFee", "Registration fee"],
        ].map(([key, label]) => (
          <label key={key} className="text-sm font-semibold text-[#00274c]">
            {label}
            <input
              className={field}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={key === "code" || key === "title"}
            />
          </label>
        ))}
        <label className="text-sm font-semibold text-[#00274c] sm:col-span-2">
          Description
          <textarea
            className={field}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-[#00274c] sm:col-span-2">
          Instructor
          <select
            className={field}
            value={form.instructorId}
            onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.full_name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary sm:col-span-2 !py-2">
          Save course
        </button>
      </form>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-50 pb-3">
            <div>
              <p className="font-semibold text-[#00274c]">
                {c.code} — {c.title}
              </p>
              <p className="text-xs text-slate-500">
                US${c.tuition} + ${c.registration_fee} reg. · {c.instructor_name || "No instructor"} ·{" "}
                {c.status}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="text-xs font-bold text-[#00274c] underline"
                onClick={() =>
                  setForm({
                    code: c.code || "",
                    title: c.title || "",
                    description: c.description || "",
                    duration: c.duration || "",
                    tuition: String(c.tuition ?? ""),
                    registrationFee: String(c.registration_fee ?? ""),
                    instructorId: c.instructor_id || "",
                  })
                }
              >
                Edit
              </button>
              <button
                type="button"
                className="text-xs font-bold text-red-600 underline"
                onClick={async () => {
                  await portalAdmin("delete-course", { courseId: c.id });
                  await load();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!courses.length ? <p className="text-sm text-slate-500">No portal courses yet.</p> : null}
      </div>
    </div>
  );
}
