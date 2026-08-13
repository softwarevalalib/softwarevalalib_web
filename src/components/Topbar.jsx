import { COMPANY_EMAIL } from "../config/company";
import { FiFacebook, FiInstagram, FiYoutube, FiTwitter } from "react-icons/fi";

const SOCIALS = [
  { icon: FiFacebook, label: "Facebook", href: "#" },
  { icon: FiInstagram, label: "Instagram", href: "#" },
  { icon: FiTwitter, label: "Twitter", href: "#" },
  { icon: FiYoutube, label: "YouTube", href: "#" },
];

export default function Topbar() {
  return (
    <div className="hidden md:block bg-slate-950 text-white text-sm">
      <div className="section-container h-11 flex items-center justify-between">
        <p className="font-semibold uppercase tracking-wide text-orange-500">
          Software Vala Liberia, Inc.
        </p>
        <div className="hidden lg:flex items-center gap-6 text-slate-300 text-xs">
          <span>Email: {COMPANY_EMAIL}</span>
          <span className="text-slate-600">|</span>
          <span>ELWA Junction, Paynesville, Monrovia, Liberia</span>
        </div>
        <div className="flex items-center gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="text-slate-400 hover:text-orange-500 transition-colors duration-300"
            >
              <s.icon size={16} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
