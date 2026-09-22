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

  const load = useCallback(async () => {
    const [c, i] = await Promise.all([
      portalAdmin("list-courses", {}, "GET"),
      portalAdmin("list-users", { role: "instructor" }, "GET"),
    ]);
    setCourses(c.courses || []);
    setInstructors(i.users || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Portal Courses</h1>
        <p className="text-sm text-slate-500">Manage courses assigned in the Academy Portal.</p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
                US${c.tuition} + ${c.registration_fee} reg. · {c.instructor_name || "No instructor"}
              </p>
            </div>
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
        ))}
        {!courses.length ? <p className="text-sm text-slate-500">No portal courses yet.</p> : null}
      </div>
    </div>
  );
}
