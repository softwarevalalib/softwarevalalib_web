import Bootstrap from "../images/stacks/bootstrap-logo.png";
import CSS from "../images/stacks/css3-logo.png";
import Django from "../images/stacks/django-logo.png";
import HTML from "../images/stacks/html5-logo.png";
import SQL from "../images/stacks/mysql-logo.png";
import JS from "../images/stacks/js5-logo.png";
import PYTHON from "../images/stacks/python-logo.png";
import REACT from "../images/stacks/react-logo.png";
import TAILWIND from "../images/stacks/tailwind-css.png";
import NEXT from "../images/stacks/next.png";
import Reveal from "../Animations/Reveal";

const technologies = [
  { src: Bootstrap, name: "Bootstrap" },
  { src: CSS, name: "CSS3" },
  { src: Django, name: "Django" },
  { src: HTML, name: "HTML5" },
  { src: SQL, name: "MySQL" },
  { src: JS, name: "JavaScript" },
  { src: PYTHON, name: "Python" },
  { src: REACT, name: "React" },
  { src: TAILWIND, name: "Tailwind CSS" },
  { src: NEXT, name: "Next.js" },
];

function TechStack() {
  const doubled = [...technologies, ...technologies];

  return (
    <section className="section-padding bg-slate-50 overflow-hidden transition-colors duration-300">
      <div className="section-container mb-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">Our Tech Stack</span>
            <h2 className="section-heading mt-3">Our Daily Technologies</h2>
          </div>
        </Reveal>
      </div>

      <div className="overflow-hidden py-4">
        <div className="marquee">
          {doubled.map((tech, index) => (
            <div key={`${tech.name}-${index}`} className="flex items-center justify-center mx-8 sm:mx-12">
              <img
                src={tech.src}
                alt={tech.name}
                className="h-12 sm:h-16 w-auto opacity-70 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TechStack;
