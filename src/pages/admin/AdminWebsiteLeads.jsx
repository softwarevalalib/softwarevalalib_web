import { useEffect, useState } from "react";
import { getAdminToken } from "../../utils/adminApi";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "MEETING_SCHEDULED", "PROPOSAL_PREPARATION", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST", "FOLLOW_UP"];

export default function AdminWebsiteLeads() {
  const [leads, setLeads] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/leads", { headers: { Authorization: `Bearer ${getAdminToken()}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Unable to load leads.");
    setLeads(data.leads || []);
    setEvents(data.events || []);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leads", { headers: { Authorization: `Bearer ${getAdminToken()}` } })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Unable to load leads.");
        if (cancelled) return;
        setLeads(data.leads || []);
        setEvents(data.events || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (lead, patch) => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAdminToken()}` },
      body: JSON.stringify({ action: "update", id: lead.id, ...patch, website: "" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Update failed.");
      return;
    }
    load().catch((err) => setError(err.message));
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[#00274c]">Website leads</h1>
      <p className="mt-1 text-sm text-slate-500">Consultations and quote requests from the public site. Counts below come from the database.</p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <p className="mt-4 text-sm font-semibold text-[#00274c]">{leads.length} records · {events.length} tracked actions in view</p>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Organization</th>
              <th className="px-3 py-2">Need</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Agent</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Assigned</th>
              <th className="px-3 py-2">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2 font-mono text-xs">{lead.lead_number}</td>
                <td className="px-3 py-2">
                  <p className="font-semibold">{lead.company_name}</p>
                  <p className="text-xs text-slate-500">{lead.contact_name} · {lead.email}</p>
                  <p className="text-xs text-slate-500">{lead.industry || "Industry not given"} · {lead.location || "Location not given"}</p>
                </td>
                <td className="px-3 py-2 max-w-xs">{lead.services}</td>
                <td className="px-3 py-2 text-xs">{lead.source || "Website"}<br />{lead.utm_campaign || ""}</td>
                <td className="px-3 py-2 font-mono text-xs">{lead.referral_agent_id || "—"}</td>
                <td className="px-3 py-2">
                  <select className="rounded border px-2 py-1" value={lead.status} onChange={(e) => save(lead, { status: e.target.value, assignedTo: lead.assigned_to || "", followUpAt: lead.follow_up_at ? String(lead.follow_up_at).slice(0, 10) : "" })}>
                    {STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input className="w-28 rounded border px-2 py-1" defaultValue={lead.assigned_to || ""} onBlur={(e) => save(lead, { assignedTo: e.target.value, status: lead.status })} />
                </td>
                <td className="px-3 py-2">
                  <input type="date" className="rounded border px-2 py-1" defaultValue={lead.follow_up_at ? String(lead.follow_up_at).slice(0, 10) : ""} onBlur={(e) => save(lead, { followUpAt: e.target.value, status: lead.status })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
