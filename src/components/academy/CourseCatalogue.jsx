import { useEffect, useMemo, useState } from "react";
import academyCourses from "../../data/academyCourses";
import { ACADEMY_FILTERS } from "../../data/academyMeta";
import CourseCard from "./CourseCard";
import { fetchAcademyRatings, trackAcademyEvent } from "../../utils/academyApi";
import { fetchPublicCourses } from "../../utils/portalApi";

function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function CourseCatalogue({ ratingsMap = {}, embed = false }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All Courses");
  const [level, setLevel] = useState("All");
  const [duration, setDuration] = useState("All");
  const [price, setPrice] = useState("All");
  const [visible, setVisible] = useState(12);
  const [ratings, setRatings] = useState(ratingsMap);
  const [courses, setCourses] = useState(academyCourses);
  const debouncedQuery = useDebounced(query);

  useEffect(() => {
    fetchAcademyRatings()
      .then((data) => setRatings(data.ratings || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPublicCourses()
      .then((data) => {
        if (Array.isArray(data.courses) && data.courses.length) {
          setCourses(data.courses);
        }
      })
      .catch(() => {
        // Keep static catalogue fallback
      });
  }, []);

  const levels = useMemo(
    () => ["All", ...new Set(courses.map((c) => c.level).filter(Boolean))],
    [courses]
  );
  const durations = useMemo(
    () => ["All", ...new Set(courses.map((c) => c.duration).filter(Boolean))],
    [courses]
  );

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return courses.filter((c) => {
      if (c.status && c.status !== "published" && c.status !== "active") return false;
      if (filter !== "All Courses") {
        const match =
          c.category === filter ||
          c.programmeType === filter ||
          c.categoryFilter === filter ||
          (filter === "Certificate" && c.programmeType === "Foundation Certificate") ||
          (filter === "Diploma" && c.programmeType === "Diploma") ||
          (filter === "Comprehensive" && c.programmeType === "Comprehensive");
        if (!match) return false;
      }
      if (level !== "All" && c.level !== level) return false;
      if (duration !== "All" && c.duration !== duration) return false;
      if (price === "Under 140" && c.tuition >= 140) return false;
      if (price === "140-160" && (c.tuition < 140 || c.tuition > 160)) return false;
      if (price === "Over 160" && c.tuition <= 160) return false;
      if (!q) return true;
      return (
        (c.title || "").toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [courses, debouncedQuery, filter, level, duration, price]);

  useEffect(() => {
    setVisible(12);
    if (debouncedQuery) trackAcademyEvent("course_search", { query: debouncedQuery });
  }, [debouncedQuery, filter, level, duration, price]);

  const clear = () => {
    setQuery("");
    setFilter("All Courses");
    setLevel("All");
    setDuration("All");
    setPrice("All");
  };

  return (
    <section id="courses" className={embed ? "" : "section-padding bg-white"}>
      <div className="section-container">
        {!embed && (
          <div className="max-w-2xl mb-8">
            <span className="eyebrow">Explore All Courses</span>
            <h2 className="section-heading mt-3">Find the right programme for your goals</h2>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5 space-y-4">
          <label className="block">
            <span className="sr-only">Search courses</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#c10020] focus:ring-1 focus:ring-[#c10020]/30"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Course filters">
            {ACADEMY_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                role="listitem"
                onClick={() => {
                  setFilter(item);
                  trackAcademyEvent("course_filter", { filter: item });
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === item
                    ? "bg-[#c10020] text-white"
                    : "bg-white text-[#00274c] border border-slate-200 hover:border-[#c10020]/40"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-slate-600">
              Level
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Duration
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                {durations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Price
              <select
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="All">All</option>
                <option value="Under 140">Under US$140</option>
                <option value="140-160">US$140–160</option>
                <option value="Over 160">Over US$160</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600" aria-live="polite">
              Showing <strong>{Math.min(visible, filtered.length)}</strong> of{" "}
              <strong>{filtered.length}</strong> matching courses
            </p>
            <button type="button" onClick={clear} className="text-sm font-semibold text-[#c10020] hover:underline">
              Clear Filters
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 text-center rounded-2xl border border-dashed border-slate-200 p-10">
            <p className="text-slate-600">No courses found. Try a different search or clear filters.</p>
            <button type="button" onClick={clear} className="btn-primary mt-4">
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, visible).map((course) => (
                <CourseCard
                  key={course.id || course.code}
                  course={course}
                  rating={ratings[course.id] || ratings[course.code]}
                />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + 12)}
                  className="btn-outline"
                >
                  Load More Courses
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
