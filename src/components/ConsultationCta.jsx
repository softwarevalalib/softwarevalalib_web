import { Link } from "react-router-dom";
import { whatsappSpecialistUrl } from "../utils/whatsapp";

export default function ConsultationCta({ page = "" }) {
  return (
    <section className="section-padding bg-slate-50">
      <div className="section-container">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 sm:px-12 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">Free consultation</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#00274c]">
            Not sure which solution you need?
          </h2>
          <p className="mt-4 max-w-2xl text-slate-600">
            Tell us how your organization currently works and what challenge you are trying to solve.
            Our team will help you identify an appropriate technology solution.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/consultation" className="btn-primary">
              Request free consultation
            </Link>
            <a
              href={whatsappSpecialistUrl({ page })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              WhatsApp a specialist
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
