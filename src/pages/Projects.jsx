import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiGlobe, FiSmartphone, FiMonitor, FiDatabase } from "react-icons/fi";
import projectsData from "../data/projects.json";
import Footer from "../components/Footer";

// Use public paths for project images (most reliable for Render)
// Images should be in public/assets/images/ folder
function resolveProjectImage(fileName) {
  if (!fileName) return null;

  // Use public path - files are in public/assets/images/
  return `/assets/images/${fileName}`;
}

const Projects = () => {
  const [filter, setFilter] = useState("All");
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const categories = [
    "All",
    "Web Development",
    "Mobile Applications",
    "Software Development",
    "Database & Systems",
  ];

  const filteredProjects =
    filter === "All"
      ? projectsData
      : projectsData.filter((project) => project.category === filter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          padding: "5rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "1.5rem",
              opacity: 1,
              transform: "translateY(0)",
              transition: "all 0.8s ease-out",
            }}
          >
            Our Projects
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              color: "#6b7280",
              maxWidth: "700px",
              margin: "0 auto",
              lineHeight: "1.6",
              opacity: 1,
              transform: "translateY(0)",
              transition: "all 0.8s ease-out 0.2s",
            }}
          >
            Explore our portfolio of successful projects that have helped
            businesses across Liberia achieve their digital goals
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section
        ref={sectionRef}
        style={{ padding: "3rem 1rem", backgroundColor: "white" }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              transform: isVisible ? "translateY(0)" : "translateY(30px)",
              opacity: isVisible ? 1 : 0,
              transition: "all 0.6s ease-out",
            }}
          >
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "1.5rem",
              }}
            >
              Filter by Category
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "0.75rem",
              }}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "25px",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor:
                      filter === category ? "#3b82f6" : "#f3f4f6",
                    color: filter === category ? "white" : "#374151",
                    boxShadow:
                      filter === category
                        ? "0 4px 15px rgba(59, 130, 246, 0.3)"
                        : "none",
                  }}
                  onMouseOver={(e) => {
                    if (filter !== category) {
                      e.target.style.backgroundColor = "#e5e7eb";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (filter !== category) {
                      e.target.style.backgroundColor = "#f3f4f6";
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section style={{ padding: "3rem 1rem", backgroundColor: "#f8fafc" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "2rem",
              opacity: isVisible ? 1 : 0,
              transition: "opacity 0.6s ease-out",
            }}
          >
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  transform: isVisible ? "translateY(0)" : "translateY(50px)",
                  transitionDelay: `${index * 0.1}s`,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 40px rgba(0, 0, 0, 0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(0, 0, 0, 0.1)";
                }}
              >
                {/* Project Image */}
                <div
                  style={{
                    height: "200px",
                    position: "relative",
                    backgroundColor: "#0f172a",
                    overflow: "hidden",
                    color: "white",
                  }}
                >
                  {resolveProjectImage(project.image) ? (
                    <img
                      src={resolveProjectImage(project.image)}
                      alt={`${project.title} cover`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "4rem",
                        opacity: 0.25,
                        color: "white",
                      }}
                    >
                      {project.category === "Web Development" && (
                        <FiGlobe size={64} />
                      )}
                      {project.category === "Mobile Applications" && (
                        <FiSmartphone size={64} />
                      )}
                      {project.category === "Software Development" && (
                        <FiMonitor size={64} />
                      )}
                      {project.category === "Database & Systems" && (
                        <FiDatabase size={64} />
                      )}
                    </div>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      color: "#3b82f6",
                      padding: "0.5rem 1rem",
                      borderRadius: "15px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }}
                  >
                    {project.category}
                  </div>
                </div>

                {/* Project Content */}
                <div style={{ padding: "2rem" }}>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#1f2937",
                      marginBottom: "1rem",
                    }}
                  >
                    {project.title}
                  </h3>

                  <p
                    style={{
                      color: "#6b7280",
                      lineHeight: "1.6",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {project.description}
                  </p>

                  {/* Technologies */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#3b82f6",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* View Project Link */}
                  <Link
                    to={project.link || "#"}
                    style={{
                      color: "#3b82f6",
                      textDecoration: "none",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "color 0.2s ease",
                    }}
                    onMouseOver={(e) => (e.target.style.color = "#2563eb")}
                    onMouseOut={(e) => (e.target.style.color = "#3b82f6")}
                  >
                    View Project →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                opacity: isVisible ? 1 : 0,
                transition: "opacity 0.6s ease-out",
              }}
            >
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "1.125rem",
                }}
              >
                No projects found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "5rem 1rem",
          backgroundColor: "#3b82f6",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              transform: isVisible ? "translateY(0)" : "translateY(30px)",
              opacity: isVisible ? 1 : 0,
              transition: "all 0.6s ease-out 0.4s",
            }}
          >
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "white",
                marginBottom: "1rem",
              }}
            >
              Ready to Start Your Project?
            </h2>
            <p
              style={{
                fontSize: "1.25rem",
                color: "#dbeafe",
                marginBottom: "2rem",
                maxWidth: "700px",
                margin: "0 auto 2rem auto",
                lineHeight: "1.6",
              }}
            >
              Let's work together to bring your ideas to life. Contact us today
              for a free consultation.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "1rem",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Link
                to="/contact"
                style={{
                  backgroundColor: "white",
                  color: "#3b82f6",
                  padding: "1rem 2rem",
                  borderRadius: "12px",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  display: "inline-block",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#f3f4f6")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "white")}
              >
                Get Started
              </Link>
              <Link
                to="/services"
                style={{
                  border: "2px solid white",
                  color: "white",
                  padding: "1rem 2rem",
                  borderRadius: "12px",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  display: "inline-block",
                  backgroundColor: "transparent",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.color = "#3b82f6";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "white";
                }}
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Projects;
