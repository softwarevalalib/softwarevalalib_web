import testimonials from "../data/testimonials";
import Reveal from "../Animations/Reveal";

function Clientfeedback() {
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="section-padding bg-white overflow-hidden">
      <div className="section-container mb-10">
        <Reveal>
          <p className="section-label text-center">Client Testimonials</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="section-title text-center mt-3">Our Clients Feedbacks</h2>
        </Reveal>
      </div>

      <div className="overflow-hidden">
        <div className="slider-track flex gap-4 sm:gap-6">
          {doubled.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="shrink-0 w-[280px] sm:w-[340px] md:w-[400px] bg-white rounded-2xl shadow-md border border-slate-100 p-6 card-hover"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-500/20"
                />
                <div>
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-500">{item.company}</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                &ldquo;{item.feedback}&rdquo;
              </p>
              <p className="text-xs text-cyan-600 font-medium">{item.location}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Clientfeedback;
