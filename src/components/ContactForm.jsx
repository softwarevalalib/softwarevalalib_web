import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, Briefcase, Send, ChevronDown } from "lucide-react";
import Reveal from "../Animations/Reveal";

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
    const saved = window.localStorage.getItem("contact-form-data");
    if (saved) setFormData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("contact-form-data", JSON.stringify(formData));
  }, [formData]);

  const services = [
    "SEO", "Web Development", "Software Development", "Mobile App Development",
    "Electricity", "CCTV Camera Installation", "Solar Installation",
    "Database Management", "Content Creating", "Social Media Management",
  ];

  const budgetOptions = [
    "Not sure yet", "$100 - $500", "$500 - $1,000", "$1,000 - $3,000",
    "$3,000 - $5,000", "$5,000+",
  ];

  const contactMethods = ["Email", "Phone Call", "WhatsApp", "Any"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Your request has been submitted successfully!");
    setFormData(initialFormData);
    window.localStorage.removeItem("contact-form-data");
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition-all duration-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 placeholder:text-slate-500";

  return (
    <section className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="section-container section-padding relative z-10">
        <Reveal>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm font-medium text-orange-500">
              Contact Us
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Let&apos;s Build Something Great Together
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Tell us about your project, business needs, or service request.
              Whether you need a website, mobile app, SEO, solar installation,
              CCTV setup, or business support services, our team is ready to help.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <Reveal direction="left">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8 h-full">
              <h2 className="text-xl sm:text-2xl font-semibold">Let&apos;s Talk About Your Project</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                We work with startups, businesses, schools, and organizations to
                deliver smart digital and technical solutions tailored to their needs.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Mail, title: "Email Us", value: "softwarevalaliberiainc@gmail.com", href: "mailto:softwarevalaliberiainc@gmail.com" },
                  { icon: Phone, title: "Call / WhatsApp", value: "+231 889 552 016", href: "tel:+231889552016" },
                  { icon: MapPin, title: "Location", value: "ELWA Junction, Monrovia, Liberia" },
                  { icon: Briefcase, title: "Services We Offer", value: "Web development, software development, mobile apps, SEO, database management, CCTV, solar installation, and more." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors duration-300 hover:border-orange-500/30">
                    <div className="rounded-lg bg-orange-500/10 p-2.5 text-orange-400 shrink-0">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      {item.href ? (
                        <a href={item.href} className="mt-1 text-sm text-slate-300 hover:text-orange-400 transition-colors break-all">
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-slate-300">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.15}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold">Send a Project Request</h2>
              <p className="mt-2 text-sm text-slate-300">
                Fill out the form below and we&apos;ll get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-200">Full Name</label>
                    <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required className={inputClass} />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-slate-200">Location</label>
                    <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="City / Country" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-200">Phone / WhatsApp</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone number" required className={inputClass} />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-slate-200">Company Name</label>
                    <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Optional" className={inputClass} />
                  </div>
                  <div className="relative">
                    <label htmlFor="service" className="mb-1.5 block text-sm font-medium text-slate-200">Service Needed</label>
                    <select id="service" name="service" value={formData.service} onChange={handleChange} required className={`${inputClass} appearance-none`}>
                      <option value="">Select a service</option>
                      {services.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-11 text-slate-400" />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="relative">
                    <label htmlFor="budget" className="mb-1.5 block text-sm font-medium text-slate-200">Estimated Budget</label>
                    <select id="budget" name="budget" value={formData.budget} onChange={handleChange} className={`${inputClass} appearance-none`}>
                      <option value="">Select budget range</option>
                      {budgetOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-11 text-slate-400" />
                  </div>
                  <div className="relative">
                    <label htmlFor="contactMethod" className="mb-1.5 block text-sm font-medium text-slate-200">Preferred Contact</label>
                    <select id="contactMethod" name="contactMethod" value={formData.contactMethod} onChange={handleChange} className={`${inputClass} appearance-none`}>
                      <option value="">Choose method</option>
                      {contactMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-11 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-200">Project Description</label>
                  <textarea id="message" name="message" rows="5" value={formData.message} onChange={handleChange} placeholder="Tell us about your project..." required className={`${inputClass} resize-none`} />
                </div>

                <button type="submit" className="btn-primary w-full">
                  <Send size={18} />
                  Submit Request
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default Contact;
