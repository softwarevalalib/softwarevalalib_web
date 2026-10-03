import { Link, useSearchParams } from "react-router-dom";
import { whatsappSpecialistUrl } from "../utils/whatsapp";

export default function ThankYou() {
  const [params] = useSearchParams();
  const ref = params.get("ref") || "";

  return (
    <section className="section-padding bg-slate-50 min-h-[70vh]">
      <div className="section-container max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">Request received</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-[#00274c]">
          Thank you. Let&apos;s build something valuable together.
        </h1>
        <p className="mt-4 text-slate-600">
          Software Vala Liberia has received your request. A member of the team will review it and contact you
          using the method you selected.
        </p>
        {ref ? (
          <p className="mt-4 text-sm font-semibold text-[#00274c]">
            Reference: <span className="font-mono">{ref}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a href={whatsappSpecialistUrl({ page: "thank-you" })} className="btn-primary" target="_blank" rel="noopener noreferrer">
            WhatsApp a specialist
          </a>
          <Link to="/services" className="btn-outline">
            Explore solutions
          </Link>
        </div>
      </div>
    </section>
  );
}
