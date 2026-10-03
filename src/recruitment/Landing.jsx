import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../images/logo.jpg";
import { trackAction } from "../utils/trackAction";
import { APPLICATION_CLOSE_AT, recruitmentState } from "./config";

const SERVICES = [
  "Websites & Web Applications",
  "Custom Software",
  "Business Management Systems",
  "Mobile Applications",
  "E-Commerce Solutions",
  "Digital Marketing",
  "Cloud & Hosting",
  "Business Email",
  "Cybersecurity",
  "Networking",
  "CCTV",
  "Technical Support",
  "UI/UX",
  "Graphic Design",
];

const WHO = [
  "Freelance marketers",
  "Sales professionals",
  "Business development professionals",
  "Independent consultants",
  "University students",
  "University graduates",
  "TVET students and graduates",
  "Digital marketers",
  "Social media professionals",
  "Promoters",
  "Entrepreneurs",
  "People with strong professional or business networks",
];

function useCountdown(closeAt) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const start = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, []);
  const diff = Math.max(0, Date.parse(closeAt) - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, ready: now > 0 };
}

export default function Landing() {
  const state = recruitmentState();
  const countdown = useCountdown(APPLICATION_CLOSE_AT);
  useEffect(() => {
    document.title = "Freelance Marketing Agent Application | Software Vala Liberia";
    trackAction(state === "open" ? "recruitment_page_view" : "application_closed_view", "/");
  }, [state]);

  return (
    <div className="bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="section-container flex flex-wrap items-center justify-between gap-4 py-4">
          <img src={logo} alt="Software Vala Liberia" className="h-12 w-auto" />
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-[#00274c]">
            <a href="#about">About the opportunity</a>
            <a href="#requirements">Requirements</a>
            <a href="#process">How it works</a>
            <a href="#faq">FAQ</a>
            <Link to="/apply" className="btn-primary" onClick={() => trackAction("apply_clicked", "/")}>{state === "open" ? "Apply now" : state === "before" ? "Opens 3 October" : "Applications closed"}</Link>
          </nav>
        </div>
      </header>

      <section className="bg-[#00274c] text-white section-padding">
        <div className="section-container max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Software Vala Liberia</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold">Become an SVL Freelance Marketing Agent</h1>
          <p className="mt-4 text-lg text-white/85">
            Connect businesses and institutions with professional technology solutions while building practical experience in business development, client acquisition, and technology sales.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
            {["90-day initial pilot", "Commission-based", "Training provided", "Official agent ID", "No application fee"].map((item) => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1">{item}</span>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {state === "open" ? (
              <Link to="/apply" className="btn-primary" onClick={() => trackAction("apply_clicked", "/")}>Apply now</Link>
            ) : (
              <span className="btn-primary">{state === "before" ? "Opens 3 October" : "Applications closed"}</span>
            )}
            <a href="#about" className="inline-flex items-center justify-center rounded-xl border-2 border-white px-6 py-3 text-sm font-semibold uppercase">Learn about the role</a>
          </div>
          <div className="mt-8 rounded-2xl bg-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider">Applications close</p>
            <p className="mt-1 font-display text-2xl font-bold">17 October 2026 · 11:59 PM GMT</p>
            {state === "open" && countdown.ready ? (
              <p className="mt-2 text-sm">{countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s remaining</p>
            ) : null}
            {state === "closed" ? (
              <p className="mt-2 text-sm">Applications for the current Software Vala Liberia Freelance Business Development & Marketing Agent recruitment closed on 17 October 2026 at 11:59 PM GMT. Submitted applications are now under review.</p>
            ) : null}
            {state === "before" ? <p className="mt-2 text-sm">Applications open on 3 October 2026.</p> : null}
          </div>
        </div>
      </section>

      <section id="about" className="section-padding">
        <div className="section-container max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#00274c]">About the opportunity</h2>
          <p className="mt-4">Selected agents help Software Vala Liberia identify and connect with businesses and institutions that need technology solutions. This is an independent, commission-based opportunity. It is not salaried employment, and income is not guaranteed.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-[#00274c]">Agents focus on</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {["Prospect research", "Client introductions", "Business-development outreach", "Lead generation", "Lead qualification", "Relationship building", "Arranging consultations", "Professional follow-up"].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#00274c]">SVL handles</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {["Technical discovery", "Final pricing", "Quotation", "Proposals", "Contracts", "Project commitments", "Project delivery"].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="section-container">
          <h2 className="font-display text-3xl font-bold text-[#00274c]">Services agents may introduce</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <article key={service} className="rounded-2xl border border-slate-200 p-4 font-semibold text-[#00274c]">{service}</article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container">
          <h2 className="font-display text-3xl font-bold text-[#00274c]">Who can apply?</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {WHO.map((item) => <li key={item} className="rounded-xl bg-white border border-slate-200 px-4 py-3">{item}</li>)}
          </ul>
        </div>
      </section>

      <section id="requirements" className="section-padding bg-white">
        <div className="section-container max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#00274c]">Requirements</h2>
          <ul className="mt-4 list-disc pl-5 space-y-1">
            {["At least 18 years old", "Strong communication skills", "Ability to use WhatsApp and email", "Basic digital literacy", "Ability to research potential clients and keep follow-up records", "Professional behavior, reliability, and integrity", "Willingness to join SVL training and follow approved sales procedures", "Ability to conduct consistent outreach"].map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="mt-6 font-semibold text-[#c10020]">No application fee. No recruitment fee. No onboarding fee.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#00274c]">What selected agents receive</h2>
          <ul className="mt-4 list-disc pl-5 space-y-1">
            {["Structured onboarding and sales orientation", "Approved company and marketing materials", "Sales scripts and prospecting guidance", "A unique SVL Marketing Agent ID after onboarding", "Referral tracking", "Support from SVL's technical and business team", "Commission under the approved policy", "Performance incentives where applicable"].map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="mt-4 text-sm text-slate-600">Commission depends on the approved policy and completed work. This opportunity does not guarantee income.</p>
        </div>
      </section>

      <section id="process" className="section-padding bg-white">
        <div className="section-container max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#00274c]">How it works</h2>
          <ol className="mt-4 list-decimal pl-5 space-y-1">
            {["Apply", "SVL reviews the application", "Shortlisted applicants are contacted", "Interview", "Selection is a management decision", "Onboarding, agreement, and training", "An Agent ID is issued only after onboarding", "The agent uses an official referral link"].map((item) => <li key={item}>{item}</li>)}
          </ol>
        </div>
      </section>

      <section id="faq" className="section-padding">
        <div className="section-container max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-[#00274c]">FAQ</h2>
          <div className="mt-4 space-y-4">
            <div><h3 className="font-semibold">Is this a job with a salary?</h3><p>No. It is an independent, commission-based opportunity.</p></div>
            <div><h3 className="font-semibold">Does applying mean I am selected?</h3><p>No. Shortlisted applicants are contacted through the details they provide.</p></div>
            <div><h3 className="font-semibold">Should I pay anyone?</h3><p>No. Software Vala Liberia does not charge an application, recruitment, onboarding, or training fee for this opportunity.</p></div>
          </div>
          {state === "open" ? <Link to="/apply" className="btn-primary mt-8" onClick={() => trackAction("apply_clicked", "/")}>Apply now</Link> : null}
        </div>
      </section>
    </div>
  );
}
