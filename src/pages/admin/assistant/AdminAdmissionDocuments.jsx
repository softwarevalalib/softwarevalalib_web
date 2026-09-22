import { useEffect, useState } from "react";
import { getAdminToken } from "../../../utils/adminApi";

export default function AdminAdmissionDocuments() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [ref, setRef] = useState("");

  const load = () =>
    fetch("/api/academy/admission", {
      headers: { Accept: "application/json", Authorization: `Bearer ${getAdminToken()}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setRows(data.documents || []);
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const resend = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/academy/admission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({ action: "resend", id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const generate = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/academy/admission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify({ action: "generate", referenceNumber: ref.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Generate failed");
      return;
    }
    setRef("");
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Admission documents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Preview, download, resend, or generate letters after admin approval.
        </p>
      </div>

      <form onSubmit={generate} className="flex flex-wrap gap-2">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Enrollment reference e.g. SVL-ACA-2026-000001"
          className="flex-1 min-w-[240px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
        />
        <button type="submit" className="btn-primary">
          Generate letter
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#00274c]">{row.student_full_name}</p>
                  <p className="text-xs text-slate-500">{row.student_email}</p>
                </td>
                <td className="px-4 py-3 text-xs font-mono">{row.reference_number}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3 text-xs">{row.email_delivery_status || "—"}</td>
                <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                  <a
                    className="text-[#c10020] font-semibold hover:underline"
                    href={`/api/academy/admission?token=${row.access_token}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview
                  </a>
                  <button
                    type="button"
                    className="text-[#00274c] font-semibold hover:underline"
                    disabled={busyId === row.id}
                    onClick={() => resend(row.id)}
                  >
                    Resend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-6 text-sm text-slate-500">No admission letters yet.</p> : null}
      </div>
    </div>
  );
}
