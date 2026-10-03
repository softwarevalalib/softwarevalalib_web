import Homehero from "../components/Homehero";
import MarqueeTicker from "../components/MarqueeTicker";
import ClientProblems from "../components/ClientProblems";
import HomeServices from "../components/HomeServices";
import HomeAbout from "../components/Homeabout";
import CaseStudies from "../components/CaseStudies";
import Stats from "../components/Stats";
import WhyChooseUs from "../components/WhyChooseUs";
import Pricing from "../components/Pricing";
import Clientfeedback from "../components/Clientfeedback";
import ConsultationCta from "../components/ConsultationCta";
import CTABanner from "../components/CTABanner";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Homehero />
      <MarqueeTicker />
      <ClientProblems />
      <HomeServices />
      <HomeAbout />
      <CaseStudies />
      <Stats />
      <WhyChooseUs />
      <Pricing />
      <Clientfeedback />
      <ConsultationCta page="home" />
      <CTABanner />
      <Newsletter />
      <Footer />
    </>
  );
}

export default Home;
