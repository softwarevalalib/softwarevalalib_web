import { Link, useSearchParams } from "react-router-dom";

export default function ThankYou() {
  const [params] = useSearchParams();
  const reference = params.get("ref") || "";
  const name = params.get("name") || "applicant";
  return (
    <main className="section-container section-padding max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">Application received</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-[#00274c]">Thank you, {name}.</h1>
      <p className="mt-4">Your application to the Software Vala Liberia Freelance Business Development & Marketing Agent Program has been received.</p>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide">Application reference</p>
      <p className="font-display text-2xl font-bold text-[#00274c]">{reference}</p>
      <p className="mt-4">Submission does not automatically mean selection. Shortlisted applicants will be contacted through the contact information provided. No applicant should pay anyone an application, recruitment, onboarding, or training fee. Save your application reference.</p>
      <a className="btn-primary mt-8" href="https://softwarevalalib.app">Return to Software Vala Liberia</a>
      <p className="mt-4"><Link to="/" className="underline">Back to the recruitment page</Link></p>
    </main>
  );
}
