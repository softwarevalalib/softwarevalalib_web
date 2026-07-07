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
        className={`relative mx-auto mb-4 ${
          featured ? "w-32 h-32 sm:w-36 sm:h-36" : "w-28 h-28"
        }`}
      >
        {member.img ? (
          <img
            src={member.img}
            alt={member.Name}
            className="w-full h-full rounded-full object-cover ring-4 ring-slate-100 group-hover:ring-orange-500/30 transition-all duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-linear-to-br from-orange-500 to-cyan-600 flex items-center justify-center ring-4 ring-slate-100 group-hover:ring-orange-500/30 transition-all duration-300">
            <span className={`font-bold text-white ${featured ? "text-3xl" : "text-2xl"}`}>
              {getInitials(member.Name)}
            </span>
          </div>
        )}
      </div>
      <h3 className={`font-bold text-slate-900 ${featured ? "text-xl sm:text-2xl" : "text-lg"}`}>
        {member.Name}
      </h3>
      <p className={`text-orange-500 font-semibold mt-1 ${featured ? "text-base" : "text-sm"}`}>
        {member.Position}
      </p>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{member.Biography}</p>
    </article>
  );
}

function TeamCard() {
  const leadership = Team.filter((m) => m.tier === "leadership");
  const hr = Team.filter((m) => m.tier === "hr");
  const team = Team.filter((m) => m.tier === "team");

  return (
    <>
      <section className="relative bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full" />
        </div>
        <div className="section-container section-padding relative z-10 text-center">
          <Reveal>
            <p className="section-label text-orange-500">Our People</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3">
              The Team of Experienced Engineers
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
              Meet the talented professionals behind Software Vala Liberia&apos;s success.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-slate-50 space-y-14">
        {/* Leadership: Founder & Co-Founder */}
        <div className="section-container">
          <Reveal>
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-orange-500 mb-8">
              Meet Our Team
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

        {/* HR */}
        <div className="section-container">
          <Reveal>
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-orange-500 mb-8">
              Human Resources
            </h2>
          </Reveal>
          <div className="max-w-sm mx-auto">
            {hr.map((member, index) => (
              <Reveal key={member.id} delay={index * 0.1}>
                <MemberCard member={member} />
              </Reveal>
            ))}
          </div>
        </div>

        {/* Rest of team */}
        <div className="section-container">
          <Reveal>
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-orange-500 mb-8">
              Our Team
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
