import { Link, useLocation } from "react-router-dom";
import Logo from "../images/logo.jpg";
import { AiOutlineClose, AiOutlineMenu, AiOutlineMoon, AiOutlineSun } from "react-icons/ai";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Projects", path: "/projects" },
  { label: "Contact", path: "/contact" },
  { label: "Team", path: "/team" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const linkClass = (path) =>
    `relative px-3 lg:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
      isActive(path)
        ? "text-orange-500 bg-orange-500/10"
        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
    }`;

  const mobileLinkClass = (path) =>
    `px-4 py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
      isActive(path)
        ? "text-orange-500 bg-orange-500/10"
        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-sm dark:shadow-lg dark:shadow-black/20 transition-colors duration-300">
      <div className="section-container h-16 sm:h-20 relative flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="shrink-0 z-10 transition-transform duration-300 hover:scale-105">
          <img src={Logo} alt="Software Vala Liberia" className="w-28 sm:w-36 h-auto rounded" />
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden md:flex items-center justify-center gap-1 lg:gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navLinks.map((item) => (
            <Link key={item.path} to={item.path} className={linkClass(item.path)}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 z-10">
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
          {navLinks.map((item, i) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={mobileLinkClass(item.path)}
              style={{ transitionDelay: isOpen ? `${i * 50}ms` : "0ms" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
