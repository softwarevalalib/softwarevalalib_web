import { Link, useLocation } from "react-router-dom";
import Logo from "../images/logo.jpg";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/20">
      <div className="section-container h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="shrink-0 transition-transform duration-300 hover:scale-105">
          <img src={Logo} alt="Software Vala Liberia" className="w-28 sm:w-36 h-auto rounded" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-3 lg:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                isActive(item.path)
                  ? "text-orange-500 bg-orange-500/10"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <AiOutlineClose size={26} /> : <AiOutlineMenu size={26} />}
        </button>
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
          className={`relative bg-slate-950 border-t border-white/10 p-6 flex flex-col gap-1 transition-transform duration-500 ${
            isOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          {navLinks.map((item, i) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`px-4 py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
                isActive(item.path)
                  ? "text-orange-500 bg-orange-500/10"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
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
