import Navbar from "../components/Navbar";
import Topbar from "../components/Topbar";
import WhatsAppFloating from "../components/WhatsAppFloating";
import BackToTop from "../components/BackToTop";
import ScrollToTop from "../components/ScrollToTop";
import { Outlet } from "react-router-dom";

function Mainlayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      <Topbar />
      <Navbar />
      <ScrollToTop />
      <main className="flex-1">
        <Outlet />
      </main>
      <WhatsAppFloating />
      <BackToTop />
    </div>
  );
}

export default Mainlayout;
