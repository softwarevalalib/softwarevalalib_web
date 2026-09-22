import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import Footer from "../components/Footer";
import StarRating from "../components/StarRating";
import AcademyImage from "../components/academy/AcademyImage";
import CourseCard from "../components/academy/CourseCard";
import { getCourseBySlug, getRelatedCourses } from "../data/academyCourses";
import {
  LEARNING_MODEL,
  PASSING_SCORE,
  SESSION_GROUPS,
  TIMEZONE_NOTE,
  WEEKLY_COMMITMENT,
} from "../data/academyMeta";
import {
  getOrCreateReviewerKey,
  submitCourseRating,
  trackAcademyEvent,
} from "../utils/academyApi";

export default function AcademyCourse() {
  const { slug } = useParams();
  const course = useMemo(() => getCourseBySlug(slug), [slug]);
  const related = useMemo(() => {
    if (!course) return [];
    return getRelatedCourses(course, 3).filter((c) => c.status === "published");
  }, [course]);

  const [rating, setRating] = useState({ averageRating: 0, ratingCount: 0 });
  const [relatedRatings, setRelatedRatings] = useState({});
  const [userStars, setUserStars] = useState(0);
  const [ratingStatus, setRatingStatus] = useState({ type: "", message: "" });
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!course) {
      document.title = "Course Not Found | SVL Training Academy";
      return;
    }
    document.title = `${course.title} | SVL Training Academy`;
    trackAcademyEvent("course_view", { course: course.code, slug: course.slug });
  }, [course]);

  useEffect(() => {
    if (!course) return undefined;
    let cancelled = false;

    fetch(`/api/academy/ratings?courseId=${encodeURIComponent(course.id)}`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setRating({
          averageRating: Number(data.averageRating || 0),
          ratingCount: Number(data.ratingCount || 0),
        });
      })
      .catch(() => {});

    fetch("/api/academy/ratings", { headers: { Accept: "application/json" } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.ratings) return;
        setRelatedRatings(data.ratings);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [course]);

  const session = useMemo(() => {
    if (!course?.sessionGroup) return null;
    return SESSION_GROUPS.find((g) => g.id === course.sessionGroup) || null;
  }, [course]);

  const handleRate = async (stars) => {
    if (!course || submittingRating) return;
    setUserStars(stars);
    setSubmittingRating(true);
    setRatingStatus({ type: "", message: "" });
    try {
      const data = await submitCourseRating({
        courseId: course.id,
        rating: stars,
        reviewerKey: getOrCreateReviewerKey(),
      });
      setRating({
        averageRating: Number(data.averageRating || 0),
        ratingCount: Number(data.ratingCount || 0),
      });
      setRatingStatus({ type: "success", message: data.message || "Thank you for your rating." });
      trackAcademyEvent("course_rating", { course: course.code, rating: stars });
    } catch (error) {
      setRatingStatus({
        type: "error",
        message: error.message || "Unable to submit rating. Please try again.",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!course || course.status !== "published") {
    return (
      <div>
        <section className="min-h-[60vh] flex items-center justify-center section-padding bg-slate-50">
          <div className="section-container max-w-lg text-center">
            <p className="text-6xl font-extrabold text-[#00274c]/20">404</p>
            <h1 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-[#00274c]">
              Course not found
            </h1>
            <p className="mt-3 text-slate-600">
              This course may have been moved or is no longer available.
            </p>
            <Link to="/academy#courses" className="btn-primary mt-8 inline-flex">
              Back to Courses
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const count = rating.ratingCount || 0;
  const average = rating.averageRating || 0;

  return (
    <div className="bg-white">
      <section className="relative bg-[#00274c] text-white overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[#c10020]/20 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>
        <div className="section-container section-padding relative z-10">
          <Reveal>
            <nav className="text-sm text-white/70 mb-6" aria-label="Breadcrumb">
              <Link to="/academy" className="hover:text-white transition">
                Academy
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <Link to="/academy#courses" className="hover:text-white transition">
                Courses
              </Link>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="text-white">{course.code}</span>
            </nav>
          </Reveal>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-wider text-[#ff6b81]">
                {course.category}
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {course.title}
              </h1>
              <p className="mt-4 text-white/80 leading-relaxed max-w-2xl">{course.description}</p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white/10 px-3 py-1.5">{course.code}</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">{course.level}</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">{course.duration}</span>
                <span className="rounded-full bg-[#c10020] px-3 py-1.5 font-semibold">
                  US${course.tuition}
                  {course.registrationFee
                    ? ` + $${course.registrationFee} registration`
                    : ""}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 min-h-[1.5rem]">
                {count > 0 ? (
                  <>
                    <StarRating count={Math.round(average)} size={18} />
                    <span className="text-sm text-white/85">
                      {average.toFixed(1)} ({count} rating{count === 1 ? "" : "s"})
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-white/70">
                    No ratings yet · New Course
                  </span>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={`/academy/enroll?course=${encodeURIComponent(course.code)}`}
                  className="btn-primary"
                  onClick={() =>
                    trackAcademyEvent("enroll_click", { course: course.code, source: "detail" })
                  }
                >
                  Enroll Now
                </Link>
                <Link to="/academy#courses" className="btn-secondary">
                  Back to Courses
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white shadow-2xl">
                <AcademyImage
                  src={course.image}
                  alt={course.imageAlt || course.title}
                  className={`w-full ${/\.(jpe?g|png|webp)$/i.test(course.image || "") ? "aspect-square object-contain bg-white" : "aspect-[16/10] object-cover"}`}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section-padding bg-slate-50">
        <div className="section-container grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            <Reveal>
              <article className="rounded-2xl bg-white border border-slate-100 p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-[#00274c]">Overview</h2>
                <p className="mt-4 text-slate-600 leading-relaxed whitespace-pre-line">
                  {course.longDescription || course.description}
                </p>
              </article>
            </Reveal>

            <Reveal>
              <article className="rounded-2xl bg-white border border-slate-100 p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-[#00274c]">
                  What you&apos;ll learn
                </h2>
                <ul className="mt-4 space-y-3">
                  {(course.learningOutcomes || []).map((item) => (
                    <li key={item} className="flex gap-3 text-slate-700 leading-relaxed">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c10020]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>

            <Reveal>
              <article className="rounded-2xl bg-white border border-slate-100 p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-[#00274c]">Requirements</h2>
                <ul className="mt-4 space-y-3">
                  {(course.requirements || []).map((item) => (
                    <li key={item} className="flex gap-3 text-slate-700 leading-relaxed">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#00274c]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>

            <Reveal>
              <article className="rounded-2xl bg-white border border-slate-100 p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-[#00274c]">Learning format</h2>
                <p className="mt-3 text-slate-600 leading-relaxed">{WEEKLY_COMMITMENT}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {LEARNING_MODEL.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-[#00274c]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>

            <Reveal>
              <article className="rounded-2xl bg-white border border-slate-100 p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-[#00274c]">
                  Schedule & session group
                </h2>
                {session ? (
                  <div className="mt-4 space-y-2 text-slate-700">
                    <p>
                      <span className="font-semibold text-[#00274c]">{session.label}</span>
                      {" — "}
                      {session.days}, {session.time}
                    </p>
                    <p className="text-sm text-slate-500">{TIMEZONE_NOTE}</p>
                    {course.schedule ? (
                      <p className="text-sm text-slate-600 mt-2">{course.schedule}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 text-slate-600">
                    Session times are confirmed during enrollment. {TIMEZONE_NOTE}
                  </p>
                )}
              </article>
            </Reveal>

            <Reveal>
              <article className="rounded-2xl bg-white border border-slate-100 p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-[#00274c]">Certification</h2>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Learners who meet attendance and assessment requirements receive a professional
                  certificate from SVL Training Academy. The recommended passing average is{" "}
                  {PASSING_SCORE}%, with at least 80% live-session attendance.
                </p>
              </article>
            </Reveal>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            <Reveal>
              <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-[#00274c]">Tuition</h2>
                <p className="mt-3 text-3xl font-bold text-[#00274c]">
                  US${course.tuition}
                </p>
                {course.registrationFee ? (
                  <p className="mt-1 text-sm text-slate-500">
                    + US${course.registrationFee} registration fee
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">No separate registration fee</p>
                )}
                <Link
                  to={`/academy/enroll?course=${encodeURIComponent(course.code)}`}
                  className="btn-primary w-full mt-6"
                >
                  Enroll Now
                </Link>
                <Link to="/academy#courses" className="btn-outline w-full mt-3">
                  Back to Courses
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-[#00274c]">Rate this course</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Share honest feedback to help future learners.
                </p>
                <div className="mt-4">
                  <StarRating
                    interactive
                    value={userStars}
                    onChange={handleRate}
                    size={28}
                  />
                </div>
                {submittingRating ? (
                  <p className="mt-3 text-sm text-slate-500">Submitting…</p>
                ) : null}
                {ratingStatus.message ? (
                  <p
                    className={`mt-3 text-sm ${
                      ratingStatus.type === "error" ? "text-red-600" : "text-emerald-700"
                    }`}
                    role="status"
                  >
                    {ratingStatus.message}
                  </p>
                ) : null}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {count > 0 ? (
                    <div className="flex items-center gap-2">
                      <StarRating count={Math.round(average)} size={16} />
                      <span className="text-sm text-slate-600">
                        {average.toFixed(1)} · {count} rating{count === 1 ? "" : "s"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-400">No ratings yet</p>
                  )}
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section-padding bg-white">
          <div className="section-container">
            <Reveal>
              <span className="eyebrow">Related courses</span>
              <h2 className="section-heading mt-3">More in {course.category}</h2>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 0.05}>
                  <CourseCard course={item} rating={relatedRatings[item.id]} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Footer />
    </div>
  );
}
