import { Link, useLocation } from "react-router-dom";
import { FiPhone, FiMapPin, FiMail, FiFacebook, FiInstagram, FiYoutube } from "react-icons/fi";
import { AiOutlineWhatsApp } from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";
import {
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_WHATSAPP,
  COMPANY_ADDRESS,
  FACEBOOK_URL,
  X_URL,
  INSTAGRAM_URL,
  YOUTUBE_URL,
} from "../config/company";
import Logo from "../images/logo.jpg";

const whatsappUrl = `https://wa.me/${COMPANY_WHATSAPP}?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services.`;
const mailtoUrl = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent("Website inquiry")}`;

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Academy", to: "/academy" },
  { label: "Services", to: "/services" },
  { label: "Projects", to: "/projects" },
  { label: "Contact", to: "/contact" },
  { label: "Team", to: "/team" },
];

const services = [
  "Mobile App Development",
  "SEO & Digital Marketing",
  "Management Systems",
  "CCTV Installation",
  "Web Hosting & Maintenance",
  "Graphic Design",
];

const socials = [
  { icon: FiFacebook, label: "Facebook", href: FACEBOOK_URL },
  { icon: FaXTwitter, label: "X", href: X_URL },
  { icon: FiInstagram, label: "Instagram", href: INSTAGRAM_URL },
  { icon: FiYoutube, label: "YouTube", href: YOUTUBE_URL },
];

function Footer() {
  const { pathname } = useLocation();
  const showAcademyLogin = pathname.startsWith("/academy");

  return (
    <footer className="relative bg-[#00274c] text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#c10020]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="section-container section-padding relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div>
            <img
              src={Logo}
              alt="Software Vala Liberia"
              className="w-36 rounded bg-white p-1"
            />
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Full-stack software development agency in Monrovia, Liberia — building
              websites, apps, and systems that move businesses forward.
            </p>
            <div className="mt-5 flex items-center gap-3" role="list" aria-label="Social media">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Software Vala Liberia on ${s.label}`}
                  className="grid place-items-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-[#c10020] hover:text-white hover:border-[#c10020] transition-colors duration-300"
                  role="listitem"
                >
                  <s.icon size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <nav className="flex flex-col gap-3" aria-label="Footer">
            <h3 className="text-[#c10020] font-bold text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="link-underline text-white/70 hover:text-white transition-colors duration-300 text-sm w-fit"
              >
                {link.label}
              </Link>
            ))}
            {showAcademyLogin ? (
              <Link
                to="/academy/login"
                className="mt-2 inline-flex w-fit items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#c10020] hover:border-[#c10020] transition-colors"
              >
                Admin Login
              </Link>
            ) : null}
          </nav>

          <div>
            <h3 className="text-[#c10020] font-bold text-sm uppercase tracking-wider mb-4">
              Our Services
            </h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service} className="text-white/70 text-sm">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[#c10020] font-bold text-sm uppercase tracking-wider mb-4">
              Get In Touch
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-white/70">
                <FiPhone className="text-[#c10020] shrink-0" aria-hidden="true" />
                <a href={`tel:${COMPANY_PHONE.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                  {COMPANY_PHONE}
                </a>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <AiOutlineWhatsApp className="text-green-400 shrink-0" aria-hidden="true" />
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Chat on WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <FiMail className="text-[#c10020] shrink-0" aria-hidden="true" />
                <a href={mailtoUrl} className="hover:text-white transition-colors break-all">
                  {COMPANY_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/70">
                <FiMapPin className="text-[#c10020] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{COMPANY_ADDRESS}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-white/50 text-sm">
        <p>&copy; {new Date().getFullYear()} Software Vala Liberia. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
