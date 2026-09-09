import Reveal from "../Animations/Reveal";

function ServicesOffered() {
  return (
    <section className="section-padding bg-white transition-colors duration-300">
      <div className="section-container text-center">
        <Reveal>
          <span className="eyebrow">End To End</span>
          <h2 className="section-heading mt-3">What We Offer</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            From concepts to deployment, we provide end-to-end technology solutions
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export default ServicesOffered;
