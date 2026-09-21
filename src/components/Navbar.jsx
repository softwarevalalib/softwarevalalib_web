import { Link, useLocation } from "react-router-dom";
import Logo from "../images/logo.jpg";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { COMPANY_WHATSAPP } from "../config/company";

const WHATSAPP_URL = `https://wa.me/${COMPANY_WHATSAPP}?text=Hi%20SVL%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20services.`;

const navLinks = [
  { label: "Home", path: "/" },
  {
    label: "Company",
    children: [
      { label: "About Us", path: "/about", desc: "Our story & mission" },
      { label: "Our Team", path: "/team", desc: "Meet the engineers" },
      { label: "Projects", path: "/projects", desc: "Systems we've built" },
    ],
  },
  { label: "Academy", path: "/academy" },
  { label: "Services", path: "/services" },
  { label: "Projects", path: "/projects", hideOnMd: true },
  { label: "Team", path: "/team", hideOnMd: true },
  { label: "Contact", path: "/contact" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();

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
    `relative px-2.5 lg:px-3 xl:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap ${
      isActive(path)
        ? "text-[#c10020] bg-[#c10020]/10"
        : "text-[#00274c]/80 hover:text-[#00274c] hover:bg-[#00274c]/5"
    }`;

  return (
    <header className="sticky top-0 md:top-11 z-50 bg-white/95 backdrop-blur-md border-b border-[#00274c]/10 shadow-sm">
      <div className="section-container h-16 sm:h-20 relative flex items-center justify-between">
        <Link
          to="/"
          className="shrink-0 z-10 transition-transform duration-300 hover:scale-[1.02]"
          aria-label="Software Vala Liberia home"
        >
          <img
            src={Logo}
            alt="Software Vala Liberia — The Name of Trust"
            className="w-28 sm:w-36 h-auto rounded"
          />
        </Link>

        <nav
          className="hidden md:flex items-center justify-center gap-0.5 lg:gap-1 xl:gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[min(58vw,640px)]"
          aria-label="Primary"
        >
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
                  className={`${linkClass(item.children[0].path)} flex items-center gap-1`}
                  aria-expanded={openDropdown === item.label}
                  aria-haspopup="true"
                  onClick={() =>
                    setOpenDropdown((prev) => (prev === item.label ? null : item.label))
                  }
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={`transition-transform duration-300 ${
                      openDropdown === item.label ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openDropdown === item.label && (
                  <div className="mega-panel absolute left-1/2 -translate-x-1/2 top-full pt-3 w-72">
                    <div className="rounded-2xl glass-light p-2 shadow-xl shadow-[#00274c]/10">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="block rounded-xl px-4 py-3 transition-colors duration-200 hover:bg-[#c10020]/8 group"
                        >
                          <span className="block text-sm font-semibold text-[#00274c] group-hover:text-[#c10020]">
                            {child.label}
                          </span>
                          <span className="block text-xs text-slate-500">{child.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`${linkClass(item.path)} ${item.hideOnMd ? "hidden lg:inline-flex" : ""}`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2 z-10">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex btn-primary !py-2.5 !px-4 !text-xs sm:!text-sm"
          >
            Get Started
          </a>

          <button
            type="button"
            className="md:hidden p-2 text-[#00274c] rounded-lg hover:bg-[#00274c]/5 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <AiOutlineClose size={26} /> : <AiOutlineMenu size={26} />}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden fixed inset-0 top-16 sm:top-20 z-40 transition-all duration-500 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-[#00274c]/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
        <nav
          className={`relative bg-white border-t border-[#00274c]/10 p-6 flex flex-col gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto transition-transform duration-500 ${
            isOpen ? "translate-y-0" : "-translate-y-4"
          }`}
          aria-label="Mobile"
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
                    className="block px-4 py-2.5 rounded-xl text-base font-medium text-[#00274c] hover:text-[#c10020] hover:bg-[#c10020]/5"
                    style={{ transitionDelay: isOpen ? `${i * 40}ms` : "0ms" }}
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
                    ? "text-[#c10020] bg-[#c10020]/10"
                    : "text-[#00274c] hover:bg-[#00274c]/5"
                }`}
                style={{ transitionDelay: isOpen ? `${i * 40}ms` : "0ms" }}
              >
                {item.label}
              </Link>
            )
          )}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-4 w-full"
            onClick={() => setIsOpen(false)}
          >
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
