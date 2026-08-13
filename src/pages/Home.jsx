import Homehero from "../components/Homehero";
import MarqueeTicker from "../components/MarqueeTicker";
import HomeServices from "../components/HomeServices";
import TrustStrip from "../components/TrustStrip";
import HomeAbout from "../components/HomeAbout";
import CaseStudies from "../components/CaseStudies";
import Stats from "../components/Stats";
import WhyChooseUs from "../components/WhyChooseUs";
import Pricing from "../components/Pricing";
import Clientfeedback from "../components/Clientfeedback";
import BlogNews from "../components/BlogNews";
import CTABanner from "../components/CTABanner";
import Newsletter from "../components/Newsletter";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Homehero />
      <MarqueeTicker />
      <HomeServices />
      <TrustStrip />
      <HomeAbout />
      <CaseStudies />
      <Stats />
      <WhyChooseUs />
      <Pricing />
      <Clientfeedback />
      <BlogNews />
      <CTABanner />
      <Newsletter />
      <Footer />
    </>
  );
}

export default Home;
