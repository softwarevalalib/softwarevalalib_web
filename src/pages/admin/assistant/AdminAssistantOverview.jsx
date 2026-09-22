import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../../components/admin/StatCard";
import { getAdminToken } from "../../../utils/adminApi";

async function fetchAssistantStats(days = 30) {
  const res = await fetch(`/api/academy/assistant?days=${days}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Unable to load assistant stats");
  return data;
}

export default function AdminAssistantOverview() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAssistantStats(days)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading) return <p className="text-slate-500">Loading AI Assistant overview…</p>;
  if (error) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  const s = data?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">AI Assistant</h1>
          <p className="mt-1 text-sm text-slate-500">
            Conversations, recommendations, chat-assisted enrollments, and admission letters.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversations" value={s.conversations} hint={`${s.conversations_today || 0} today`} />
        <StatCard label="Unique visitors" value={s.unique_visitors} />
        <StatCard label="Recommendations" value={s.recommendation_sessions} />
        <StatCard label="Chat enrollments" value={s.completed_applications} hint={`${s.enrollment_starts || 0} starts`} />
        <StatCard label="Admission letters" value={s.admission_letters} hint={`${s.admission_total || 0} total`} />
        <StatCard label="Unanswered questions" value={s.unanswered} />
        <StatCard label="Human handoffs" value={s.handoffs} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/academy/admin/assistant/conversations", label: "Conversations" },
          { to: "/academy/admin/assistant/insights", label: "AI Insights / Ask" },
          { to: "/academy/admin/assistant/unanswered", label: "Unanswered Questions" },
          { to: "/academy/admin/assistant/documents", label: "Admission Documents" },
          { to: "/academy/admin/assistant/settings", label: "Assistant Settings" },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm font-semibold text-[#00274c] hover:border-[#c10020]/30"
          >
            {item.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
