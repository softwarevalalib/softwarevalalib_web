import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import Footer from "../components/Footer";
import CourseCatalogue from "../components/academy/CourseCatalogue";
import AccordionFAQ from "../components/academy/AccordionFAQ";
import AcademyHeroBackdrop from "../components/academy/AcademyHeroBackdrop";
import CourseCard from "../components/academy/CourseCard";
import academyCourses from "../data/academyCourses";
import {
  ACADEMY_ASSETS,
  PROGRAMME_COMPARISON,
  INSTALLMENT_INFO,
  AUDIENCES,
  CAREER_PATHWAYS,
  ENROLLMENT_STEPS,
  LEARNING_MODEL,
  WEEKLY_COMMITMENT,
  ASSESSMENT,
  PASSING_SCORE,
  REQUIREMENTS,
  SESSION_GROUPS,
  TIMEZONE_NOTE,
  COHORT_DATES,
  PAYMENT_METHODS,
  FAQ_ITEMS,
} from "../data/academyMeta";
import { trackAcademyEvent } from "../utils/academyApi";

const PAGE_TITLE =
  "SVL Training Academy | Professional IT & ICT Training in Liberia";

function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        name: "SVL Training Academy",
        alternateName: "Software Vala Liberia Training Academy",
        url: "https://softwarevala.com/academy",
        logo: ACADEMY_ASSETS.logo,
        description:
          "Professional IT and ICT training in Liberia — live online classes, practical projects, and career-focused certification programmes.",
        address: {
          "@type": "PostalAddress",
          streetAddress: "ELWA Junction",
          addressLocality: "Monrovia",
          addressCountry: "LR",
        },
        parentOrganization: {
          "@type": "Organization",
          name: "Software Vala Liberia",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };
}

function scrollToCourses(e) {
  e.preventDefault();
  const el = document.getElementById("courses");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Academy() {
  const [sessionFilter, setSessionFilter] = useState("All");

  const featuredCourses = useMemo(
    () =>
      academyCourses.filter(
        (c) => c.status === "published" && (c.featured || c.popular)
      ),
    []
  );

  const visibleSessions = useMemo(() => {
    if (sessionFilter === "All") return SESSION_GROUPS;
    return SESSION_GROUPS.filter((g) => g.id === sessionFilter);
  }, [sessionFilter]);

  useEffect(() => {
    document.title = PAGE_TITLE;
    trackAcademyEvent("academy_page_view");

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "academy-jsonld";
    script.text = JSON.stringify(buildJsonLd());
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById("academy-jsonld");
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="bg-white">
      {/* Hero — sliding online-learning photos + Academy logo (top-right) */}
      <AcademyHeroBackdrop>
        <div className="max-w-2xl text-white pr-20 sm:pr-28">
          <Reveal>
            <span className="eyebrow text-[#ff6b81]">SVL TRAINING ACADEMY</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1
              id="academy-hero-heading"
              className="section-heading text-white mt-4 drop-shadow-sm"
            >
              Learn Practical Skills. Build Real Projects.{" "}
              <span className="text-[#ff6b81]">Advance Your Career.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 text-white/90 text-base sm:text-lg leading-relaxed max-w-xl">
              Live online IT &amp; ICT programmes for students, professionals,
              institutional staff, and TVET learners across Liberia.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to="/academy/enroll"
                className="btn-primary w-full sm:w-auto"
                onClick={() =>
                  trackAcademyEvent("enroll_click", { source: "hero" })
                }
              >
                Enroll Now
              </Link>
              <a
                href="#courses"
                onClick={scrollToCourses}
                className="btn-secondary w-full sm:w-auto"
              >
                Explore Courses
              </a>
            </div>
          </Reveal>
        </div>
      </AcademyHeroBackdrop>

      {/* Programme comparison */}
      <section className="section-padding bg-slate-50" aria-labelledby="programme-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Programme Types</span>
              <h2 id="programme-heading" className="section-heading mt-3">
                Compare our professional pathways
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Choose the pathway that matches your goals. All professional programmes
                run for 12 weeks with live online delivery.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {PROGRAMME_COMPARISON.map((prog, index) => (
              <Reveal key={prog.id} delay={index * 0.08}>
                <article className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="font-display font-bold text-xl text-[#00274c]">
                    {prog.name}
                  </h3>
                  <p className="mt-4 text-3xl font-extrabold text-[#c10020]">
                    US${prog.tuition}
                    <span className="ml-1 text-sm font-semibold text-slate-500">
                      + ${prog.registration} reg.
                    </span>
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#00274c]">
                    {prog.duration}
                  </p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {prog.note}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <p className="mt-8 rounded-2xl border border-[#00274c]/10 bg-white px-5 py-4 text-sm text-slate-600 leading-relaxed">
              {INSTALLMENT_INFO}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Information sheet */}
      <section className="section-padding bg-white" aria-labelledby="infosheet-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-8">
              <span className="eyebrow">Information Sheet</span>
              <h2 id="infosheet-heading" className="section-heading mt-3">
                Download the academy overview
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Preview or download the official SVL Training Academy information sheet
                for programmes, schedules, and enrollment details.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden shadow-sm">
              <div className="aspect-[4/3] sm:aspect-[16/10] bg-[#00274c]/5">
                <object
                  data={ACADEMY_ASSETS.informationSheet}
                  type="application/pdf"
                  className="w-full h-full"
                  aria-label="SVL Training Academy information sheet PDF preview"
                >
                  <iframe
                    title="SVL Training Academy information sheet"
                    src={ACADEMY_ASSETS.informationSheet}
                    className="w-full h-full border-0"
                  />
                </object>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6">
                <p className="text-sm text-slate-600">
                  Official PDF — programmes, requirements, and cohort dates.
                </p>
                <a
                  href={ACADEMY_ASSETS.informationSheet}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary shrink-0"
                >
                  Download PDF
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* About */}
      <section className="section-padding bg-slate-50" aria-labelledby="about-academy-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-3xl">
              <span className="eyebrow">About the Academy</span>
              <h2 id="about-academy-heading" className="section-heading mt-3">
                About SVL Training Academy
              </h2>
              <p className="mt-5 text-slate-600 text-base sm:text-lg leading-relaxed">
                SVL Training Academy is the professional training division of Software
                Vala Liberia. We equip learners with practical digital, software, networking,
                cybersecurity, data, and business technology skills through live online
                classes, guided projects, and career-oriented assessment.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Whether you are starting a tech career, upgrading workplace skills, or
                growing a business, our programmes combine instructor-led sessions with
                self-paced practice so you can learn flexibly and finish with work you can
                showcase.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Audiences */}
      <section className="section-padding bg-white" aria-labelledby="audiences-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Who We Serve</span>
              <h2 id="audiences-heading" className="section-heading mt-3">
                Who the Academy Serves
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Our programmes are designed for diverse learners across Liberia and the
                region.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {AUDIENCES.map((audience, index) => (
              <Reveal key={audience} delay={Math.min(index * 0.04, 0.35)}>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-center">
                  <p className="font-semibold text-sm sm:text-base text-[#00274c]">
                    {audience}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured / Popular courses */}
      <section className="section-padding bg-slate-50" aria-labelledby="featured-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Featured Courses</span>
              <h2 id="featured-heading" className="section-heading mt-3">
                Popular programmes to get started
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Explore highlighted courses selected for career relevance and learner demand.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.slice(0, 6).map((course, index) => (
              <Reveal key={course.id} delay={Math.min(index * 0.06, 0.3)}>
                <CourseCard course={course} rating={null} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="mt-10 text-center">
              <a href="#courses" onClick={scrollToCourses} className="btn-outline">
                View Full Catalogue
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Full catalogue — id=courses lives inside CourseCatalogue */}
      <CourseCatalogue />

      {/* Career pathways */}
      <section className="section-padding bg-slate-50" aria-labelledby="pathways-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Career Pathways</span>
              <h2 id="pathways-heading" className="section-heading mt-3">
                Map your learning to real outcomes
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Choose a pathway that matches where you want to go next — start a career,
                upgrade skills, or grow a business.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAREER_PATHWAYS.map((path, index) => (
              <Reveal key={path.title} delay={Math.min(index * 0.06, 0.3)}>
                <article className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#c10020]">
                    {path.outcome}
                  </p>
                  <h3 className="mt-2 font-display font-bold text-lg text-[#00274c]">
                    {path.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {path.summary}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Enrollment steps */}
      <section className="section-padding bg-white" aria-labelledby="enrollment-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">How It Works</span>
              <h2 id="enrollment-heading" className="section-heading mt-3">
                How Enrollment Works
              </h2>
            </div>
          </Reveal>

          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 list-none p-0 m-0">
            {ENROLLMENT_STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.08}>
                <li className="relative h-full rounded-2xl border border-slate-100 bg-slate-50 p-6">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#c10020] text-white text-sm font-bold"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display font-bold text-[#00274c]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {step.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.2}>
            <div className="mt-10 text-center">
              <Link
                to="/academy/enroll"
                className="btn-primary"
                onClick={() =>
                  trackAcademyEvent("enroll_click", { source: "enrollment_steps" })
                }
              >
                Start Your Application
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Learning experience */}
      <section className="section-padding bg-slate-50" aria-labelledby="learning-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Learning Experience</span>
              <h2 id="learning-heading" className="section-heading mt-3">
                How you will learn
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                {WEEKLY_COMMITMENT}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {LEARNING_MODEL.map((item, index) => (
              <Reveal key={item} delay={Math.min(index * 0.05, 0.3)}>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-5 text-center shadow-sm">
                  <p className="font-semibold text-sm sm:text-base text-[#00274c]">
                    {item}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment */}
      <section className="section-padding bg-white" aria-labelledby="assessment-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Assessment</span>
              <h2 id="assessment-heading" className="section-heading mt-3">
                How you are evaluated
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Recommended passing average:{" "}
                <strong className="text-[#00274c]">{PASSING_SCORE}%</strong>, with at
                least 80% live-session attendance.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {ASSESSMENT.map((item, index) => (
              <Reveal key={item.label} delay={index * 0.06}>
                <article className="rounded-2xl border border-slate-100 bg-slate-50 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[#00274c]">{item.label}</h3>
                    <span className="text-sm font-bold text-[#c10020]">
                      {item.weight}%
                    </span>
                  </div>
                  <div
                    className="mt-4 h-2.5 rounded-full bg-slate-200 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={item.weight}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.label} weight ${item.weight} percent`}
                  >
                    <div
                      className="h-full rounded-full bg-[#00274c]"
                      style={{ width: `${item.weight}%` }}
                    />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="section-padding bg-slate-50" aria-labelledby="requirements-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Requirements</span>
              <h2 id="requirements-heading" className="section-heading mt-3">
                What you need to succeed
              </h2>
            </div>
          </Reveal>

          <ul className="grid gap-3 sm:grid-cols-2 list-none p-0 m-0">
            {REQUIREMENTS.map((req, index) => (
              <Reveal key={req} delay={Math.min(index * 0.04, 0.28)}>
                <li className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c10020] text-white text-xs font-bold"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-sm sm:text-base text-[#00274c] font-medium">
                    {req}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Online class schedule */}
      <section className="section-padding bg-white" aria-labelledby="schedule-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-8">
              <span className="eyebrow">Online Class Schedule</span>
              <h2 id="schedule-heading" className="section-heading mt-3">
                Live session groups
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">{TIMEZONE_NOTE}</p>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div
              className="flex flex-wrap gap-2 mb-8"
              role="group"
              aria-label="Filter session groups"
            >
              <button
                type="button"
                onClick={() => setSessionFilter("All")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  sessionFilter === "All"
                    ? "bg-[#c10020] text-white"
                    : "bg-slate-100 text-[#00274c] hover:bg-slate-200"
                }`}
              >
                All Groups
              </button>
              {SESSION_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSessionFilter(group.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    sessionFilter === group.id
                      ? "bg-[#c10020] text-white"
                      : "bg-slate-100 text-[#00274c] hover:bg-slate-200"
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleSessions.map((group, index) => (
              <Reveal key={group.id} delay={index * 0.06}>
                <article className="h-full rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h3 className="font-display font-bold text-[#00274c]">
                    {group.label}
                  </h3>
                  <p className="mt-3 text-sm font-semibold text-[#c10020]">
                    {group.days}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{group.time}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Key dates */}
      <section className="section-padding bg-slate-50" aria-labelledby="dates-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Key Dates</span>
              <h2 id="dates-heading" className="section-heading mt-3">
                {COHORT_DATES.name} timeline
              </h2>
            </div>
          </Reveal>

          <div className="max-w-3xl space-y-3">
            {COHORT_DATES.items.map((item, index) => (
              <Reveal key={item.label} delay={Math.min(index * 0.04, 0.28)}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4">
                  <span className="font-semibold text-[#00274c]">{item.label}</span>
                  <span className="text-sm text-slate-600">{item.value}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tuition note */}
      <section className="section-padding bg-white" aria-labelledby="tuition-heading">
        <div className="section-container">
          <Reveal>
            <div className="rounded-2xl border border-[#00274c]/10 bg-slate-50 px-6 py-8 sm:px-10 sm:py-10 text-center max-w-3xl mx-auto">
              <span className="eyebrow">Tuition</span>
              <h2 id="tuition-heading" className="section-heading mt-3">
                Course fees vary by programme
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Exact tuition and registration fees are listed on each course card in the
                catalogue above. Review programme details, then apply with the courses you
                want to join.
              </p>
              <a
                href="#courses"
                onClick={scrollToCourses}
                className="btn-outline mt-6 inline-flex"
              >
                Browse Catalogue Pricing
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Payment */}
      <section className="section-padding bg-slate-50" aria-labelledby="payment-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">Payment</span>
              <h2 id="payment-heading" className="section-heading mt-3">
                How to pay after approval
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Official merchant and bank details are shared after your application is
                reviewed. No account numbers are published on this page.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {PAYMENT_METHODS.map((method, index) => (
              <Reveal key={method.name} delay={index * 0.06}>
                <article className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="font-display font-bold text-[#00274c]">
                    {method.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {method.detail}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-white" aria-labelledby="faq-heading">
        <div className="section-container">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <span className="eyebrow">FAQ</span>
              <h2 id="faq-heading" className="section-heading mt-3">
                Frequently asked questions
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="max-w-3xl">
              <AccordionFAQ items={FAQ_ITEMS} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="relative overflow-hidden bg-[#00274c] section-padding"
        aria-labelledby="final-cta-heading"
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-[#c10020]/25 blur-[100px] rounded-full" />
        </div>
        <div className="section-container relative z-10 text-center text-white">
          <Reveal>
            <span className="eyebrow text-[#c10020]">Ready to Begin?</span>
            <h2 id="final-cta-heading" className="section-heading text-white mt-3">
              Enroll in SVL Training Academy today
            </h2>
            <p className="mt-4 text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Submit your application, receive a reference number, and our team will follow
              up within 24–48 hours.
            </p>
            <Link
              to="/academy/enroll"
              className="btn-primary mt-8 inline-flex"
              onClick={() =>
                trackAcademyEvent("enroll_click", { source: "final_cta" })
              }
            >
              Enroll Now
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
