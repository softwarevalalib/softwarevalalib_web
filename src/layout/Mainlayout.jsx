import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import WhatsAppFloating from "../components/WhatsAppFloating";
import BackToTop from "../components/BackToTop";
import ScrollToTop from "../components/ScrollToTop";
import AcademyEnrollFloat from "../components/academy/AcademyEnrollFloat";
import AcademyAssistant from "../components/assistant/AcademyAssistant";
import { Outlet } from "react-router-dom";

function Mainlayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0f172a]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Topbar />
      <Navbar />
      <ScrollToTop />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <AcademyEnrollFloat />
      <AcademyAssistant />
      <WhatsAppFloating />
      <BackToTop />
    </div>
  );
}

export default Mainlayout;
