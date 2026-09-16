import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import testimonials from "../data/testimonials";
import Reveal from "../Animations/Reveal";
import StarRating from "./StarRating";
import { fetchReviews, submitReview } from "../utils/feedbackApi";

const emptyForm = {
  name: "",
  company: "",
  location: "",
  rating: 5,
  review: "",
  website: "",
};

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function ReviewCard({ item }) {
  const rating = item.rating || 5;
  const text = item.review || item.feedback || "";
  const image = item.image;

  return (
    <article className="lift shrink-0 w-[300px] sm:w-[360px] md:w-[400px] bg-white rounded-2xl shadow-md border border-slate-100 p-6">
      <StarRating count={rating} className="mb-3" />
      <p className="text-slate-600 text-sm leading-relaxed mb-4">&ldquo;{text}&rdquo;</p>
      <div className="flex items-center gap-4">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-12 h-12 rounded-full object-cover ring-2 ring-[#c10020]/20"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full bg-[#00274c] text-white grid place-items-center text-sm font-bold ring-2 ring-[#c10020]/20"
            aria-hidden="true"
          >
            {initials(item.name || "C")}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-sm truncate">{item.name}</h3>
          {(item.company || item.position) && (
            <p className="text-xs text-slate-500 truncate">
              {[item.position, item.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      {item.location && (
        <p className="text-xs text-[#0a3a66] font-medium mt-3">{item.location}</p>
      )}
    </article>
  );
}

function Clientfeedback() {
  const [liveReviews, setLiveReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const loadReviews = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const reviews = await fetchReviews();
      setLiveReviews(reviews);
    } catch {
      // Keep showing static testimonials if the API is unavailable
      if (!silent) setLiveReviews([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    const timer = setInterval(() => loadReviews({ silent: true }), 15000);
    return () => clearInterval(timer);
  }, []);

  const displayItems = useMemo(() => {
    if (liveReviews.length > 0) return liveReviews;
    return testimonials;
  }, [liveReviews]);

  const doubled = useMemo(() => [...displayItems, ...displayItems], [displayItems]);
  const reviewCountLabel =
    liveReviews.length > 0
      ? `${liveReviews.length}+ live review${liveReviews.length === 1 ? "" : "s"}`
      : "Trusted client reviews";

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status.message) setStatus({ type: "", message: "" });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const created = await submitReview({
        name: form.name,
        company: form.company,
        location: form.location,
        rating: form.rating,
        review: form.review,
        website: form.website,
      });

      setLiveReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      setForm(emptyForm);
      setStatus({
        type: "success",
        message: "Thank you! Your review is now live on our website.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Submission failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#c10020] focus:ring-1 focus:ring-[#c10020]/30 placeholder:text-slate-400";

  return (
    <section
      id="client-feedback"
      className="section-padding bg-white overflow-hidden transition-colors duration-300"
      aria-labelledby="feedback-heading"
    >
      <div className="section-container mb-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">Client Testimonials</span>
            <h2 id="feedback-heading" className="section-heading mt-3">
              What our awesome <span className="accent">customers</span> say
            </h2>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <StarRating count={5} />
              <span className="text-sm font-semibold text-slate-500">{reviewCountLabel}</span>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-[#c10020]" aria-label="Loading reviews" />
              )}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="overflow-hidden" aria-live="polite">
        <div className="carousel-track">
          {doubled.map((item, index) => (
            <ReviewCard key={`${item.id}-${index}`} item={item} />
          ))}
        </div>
      </div>

      <div className="section-container mt-14">
        <Reveal>
          <div className="max-w-2xl mx-auto rounded-3xl border border-slate-100 bg-slate-50 p-6 sm:p-8 shadow-sm">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#00274c] text-center">
              Share your experience
            </h3>
            <p className="mt-2 text-sm text-slate-600 text-center">
              Leave a rating and review — it posts to this page automatically for other
              visitors to see.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Your rating</span>
                <StarRating
                  interactive
                  value={form.rating}
                  onChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
                  size={28}
                />
              </div>

              {/* Honeypot */}
              <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
                <label htmlFor="feedback-website">Website</label>
                <input
                  id="feedback-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={onChange}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="feedback-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full name *
                  </label>
                  <input
                    id="feedback-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={80}
                    value={form.name}
                    onChange={onChange}
                    disabled={submitting}
                    className={inputClass}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="feedback-company" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Company
                  </label>
                  <input
                    id="feedback-company"
                    name="company"
                    maxLength={100}
                    value={form.company}
                    onChange={onChange}
                    disabled={submitting}
                    className={inputClass}
                    placeholder="Business or organization"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="feedback-location" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Location
                </label>
                <input
                  id="feedback-location"
                  name="location"
                  maxLength={100}
                  value={form.location}
                  onChange={onChange}
                  disabled={submitting}
                  className={inputClass}
                  placeholder="City, country"
                />
              </div>

              <div>
                <label htmlFor="feedback-review" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Your review *
                </label>
                <textarea
                  id="feedback-review"
                  name="review"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  value={form.review}
                  onChange={onChange}
                  disabled={submitting}
                  className={`${inputClass} resize-y min-h-[110px]`}
                  placeholder="Tell others about your experience with Software Vala Liberia..."
                />
              </div>

              {status.message && (
                <p
                  role="status"
                  className={`text-sm text-center ${
                    status.type === "success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {submitting ? "Posting review..." : "Post Review"}
              </button>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default Clientfeedback;
