import React from "react";
import { Link } from "react-router-dom";
import GroupImage from "../images/group.png";
function Aboutus() {
  return (
    <div className="px-6">
      <h3 className="text-center text-orange-500 font-bold text-2xl pt-10 md:text-3xl">
        Our Story
      </h3>
      <h1 className="text-center uppercase text-3xl font-bold pt-3 pb-1">
        {" "}
        Software Vala Liberia
      </h1>

      <p className="text-start pt-4 lg:pr-5 lg:mb-10  px-5 ">
        Software Vala Liberia is a leading global software company with a
        growing footprint in Liberia. Our platform offers over 20 software
        solutions both locally and internationally tailored to education,
        finance, retail, and etc. We are proud of our commitment to delivering
        high-quality software services at competitive, fixed prices. <br />{" "}
        Software Development, Web Development, Web Hosting, Cloud Services,
        Network Infrastructure, Digital marketing, Training & Support,
        Cybersecurity Services, CCTV Installation, Graphic Design and Solar
        Energy. <br /> <br />
        As a leading Software Development agency and web design agency in
        Liberia, Software Vala Liberia, Inc. began with a simple mission: to
        bridge the technology gap in Liberia and provide world-class software
        solutions to local businesses and organizations. And we use software
        solutions to build solar energy system. Based in Paynesville, Monrovia,
        Liberia, we understand the unique challenges and opportunities that come
        with operating in Liberia's growing digital economy. Our team combines
        international expertise with local knowledge to deliver solutions that
        truly work for our clients. Today, we're proud to have helped over 2
        businesses transform their operations through technology, from small
        startups to established institutions across various sectors. Our mission
        is to bridge the technology gap in Liberia and provide world-class
        software solutions to local businesses and organizations. Our Mission is
        to be the leading and greatest trusted provider of diverse software
        solutions in Liberia — committed to quality, affordability, and digital
        transformation.
      </p>
      <div className="text-center mb-10">
        <Link
          to="/projects"
          className="inline-flex rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          View our projects
        </Link>
      </div>
      <h1 className="text-center uppercase text-3xl font-bold pt-8 pb-5">
        {" "}
        Our Projects
      </h1>
    </div>
  );
}

export default Aboutus;
