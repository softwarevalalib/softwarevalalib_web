import React from "react";
import ServicesHeader from "../components/ServicesHeader";
import ServicesOffered from "../components/ServicesOffered";
import ServicesContent from "../components/ServicesContent";

import Footer from "../components/Footer";
function Services() {
  return (
    <div>
      <ServicesHeader />
      <ServicesOffered />
      <ServicesContent />
      <Footer />
    </div>
  );
}

export default Services;
