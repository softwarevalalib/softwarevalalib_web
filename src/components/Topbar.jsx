import { Link, useLocation } from "react-router-dom";
import {
  FiFacebook,
  FiInstagram,
  FiYoutube,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import {
  COMPANY_EMAIL,
  COMPANY_PHONE,
  FACEBOOK_URL,
  X_URL,
} from "../config/company";

const SOCIALS = [
  { icon: FiFacebook, label: "Facebook", href: FACEBOOK_URL },
  { icon: FaXTwitter, label: "X", href: X_URL },
  { icon: FiInstagram, label: "Instagram", href: "#" },
  { icon: FiYoutube, label: "YouTube", href: "#" },
];

export default function Topbar() {
  return (
    <div className="hidden md:block bg-[#00274c] text-white text-sm">
      <div className="section-container h-11 flex items-center justify-between gap-4">
        <p className="font-semibold uppercase tracking-wide text-white/90 shrink-0">
          Software Vala Liberia, Inc.
        </p>

        <div className="hidden lg:flex items-center gap-5 text-white/75 text-xs min-w-0">
          <a
            href={`mailto:${COMPANY_EMAIL}`}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <FiMail size={13} aria-hidden="true" />
            <span className="truncate">{COMPANY_EMAIL}</span>
          </a>
          <span className="text-white/30" aria-hidden="true">
            |
          </span>
          <a
            href={`tel:${COMPANY_PHONE.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <FiPhone size={13} aria-hidden="true" />
            {COMPANY_PHONE}
          </a>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith("http") ? "_blank" : undefined}
              rel={s.href.startsWith("http") ? "noreferrer" : undefined}
              aria-label={s.label}
              className="text-white/70 hover:text-[#c10020] transition-colors duration-300"
            >
              <s.icon size={15} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
