import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { projects } from "../data/projects";
import ConsultationCta from "../components/ConsultationCta";

const FILTERS = [
  "All",
  "Websites",
  "Software",
  "Management Systems",
  "E-Commerce",
  "Education",
  "NGOs",
  "Other",
];

const TAGS = {
  "school-management-system": ["Management Systems", "Education"],
  "business-portfolio-website": ["Websites"],
  "ecommerce-platform": ["E-Commerce", "Websites"],
  "ngo-management-system": ["Management Systems", "NGOs"],
  "real-estate-website": ["Websites", "Other"],
  "admin-dashboard": ["Software"],
};

export default function Portfolio() {
  const [filter, setFilter] = useState("All");
  const visible = useMemo(
    () => projects.filter((project) => filter === "All" || (TAGS[project.slug] || ["Other"]).includes(filter)),
    [filter],
  );

  return (
    <>
      <section className="section-padding bg-slate-50">
        <div className="section-container">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">Portfolio</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-[#00274c]">Systems and websites</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            These are solution types already described on the Software Vala Liberia site. Client names and measured results are shown only when the organization has approved them. None are published on these records yet.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((name) => (
              <button
                key={name}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === name ? "bg-[#00274c] text-white" : "bg-white border border-slate-200 text-[#00274c]"}`}
                onClick={() => setFilter(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {visible.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={project.image} alt="" className="h-48 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{(TAGS[project.slug] || []).join(" · ")}</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-[#00274c]">{project.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                  <p className="mt-3 text-sm text-slate-500">Client: not published</p>
                  <Link to={`/portfolio/${project.slug}`} className="mt-4 inline-block text-sm font-semibold text-[#c10020]">
                    View case study
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {visible.length === 0 ? <p className="mt-8 text-sm text-slate-500">No published project in this filter yet.</p> : null}
        </div>
      </section>
      <ConsultationCta page="/portfolio" />
    </>
  );
}
