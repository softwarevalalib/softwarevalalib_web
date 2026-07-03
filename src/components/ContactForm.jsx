import React, { useEffect, useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Briefcase,
  Send,
  ChevronDown,
} from "lucide-react";

const initialFormData = {
  fullName: "",
  email: "",
  location: "",
  phone: "",
  company: "",
  service: "",
  budget: "",
  contactMethod: "",
  message: "",
};

function Contact() {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const savedFormData = window.localStorage.getItem("contact-form-data");

    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("contact-form-data", JSON.stringify(formData));
  }, [formData]);

  const services = [
    "SEO",
    "Web Development",
    "Software Development",
    "Mobile App Development",
    "Electricity",
    "CCTV Camera Installation",
    "Solar Installation",
    "Database Management",
    "Content Creating",
    "Social Media Management",
  ];

  const budgetOptions = [
    "Not sure yet",
    "$100 - $500",
    "$500 - $1,000",
    "$1,000 - $3,000",
    "$3,000 - $5,000",
    "$5,000+",
  ];

  const contactMethods = ["Email", "Phone Call", "WhatsApp", "Any"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Submitted Data:", formData);

    alert("Your request has been submitted successfully!");

    setFormData(initialFormData);
    window.localStorage.removeItem("contact-form-data");
  };

  return (
    <section className="relative min-h-screen bg-slate-900 text-white px-4 py-16 sm:px-6 lg:px-8">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* heading */}
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm font-medium text-orange-500">
            Contact Us
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Let’s Build Something Great Together
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            Tell us about your project, business needs, or service request.
            Whether you need a website, mobile app, SEO, solar installation,
            CCTV setup, or business support services, our team is ready to help.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          {/* LEFT SIDE INFO */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold">
              Let’s Talk About Your Project
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              We work with startups, businesses, schools, and organizations to
              deliver smart digital and technical solutions tailored to their
              needs.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Email Us</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    hello@yourcompany.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Call / WhatsApp</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    +231 77X XXX XXX
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Monrovia, Liberia
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Services We Offer</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-300">
                    Web development, software development, mobile apps, SEO,
                    database management, CCTV, solar installation, content
                    creation, social media management, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE FORM */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold">Send a Project Request</h2>
            <p className="mt-2 text-sm text-slate-300">
              Fill out the form below and we’ll get back to you as soon as
              possible.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* row 1 */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* row 2 */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="location"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City / Country"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Contact Details / Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone number or WhatsApp"
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* row 3 */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="company"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Company / Business Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="service"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Service Needed
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="">Select a service</option>
                    {services.map((service, index) => (
                      <option key={index} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-13 text-slate-400"
                  />
                </div>
              </div>

              {/* row 4 */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="relative">
                  <label
                    htmlFor="budget"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Estimated Budget
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="">Select budget range</option>
                    {budgetOptions.map((budget, index) => (
                      <option key={index} value={budget}>
                        {budget}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-13 text-slate-400"
                  />
                </div>

                <div className="relative">
                  <label
                    htmlFor="contactMethod"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Preferred Contact Method
                  </label>
                  <select
                    id="contactMethod"
                    name="contactMethod"
                    value={formData.contactMethod}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="">Choose contact method</option>
                    {contactMethods.map((method, index) => (
                      <option key={index} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-13 text-slate-400"
                  />
                </div>
              </div>

              {/* message */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Project Description / Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="7"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your project, goals, timeline, and any important details..."
                  required
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              {/* submit */}
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 font-semibold text-white hover:bg-orange-400 transition-all"
              >
                <Send size={18} />
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
