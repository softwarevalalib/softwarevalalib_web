import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import Footer from "../components/Footer";
import { getCourseByCode } from "../data/academyCourses";

const STORAGE_KEY = "svl_academy_admin_key";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[#00274c] outline-none transition focus:border-[#c10020] focus:ring-1 focus:ring-[#c10020]/30";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function courseLabel(code) {
  const course = getCourseByCode(code);
  return course ? `${code} — ${course.shortTitle || course.title}` : code;
}

export default function AcademyAdmin() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Academy Admin | SVL Training Academy";
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAdminKey(saved);
        setInputKey(saved);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  useEffect(() => {
    if (!adminKey) return undefined;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/academy/enroll", {
          headers: {
            Accept: "application/json",
            "x-academy-admin-key": adminKey,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setAuthorized(false);
          setStats(null);
          setEnrollments([]);
          setError(data.error || "Unauthorized. Check your admin key.");
          return;
        }
        setAuthorized(true);
        setStats(data.stats || null);
        setEnrollments(Array.isArray(data.enrollments) ? data.enrollments : []);
      } catch {
        if (!cancelled) {
          setAuthorized(false);
          setError("Unable to load enrollments. Try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [adminKey]);

  const handleUnlock = (e) => {
    e.preventDefault();
    const key = inputKey.trim();
    if (!key) {
      setError("Enter the admin key.");
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, key);
    } catch {
      // ignore
    }
    setAdminKey(key);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setAdminKey("");
    setInputKey("");
    setAuthorized(false);
    setStats(null);
    setEnrollments([]);
    setError("");
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-[#00274c] text-white">
        <div className="section-container section-padding py-12 sm:py-14">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              SVL Training Academy
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold">Enrollments Admin</h1>
            <p className="mt-3 max-w-2xl text-white/80 text-sm sm:text-base">
              View enrollment applications. Courses are managed in the site data file —
              this page is an enrollments viewer only, not a full CMS.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container space-y-8">
          <Reveal>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <strong className="font-semibold">Server setup:</strong> set{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
                ACADEMY_ADMIN_KEY
              </code>{" "}
              in the server environment. Requests send this value as the{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
                x-academy-admin-key
              </code>{" "}
              header. The key is stored in{" "}
              <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
                sessionStorage
              </code>{" "}
              for this browser session only.
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <form
              onSubmit={handleUnlock}
              className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm max-w-xl"
            >
              <h2 className="font-display text-xl font-bold text-[#00274c]">
                Admin access
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter the academy admin key to load enrollments.
              </p>
              <label className="mt-5 mb-1.5 block text-sm font-semibold text-[#00274c]" htmlFor="adminKey">
                Admin key
              </label>
              <input
                id="adminKey"
                type="password"
                className={fieldClass}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="current-password"
                placeholder="ACADEMY_ADMIN_KEY value"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Loading…" : authorized ? "Refresh" : "Unlock"}
                </button>
                {adminKey ? (
                  <button type="button" className="btn-outline" onClick={handleLogout}>
                    Clear key
                  </button>
                ) : null}
                <Link to="/academy" className="btn-outline">
                  Back to Academy
                </Link>
              </div>
              {error ? (
                <p className="mt-4 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </Reveal>

          {authorized && stats ? (
            <Reveal>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total applications", value: stats.total },
                  { label: "Pending", value: stats.pending },
                  { label: "Approved", value: stats.approved },
                  { label: "Enrolled", value: stats.enrolled },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-[#00274c]">
                      {item.value ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          ) : null}

          {authorized ? (
            <Reveal delay={0.05}>
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-[#00274c]">
                    Recent enrollments
                  </h2>
                  <p className="text-sm text-slate-500">
                    Showing {enrollments.length} record{enrollments.length === 1 ? "" : "s"}
                  </p>
                </div>

                {loading ? (
                  <p className="p-6 text-sm text-slate-500">Loading enrollments…</p>
                ) : enrollments.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">No enrollments yet.</p>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Reference</th>
                            <th className="px-4 py-3 font-semibold">Applicant</th>
                            <th className="px-4 py-3 font-semibold">Contact</th>
                            <th className="px-4 py-3 font-semibold">Courses</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map((row) => {
                            const codes = Array.isArray(row.course_codes)
                              ? row.course_codes
                              : [];
                            return (
                              <tr
                                key={row.id || row.reference_number}
                                className="border-t border-slate-100 align-top"
                              >
                                <td className="px-4 py-3 font-semibold text-[#00274c] whitespace-nowrap">
                                  {row.reference_number}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-[#00274c]">{row.full_name}</p>
                                  {row.occupation ? (
                                    <p className="text-xs text-slate-500">{row.occupation}</p>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  <p>{row.email}</p>
                                  <p className="text-xs">{row.phone}</p>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  <ul className="space-y-1">
                                    {codes.map((code) => (
                                      <li key={code} className="text-xs">
                                        {courseLabel(code)}
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-[#00274c]">
                                    {row.status || "pending"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                  {formatDate(row.created_at)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden divide-y divide-slate-100">
                      {enrollments.map((row) => {
                        const codes = Array.isArray(row.course_codes)
                          ? row.course_codes
                          : [];
                        return (
                          <article
                            key={row.id || row.reference_number}
                            className="p-5 space-y-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-semibold text-[#00274c]">
                                {row.reference_number}
                              </p>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-[#00274c]">
                                {row.status || "pending"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-[#00274c]">{row.full_name}</p>
                              <p className="text-sm text-slate-600">{row.email}</p>
                              <p className="text-sm text-slate-500">{row.phone}</p>
                            </div>
                            <ul className="space-y-1">
                              {codes.map((code) => (
                                <li key={code} className="text-xs text-slate-600">
                                  {courseLabel(code)}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-slate-400">
                              {formatDate(row.created_at)}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      <Footer />
    </div>
  );
}
