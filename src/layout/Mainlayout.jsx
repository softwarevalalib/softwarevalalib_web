import Navbar from "../components/Navbar";
import WhatsAppFloating from "../components/WhatsAppFloating";
import ScrollToTop from "../components/ScrollToTop";
import { Outlet } from "react-router-dom";

function Mainlayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <ScrollToTop />
      <main className="flex-1">
        <Outlet />
      </main>
      <WhatsAppFloating />
    </div>
  );
}

export default Mainlayout;
