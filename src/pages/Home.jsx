import Homehero from "../components/Homehero";
import MarqueeTicker from "../components/MarqueeTicker";
import ClientProblems from "../components/ClientProblems";
import { Link } from "react-router-dom";
import { solutions } from "../data/solutions";
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
      <section className="section-padding bg-slate-50">
        <div className="section-container">
          <h2 className="font-display text-3xl font-bold text-[#00274c]">Technology solutions for your industry</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {solutions.filter((item) => item.kind === "industry").map((item) => (
              <Link key={item.slug} to={`/solutions/${item.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#00274c]">
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
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
