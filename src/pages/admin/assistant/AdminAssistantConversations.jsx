import { useEffect, useState } from "react";
import { getAdminToken } from "../../../utils/adminApi";

export default function AdminAssistantConversations() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/academy/assistant-admin?action=conversations", {
      headers: { Accept: "application/json", Authorization: `Bearer ${getAdminToken()}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setRows(data.conversations || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  const openThread = async (session) => {
    setSelected(session);
    const res = await fetch(
      `/api/academy/assistant-admin?action=messages&sessionId=${session.id}`,
      { headers: { Accept: "application/json", Authorization: `Bearer ${getAdminToken()}` } }
    );
    const data = await res.json();
    setMessages(data.messages || []);
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-[#00274c]">Conversations</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">Visitor</th>
                <th className="px-3 py-2">Enrollment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                  onClick={() => openThread(row)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.started_at ? new Date(row.started_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {String(row.visitor_id || "anon").slice(0, 14)}
                  </td>
                  <td className="px-3 py-2 text-xs">{row.enrollment_ref || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm min-h-[320px]">
          {selected ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Session {selected.session_key}</p>
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <p className="text-[10px] font-bold uppercase text-slate-400">{m.role}</p>
                  <p className="whitespace-pre-wrap text-[#00274c]">{m.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a conversation.</p>
          )}
        </div>
      </div>
    </div>
  );
}
