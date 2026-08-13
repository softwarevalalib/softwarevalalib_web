import { Link, useLocation } from "react-router-dom";
import Logo from "../images/logo.jpg";
import { AiOutlineClose, AiOutlineMenu, AiOutlineMoon, AiOutlineSun } from "react-icons/ai";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const WHATSAPP_NUMBER = "231888636071";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services.`;

// Mega-menu structure (digtek-style)
const navLinks = [
  {
    label: "Home",
    path: "/",
  },
  {
    label: "Company",
    children: [
      { label: "About Us", path: "/about", desc: "Our story & mission" },
      { label: "Our Team", path: "/team", desc: "Meet the engineers" },
      { label: "Projects", path: "/projects", desc: "Systems we've built" },
    ],
  },
  {
    label: "Services",
    path: "/services",
  },
  {
    label: "Projects",
    path: "/projects",
  },
  {
    label: "Team",
    path: "/team",
  },
  {
    label: "Contact",
    path: "/contact",
  },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const linkClass = (path) =>
    `relative px-3 lg:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
      isActive(path)
        ? "text-orange-500 bg-orange-500/10"
        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
    }`;

  return (
    <header className="sticky top-0 md:top-11 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors duration-300">
      <div className="section-container h-16 sm:h-20 relative flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="shrink-0 z-10 transition-transform duration-300 hover:scale-105">
          <img src={Logo} alt="Software Vala Liberia" className="w-28 sm:w-36 h-auto rounded" />
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden md:flex items-center justify-center gap-1 lg:gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navLinks.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  className={`${linkClass(
                    item.children[0].path
                  )} flex items-center gap-1`}
                  onClick={() =>
                    setOpenDropdown((prev) => (prev === item.label ? null : item.label))
                  }
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${
                      openDropdown === item.label ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Mega panel */}
                {openDropdown === item.label && (
                  <div className="mega-panel absolute left-1/2 -translate-x-1/2 top-full pt-4 w-72">
                    <div className="rounded-2xl glass-light dark:glass p-2 shadow-2xl shadow-black/10 dark:shadow-black/40">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="block rounded-xl px-4 py-3 transition-colors duration-200 hover:bg-orange-500/10 group"
                        >
                          <span className="block text-sm font-semibold text-slate-900 dark:text-white group-hover:text-orange-500">
                            {child.label}
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {child.desc}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.path} to={item.path} className={linkClass(item.path)}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 z-10">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-orange-500 text-white transition-all duration-300 hover:bg-orange-600 hover:-translate-y-0.5"
          >
            Get Started
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors duration-300"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <AiOutlineSun size={22} /> : <AiOutlineMoon size={22} />}
          </button>

          <button
            type="button"
            className="md:hidden p-2 text-slate-700 dark:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <AiOutlineClose size={26} /> : <AiOutlineMenu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 top-16 sm:top-20 z-40 transition-all duration-500 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
        <nav
          className={`relative bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 p-6 flex flex-col gap-1 transition-transform duration-500 ${
            isOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          {navLinks.map((item, i) =>
            item.children ? (
              <div key={item.label} className="py-1">
                <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.path}
                    to={child.path}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2 rounded-xl text-lg font-medium text-slate-600 dark:text-slate-300 hover:text-orange-500"
                    style={{ transitionDelay: isOpen ? `${i * 50}ms` : "0ms" }}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
                  isActive(item.path)
                    ? "text-orange-500 bg-orange-500/10"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
                style={{ transitionDelay: isOpen ? `${i * 50}ms` : "0ms" }}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
