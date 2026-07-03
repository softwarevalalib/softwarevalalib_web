import Navbar from "../components/Navbar";
import WhatsAppFloating from "../components/WhatsAppFloating";
import ScrollToTop from "../components/ScrollToTop";
import { Outlet } from "react-router-dom";
import React from "react";

function Mainlayout() {
  return (
    <div>
      <Navbar />
      <ScrollToTop />
      <Outlet />
      <WhatsAppFloating />
    </div>
  );
}

export default Mainlayout;
