import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { trackAcademyEvent } from "../../utils/academyApi";

/** Floating ENROLL NOW CTA — Academy routes only. */
export default function AcademyEnrollFloat() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const isAcademy = location.pathname.startsWith("/academy");

  useEffect(() => {
    if (!isAcademy) return undefined;
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, [isAcademy]);

  if (!isAcademy) return null;

  return (
    <Link
      to="/academy/enroll"
      onClick={() => trackAcademyEvent("enroll_click", { source: "floating" })}
      className={`fixed z-40 right-4 md:right-6 bottom-24 md:bottom-8 inline-flex items-center justify-center min-h-12 px-5 rounded-full bg-[#c10020] text-white text-sm font-bold uppercase tracking-wide shadow-lg shadow-[#c10020]/35 transition-all duration-300 hover:bg-[#a0001a] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
      aria-label="Enroll now in SVL Training Academy"
    >
      Enroll Now
    </Link>
  );
}
