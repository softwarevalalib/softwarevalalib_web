import React from "react";
import Homeheader from "../components/Homeheader";
import Homeabout from "../components/Homeabout";
import Clientfeedback from "../components/Clientfeedback";
import Stack from "../components/Stack";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Homeheader />
      <Homeabout />
      <Clientfeedback />
      <Stack />
      <Newsletter />
      <Footer />
    </>
  );
}

export default Home;
