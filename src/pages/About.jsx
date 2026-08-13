import React from "react";
import Aboutheader from "../components/Aboutheader";
import Aboutus from "../components/Aboutus";
import WhyChooseUs from "../components/WhyChooseUs";
import CTABanner from "../components/CTABanner";
import Footer from "../components/Footer";

function About() {
  return (
    <div>
      <Aboutheader />
      <Aboutus />
      <WhyChooseUs />
      <CTABanner />
      <Footer />
    </div>
  );
}

export default About;
