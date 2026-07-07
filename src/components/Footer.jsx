import { Link } from "react-router-dom";
import { FiPhone, FiMapPin, FiMail } from "react-icons/fi";
import { AiOutlineWhatsApp } from "react-icons/ai";

const WHATSAPP_NUMBER = "231888636071";
const EMAIL_ADDRESS = "softwarevalaliberiainc@gmail.com";
const EMAIL_SUBJECT = encodeURIComponent("Website inquiry");
const EMAIL_BODY = encodeURIComponent("Hi SVL,\n\nI'd like to learn more about your services.");
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services.`;
const mailtoUrl = `mailto:${EMAIL_ADDRESS}?subject=${EMAIL_SUBJECT}&body=${EMAIL_BODY}`;

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
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

function Footer() {
  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="section-container section-padding relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <nav className="flex flex-col gap-3">
            <h3 className="text-orange-500 font-bold text-sm uppercase tracking-wider">Quick Links</h3>
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-slate-400 hover:text-cyan-400 transition-colors duration-300 text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div>
            <h3 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-4">Our Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service} className="text-slate-400 text-sm">{service}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-slate-400">
                <FiPhone className="text-orange-500 shrink-0" />
                <a href="tel:+231889552016" className="hover:text-cyan-400 transition-colors">
                  +231 889 552 016
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <AiOutlineWhatsApp className="text-green-500 shrink-0" />
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                  Chat on WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <FiMail className="text-orange-500 shrink-0" />
                <a href={mailtoUrl} className="hover:text-cyan-400 transition-colors break-all">
                  {EMAIL_ADDRESS}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-4">Our Office</h3>
            <div className="flex items-start gap-3 text-slate-400 text-sm">
              <FiMapPin className="text-orange-500 shrink-0 mt-0.5" />
              <span>ELWA Junction, Monrovia, Liberia</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-6 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Software Vala Liberia. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
