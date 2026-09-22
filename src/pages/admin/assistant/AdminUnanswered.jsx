import { useEffect, useState } from "react";
import { getAdminToken } from "../../../utils/adminApi";

export default function AdminUnanswered() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/academy/assistant-admin?action=unanswered", {
      headers: { Accept: "application/json", Authorization: `Bearer ${getAdminToken()}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setRows(data.questions || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#00274c]">Unanswered questions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Knowledge gaps logged from the assistant — review and publish FAQ answers in Knowledge Base.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Count</th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Last asked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-bold text-[#c10020]">{row.occurrence_count}</td>
                <td className="px-4 py-3 text-[#00274c]">{row.sample_question}</td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {row.last_asked_at ? new Date(row.last_asked_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-6 text-sm text-slate-500">No unanswered questions yet.</p> : null}
      </div>
    </div>
  );
}
