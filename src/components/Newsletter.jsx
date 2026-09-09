import { useState } from "react";
import { Loader2 } from "lucide-react";
import Reveal from "../Animations/Reveal";
import { sendToCompany } from "../utils/sendEmail";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await sendToCompany({
        subject: "Newsletter Subscription",
        fields: {
          form_type: "Newsletter",
          subscriber_email: email,
          message: `New newsletter subscriber: ${email}`,
        },
      });

      setStatus({
        type: "success",
        message: "Thanks! You've been subscribed to our newsletter.",
      });
      setEmail("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Subscription failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-[#00274c] text-white section-padding">
      <div className="section-container">
        <Reveal>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto"
          >
            <h3 className="text-center sm:text-left text-sm sm:text-base font-semibold tracking-wider whitespace-nowrap text-white">
              Subscribe to our <span className="text-[#ff6b81]">Newsletter</span>
            </h3>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status.message) setStatus({ type: "", message: "" });
              }}
              className="w-full sm:flex-1 border border-white/20 bg-white/10 rounded-xl h-11 px-4 text-white placeholder:text-white/50 outline-none focus:border-[#c10020] transition-colors duration-300 disabled:opacity-60"
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto shrink-0 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </button>
          </form>

          {status.message && (
            <p
              className={`mt-4 text-center text-sm ${
                status.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {status.message}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default Newsletter;
