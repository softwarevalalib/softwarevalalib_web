import { Link } from "react-router-dom";

import {
  AiOutlineClose,
  AiOutlineMenu,
  AiOutlineMoon,
  AiOutlineSun,
} from "react-icons/ai";
import React, { useEffect, useState } from "react";
import Topbar from "./Topbar";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem("site-theme");
      return savedTheme ? JSON.parse(savedTheme) : false;
    }
    return false;
  });

  useEffect(() => {
    window.localStorage.setItem("site-theme", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <>
      {/* <Topbar /> */}
      <header
        className={`sticky top-0 z-50 shadow-lg transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}
      >
        <div className="w-[90%] mx-auto h-20 flex items-center justify-between">
          {/* Logo */}
          <img src="" alt="Logo" className="w-32 h-auto md:w-40 rounded" />

          {/* Desktop Menu */}
          <nav className="hidden md:flex gap-8 font-semibold">
            {["Home", "About", "Services", "Projects", "Contact", "Team"].map(
              (item) => (
                <Link
                  key={item}
                  to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className={`relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full ${isDarkMode ? "text-slate-900 md:text-white" : "text-slate-900"}`}
                >
                  {item}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`rounded-full p-2 transition-colors duration-300 ${isDarkMode ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-900"}`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <AiOutlineSun size={20} />
              ) : (
                <AiOutlineMoon size={20} />
              )}
            </button>

            {/* Mobile Menu Button */}
            <div
              className="md:hidden cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <AiOutlineClose size={28} />
              ) : (
                <AiOutlineMenu size={28} />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden fixed top-20 left-0 w-50 h-full bg-white shadow-lg transition-all duration-500 ${
            isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
        >
          <nav className="flex flex-col p-6 gap-6 text-lg font-medium text-slate-900">
            <Link to="/" onClick={() => setIsOpen(false)}>
              Home
            </Link>

            <Link to="/about" onClick={() => setIsOpen(false)}>
              About
            </Link>

            <Link to="/services" onClick={() => setIsOpen(false)}>
              Services
            </Link>

            <Link to="/contact" onClick={() => setIsOpen(false)}>
              Contact
            </Link>

            <Link to="/team" onClick={() => setIsOpen(false)}>
              Team
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}

export default Navbar;
