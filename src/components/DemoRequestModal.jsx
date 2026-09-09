import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Send, X } from "lucide-react";
import { sendToCompany } from "../utils/sendEmail";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  organization: "",
  message: "",
};

export default function DemoRequestModal({ project, open, onClose }) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    setStatus({ type: "", message: "" });
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !project) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status.message) setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await sendToCompany({
        subject: `Demo Request — ${project.title}`,
        fields: {
          form_type: "Demo Request",
          system: project.title,
          category: project.category,
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          organization: form.organization || "Not provided",
          message: form.message || "Please schedule a product demo.",
        },
      });
      setStatus({
        type: "success",
        message: "Demo request sent! Our team will contact you shortly.",
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Unable to send request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#00274c]/15 bg-white px-4 py-3 text-[#00274c] outline-none transition focus:border-[#c10020] focus:ring-1 focus:ring-[#c10020]/30 placeholder:text-slate-400 disabled:opacity-60";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#00274c]/60 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#00274c]/10 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#c10020]">
              Request a Demo
            </p>
            <h2 id="demo-modal-title" className="mt-1 text-lg sm:text-xl font-bold text-[#00274c]">
              {project.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#00274c] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6 sm:pb-6 space-y-4">
          {status.message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                status.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-[#00274c]">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#00274c]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={inputClass}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[#00274c]">
                Phone / WhatsApp
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={inputClass}
                placeholder="+231..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="organization" className="mb-1.5 block text-sm font-medium text-[#00274c]">
              Organization
            </label>
            <input
              id="organization"
              name="organization"
              value={form.organization}
              onChange={handleChange}
              disabled={isSubmitting}
              className={inputClass}
              placeholder="Company or institution (optional)"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-[#00274c]">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`${inputClass} resize-none`}
              placeholder="Tell us about your needs or preferred demo time..."
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isSubmitting ? "Sending..." : "Submit Demo Request"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
