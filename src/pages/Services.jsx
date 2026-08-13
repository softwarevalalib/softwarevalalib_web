import React from "react";
import ServicesHeader from "../components/ServicesHeader";
import ServicesOffered from "../components/ServicesOffered";
import ServicesContent from "../components/ServicesContent";
import CTABanner from "../components/CTABanner";
import Footer from "../components/Footer";

function Services() {
  return (
    <div>
      <ServicesHeader />
      <ServicesOffered />
      <ServicesContent />
      <CTABanner />
      <Footer />
    </div>
  );
}

export default Services;
