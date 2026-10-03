import { Link } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import { clientProblems } from "../data/clientProblems";
import { trackAction } from "../utils/trackAction";

export default function ClientProblems() {
  return (
    <section className="section-padding bg-white" aria-labelledby="problems-heading">
      <div className="section-container">
        <Reveal>
          <div className="max-w-2xl">
            <span className="eyebrow">Start here</span>
            <h2 id="problems-heading" className="section-heading mt-3">
              What technology challenge is your business facing?
            </h2>
            <p className="mt-4 text-slate-600 text-base sm:text-lg">
              Choose the situation closest to yours. Each option opens the matching Software Vala Liberia solution.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientProblems.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.04}>
              <Link
                to={item.to}
                onClick={() => trackAction("problem_selected", item.to)}
                className="block h-full rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#c10020] hover:-translate-y-0.5"
              >
                <h3 className="font-display text-lg font-bold text-[#00274c]">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#c10020]">
                  Find my solution
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
