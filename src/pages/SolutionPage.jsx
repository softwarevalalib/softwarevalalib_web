import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { findSolution, solutions } from "../data/solutions";
import ConsultationCta from "../components/ConsultationCta";
import { trackAction } from "../utils/trackAction";

export default function SolutionPage() {
  const { slug } = useParams();
  const item = findSolution(slug);

  useEffect(() => {
    if (item) {
      document.title = `${item.title} | Software Vala Liberia`;
      trackAction("solution_view", `/solutions/${item.slug}`);
    }
  }, [item]);

  if (!item) {
    return (
      <section className="section-padding">
        <div className="section-container max-w-xl">
          <h1 className="font-display text-3xl font-bold text-[#00274c]">Solution not found</h1>
          <Link to="/" className="btn-primary mt-6">Back home</Link>
        </div>
      </section>
    );
  }

  const industries = solutions.filter((entry) => entry.kind === "industry");

  return (
    <>
      <section className="bg-[#00274c] text-white section-padding">
        <div className="section-container max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {item.kind === "industry" ? "Industry solution" : "Solution"}
          </p>
          <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold">{item.title}</h1>
          <p className="mt-4 text-white/85 text-lg">{item.audience}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/consultation" className="btn-primary" onClick={() => trackAction("request_consultation", `/solutions/${item.slug}`)}>
              Request free consultation
            </Link>
            <Link to="/request-quote" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wide border-2 border-white text-white" onClick={() => trackAction("request_quote", `/solutions/${item.slug}`)}>
              Request a quote
            </Link>
          </div>
        </div>
      </section>
      <section className="section-padding bg-white">
        <div className="section-container grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#00274c]">Challenges</h2>
            <ul className="mt-4 space-y-2 text-slate-700">
              {item.challenges.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#00274c]">How SVL can help</h2>
            <ul className="mt-4 space-y-2 text-slate-700">
              {item.offerings.map((line) => <li key={line}>{line}</li>)}
            </ul>
            <p className="mt-4 text-sm text-slate-500">Final scope and price depend on the project. We do not publish a fixed price for custom systems here.</p>
          </div>
        </div>
      </section>
      {item.kind === "need" ? (
        <section className="section-padding bg-slate-50">
          <div className="section-container">
            <h2 className="font-display text-2xl font-bold text-[#00274c]">Also browse by industry</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {industries.map((industry) => (
                <Link key={industry.slug} to={`/solutions/${industry.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#00274c]">
                  {industry.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <ConsultationCta page={`/solutions/${item.slug}`} />
    </>
  );
}
