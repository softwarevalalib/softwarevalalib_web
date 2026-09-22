import { Link, useLocation } from "react-router-dom";
import {
  FiFacebook,
  FiInstagram,
  FiYoutube,
  FiPhone,
  FiMail,
  FiLogIn,
} from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import {
  COMPANY_EMAIL,
  COMPANY_PHONE,
  FACEBOOK_URL,
  X_URL,
  INSTAGRAM_URL,
  YOUTUBE_URL,
} from "../config/company";
import { getStoredPortalUser } from "../utils/portalApi";

const SOCIALS = [
  { icon: FiFacebook, label: "Facebook", href: FACEBOOK_URL },
  { icon: FaXTwitter, label: "X", href: X_URL },
  { icon: FiInstagram, label: "Instagram", href: INSTAGRAM_URL },
  { icon: FiYoutube, label: "YouTube", href: YOUTUBE_URL },
];

function portalHomeFor(user) {
  if (!user) return "/academy/portal/login";
  return user.role === "instructor"
    ? "/academy/portal/instructor"
    : "/academy/portal/student";
}

export default function Topbar() {
  const { pathname } = useLocation();
  const onAcademy = pathname.startsWith("/academy");
  const portalUser = onAcademy ? getStoredPortalUser() : null;
  const portalHref = portalHomeFor(portalUser);
  const portalLabel = portalUser ? "My Dashboard" : "Portal Login";

  return (
    <div className="hidden md:block bg-[#00274c] text-white text-sm">
      <div className="section-container h-11 flex items-center justify-between gap-3 lg:gap-4">
        <p className="font-semibold uppercase tracking-wide text-white/90 shrink-0 text-xs lg:text-sm">
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

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onAcademy ? (
            <Link
              to={portalHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              title="Students & instructors portal"
            >
              <FiLogIn size={13} aria-hidden="true" />
              {portalLabel}
            </Link>
          ) : null}

          <div className="flex items-center gap-2 sm:gap-3" role="list" aria-label="Social media">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Software Vala Liberia on ${s.label}`}
                className="grid place-items-center w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-300"
                role="listitem"
              >
                <s.icon size={15} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
