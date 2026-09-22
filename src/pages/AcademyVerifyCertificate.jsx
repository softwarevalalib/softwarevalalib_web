import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../Animations/Reveal";
import Footer from "../components/Footer";
import { verifyCertificate } from "../utils/portalApi";

export default function AcademyVerifyCertificate() {
  const [certificateId, setCertificateId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const data = await verifyCertificate(certificateId, email);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="bg-[#00274c] text-white">
        <div className="section-container section-padding py-12">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              SVL Training Academy
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold">Verify Certificate</h1>
            <p className="mt-3 max-w-xl text-white/80 text-sm sm:text-base">
              Enter the certificate ID and the email used on the certificate to confirm authenticity.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container max-w-lg">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4"
          >
            <label className="block text-sm font-semibold text-[#00274c]">
              Certificate ID
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="SVL-CERT-2026-XXXXXX"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-[#00274c]">
              Email on certificate
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#c10020]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            {result?.valid ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 space-y-1">
                <p className="font-bold">Certificate verified</p>
                <p>
                  <strong>Student:</strong> {result.certificate.studentName}
                </p>
                <p>
                  <strong>Course:</strong> {result.certificate.courseTitle}
                </p>
                <p>
                  <strong>Issued:</strong>{" "}
                  {result.certificate.issueDate
                    ? new Date(result.certificate.issueDate).toLocaleDateString()
                    : "—"}
                </p>
                <p>
                  <strong>ID:</strong> {result.certificate.certificateId}
                </p>
              </div>
            ) : null}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Verifying…" : "Verify Certificate"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link to="/academy" className="font-semibold text-[#00274c] hover:underline">
              Back to Academy
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
