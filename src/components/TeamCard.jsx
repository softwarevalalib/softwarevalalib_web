import Team from "../data/Team";
import Footer from "../components/Footer";
import Reveal from "../Animations/Reveal";

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function MemberCard({ member, featured = false }) {
  return (
    <article
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 text-center card-hover group ${
        featured ? "p-8" : "p-6"
      }`}
    >
      <div
        className={`relative mx-auto mb-5 aspect-square shrink-0 overflow-hidden rounded-full ring-4 ring-slate-100 transition-[box-shadow] duration-300 group-hover:ring-[#c10020]/30 ${
          featured ? "w-32 sm:w-36" : "w-28"
        }`}
      >
        {member.img ? (
          <img
            src={member.img}
            alt={member.Name}
            width={144}
            height={144}
            className="block h-full w-full max-w-none object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#c10020] to-cyan-600">
            <span className={`font-bold text-white ${featured ? "text-3xl" : "text-2xl"}`}>
              {getInitials(member.Name)}
            </span>
          </div>
        )}
      </div>
      <h3 className={`font-bold text-slate-900 ${featured ? "text-xl sm:text-2xl" : "text-lg"}`}>
        {member.Name}
      </h3>
      <p className={`text-[#c10020] font-semibold mt-1 ${featured ? "text-base" : "text-sm"}`}>
        {member.Position}
      </p>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{member.Biography}</p>
    </article>
  );
}

function TeamCard() {
  const leadership = Team.filter((m) => m.tier === "leadership");
  const team = Team.filter((m) => m.tier === "team");

  return (
    <>
      <section className="relative bg-[#00274c] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-[#c10020]/20 blur-[100px] rounded-full" />
        </div>
        <div className="section-container section-padding relative z-10 text-center">
          <Reveal>
            <span className="eyebrow text-[#ff6b81]">Our People</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="section-heading text-white mt-3">
              The Team of Experienced <span className="gradient-brand">Engineers</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-white/80 text-base sm:text-lg max-w-2xl mx-auto">
              Meet the talented professionals behind Software Vala Liberia&apos;s success.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-slate-50 space-y-14 transition-colors duration-300">
        <div className="section-container">
          <Reveal>
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-[#c10020] mb-8">
              Leadership
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
            {leadership.map((member, index) => (
              <Reveal key={member.id} delay={index * 0.1}>
                <MemberCard member={member} featured />
              </Reveal>
            ))}
          </div>
        </div>

        <div className="section-container">
          <Reveal>
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-[#c10020] mb-8">
              Our Team
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
            {team.map((member, index) => (
              <Reveal key={member.id} delay={index * 0.06}>
                <MemberCard member={member} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default TeamCard;
