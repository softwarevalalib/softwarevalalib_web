import React from "react";
import ServicesHeader from "../components/ServicesHeader";
import ServicesOffered from "../components/ServicesOffered";
import ServicesContent from "../components/ServicesContent";

import Footer from "../components/Footer";
function Portfolio() {
  return (
    <div className="min-h-screen bg-black">
      <ServicesHeader />
      <ServicesOffered />
      <ServicesContent />
      <Footer />
    </div>
  );
}

export default Portfolio;
