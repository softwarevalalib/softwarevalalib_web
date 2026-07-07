import { useState } from "react";
import Reveal from "../Animations/Reveal";

function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    alert("Thanks! You will receive updates from us.");
    setEmail("");
  };

  return (
    <section className="bg-slate-950 text-white section-padding">
      <div className="section-container">
        <Reveal>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto"
          >
            <h3 className="text-center sm:text-left uppercase text-sm sm:text-base font-semibold tracking-wider whitespace-nowrap">
              Subscribe to our Newsletter
            </h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sm:flex-1 border border-slate-700 bg-slate-900 rounded-xl h-11 px-4 text-white placeholder:text-slate-500 outline-none focus:border-orange-500 transition-colors duration-300"
              placeholder="Enter your email"
              required
            />
            <button type="submit" className="btn-primary w-full sm:w-auto shrink-0">
              Subscribe
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

export default Newsletter;
