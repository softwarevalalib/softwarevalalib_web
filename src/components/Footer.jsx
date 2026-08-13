import { Link } from "react-router-dom";
import { FiPhone, FiMapPin, FiMail } from "react-icons/fi";
import { AiOutlineWhatsApp } from "react-icons/ai";
import { FiFacebook, FiInstagram, FiYoutube, FiTwitter, FiArrowRight } from "react-icons/fi";

import { COMPANY_EMAIL } from "../config/company";
import Logo from "../images/logo.jpg";
import post1 from "../visuals/project1.jpg";
import post2 from "../visuals/project2.jpg";

const WHATSAPP_NUMBER = "231888636071";
const EMAIL_ADDRESS = COMPANY_EMAIL;
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

const recentPosts = [
  {
    img: post1,
    title: "Importers achieve savings through the First Sale rule!",
    date: "Sep 6, 2024",
    to: "/contact",
  },
  {
    img: post2,
    title: "Transid Named a Finalist For Year'25 Best Choice Award",
    date: "Sep 6, 2024",
    to: "/contact",
  },
];

const socials = [
  { icon: FiFacebook, label: "Facebook", href: "#" },
  { icon: FiInstagram, label: "Instagram", href: "#" },
  { icon: FiTwitter, label: "Twitter", href: "#" },
  { icon: FiYoutube, label: "YouTube", href: "#" },
];

function Footer() {
  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="section-container section-padding relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div>
            <img src={Logo} alt="Software Vala Liberia" className="w-36 rounded" />
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Full-stack software development agency in Monrovia, Liberia — building
              websites, apps, and systems that move businesses forward.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid place-items-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors duration-300"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <nav className="flex flex-col gap-3">
            <h3 className="text-orange-500 font-bold text-sm uppercase tracking-wider">Quick Links</h3>
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="link-underline text-slate-400 hover:text-cyan-400 transition-colors duration-300 text-sm w-fit"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Services */}
          <div>
            <h3 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-4">Our Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service} className="text-slate-400 text-sm">{service}</li>
              ))}
            </ul>
          </div>

          {/* Contact + recent posts */}
          <div>
            <h3 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-4">Get In Touch</h3>
            <ul className="space-y-3 text-sm mb-6">
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
              <li className="flex items-start gap-3 text-slate-400">
                <FiMapPin className="text-orange-500 shrink-0 mt-0.5" />
                <span>ELWA Junction, Monrovia, Liberia</span>
              </li>
            </ul>

            <h4 className="text-white font-semibold text-sm mb-3">Recent Posts</h4>
            <ul className="space-y-3">
              {recentPosts.map((post) => (
                <li key={post.title}>
                  <Link to={post.to} className="flex items-center gap-3 group">
                    <img src={post.img} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{post.date}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
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
