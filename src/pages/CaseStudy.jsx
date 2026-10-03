import { Link, useParams } from "react-router-dom";
import { projects } from "../data/projects";
import ConsultationCta from "../components/ConsultationCta";

export default function CaseStudy() {
  const { slug } = useParams();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return (
      <section className="section-padding">
        <div className="section-container">
          <h1 className="font-display text-3xl font-bold text-[#00274c]">Case study not found</h1>
          <Link to="/portfolio" className="btn-primary mt-6">Back to portfolio</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="section-padding bg-white">
        <div className="section-container max-w-3xl">
          <Link to="/portfolio" className="text-sm font-semibold text-[#c10020]">Portfolio</Link>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#00274c]">{project.title}</h1>
          <img src={project.image} alt="" className="mt-6 w-full rounded-2xl object-cover max-h-80" />
          <dl className="mt-8 space-y-4 text-slate-700">
            <div><dt className="font-semibold text-[#00274c]">Client</dt><dd>Not published</dd></div>
            <div><dt className="font-semibold text-[#00274c]">Category</dt><dd>{project.category}</dd></div>
            <div><dt className="font-semibold text-[#00274c]">Challenge and approach</dt><dd>{project.overview}</dd></div>
            <div><dt className="font-semibold text-[#00274c]">What was delivered</dt><dd>{project.description}</dd></div>
            <div><dt className="font-semibold text-[#00274c]">Technology named on this record</dt><dd>{project.stack.join(", ")}</dd></div>
            <div>
              <dt className="font-semibold text-[#00274c]">Features</dt>
              <dd><ul className="mt-1 list-disc pl-5">{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></dd>
            </div>
            <div><dt className="font-semibold text-[#00274c]">Results</dt><dd>No measured results have been approved for publication.</dd></div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/consultation" className="btn-primary">Request free consultation</Link>
            <Link to="/request-quote" className="btn-outline">Request a quote</Link>
          </div>
        </div>
      </section>
      <ConsultationCta page={`/portfolio/${project.slug}`} />
    </>
  );
}
