import testimonials from "../data/testimonials";
import Reveal from "../Animations/Reveal";
import StarRating from "./StarRating";

function Clientfeedback() {
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="section-padding bg-white overflow-hidden transition-colors duration-300">
      <div className="section-container mb-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">Client Testimonials</span>
            <h2 className="section-heading mt-3">
              What our awesome <span className="accent">customers</span> say
            </h2>
            <div className="mt-3 flex items-center justify-center gap-2">
              <StarRating count={5} />
              <span className="text-sm font-semibold text-slate-500 ">15k+ reviews</span>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="overflow-hidden">
        <div className="carousel-track">
          {doubled.map((item, index) => (
            <article
              key={`${item.id}-${index}`}
              className="lift shrink-0 w-[300px] sm:w-[360px] md:w-[400px] bg-white rounded-2xl shadow-md border border-slate-100 p-6"
            >
              <StarRating count={5} className="mb-3" />
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                &ldquo;{item.feedback}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#c10020]/20"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                  <p className="text-xs text-slate-500 ">{item.company}</p>
                </div>
              </div>
              <p className="text-xs text-cyan-600 font-medium mt-3">{item.location}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Clientfeedback;
