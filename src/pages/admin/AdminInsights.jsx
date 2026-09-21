import { useEffect, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import {
  ChartCard,
  InsightsMultiChart,
  HorizontalBarChart,
} from "../../components/admin/Charts";
import { fetchInsights } from "../../utils/adminApi";

export default function AdminInsights() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchInsights(days)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load insights.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading) return <p className="text-slate-500">Loading insights…</p>;
  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  const t = data?.totals || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">
            Site insights
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Clicks, returns, locations, course views, and enrollment intent.
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
        <StatCard label="Total events" value={t.total_events} />
        <StatCard label="Unique visitors" value={t.unique_visitors} />
        <StatCard label="Returning visitors" value={t.returning_visitors} />
        <StatCard
          label="Engagement"
          value={t.enroll_clicks}
          hint={`${t.course_views || 0} course views · ${t.page_views || 0} page views`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Daily activity" subtitle="Page views, course views, enroll clicks">
          <InsightsMultiChart data={data?.byDay || []} />
        </ChartCard>
        <ChartCard title="Events by type" subtitle="What visitors do on Academy pages">
          <HorizontalBarChart
            data={(data?.byEvent || []).map((row) => ({
              label: row.event_name,
              count: row.count,
            }))}
          />
        </ChartCard>
        <ChartCard title="Visitor locations" subtitle="Country from edge geo headers when available">
          <HorizontalBarChart
            data={(data?.byCountry || []).map((row) => ({
              label: row.country,
              count: row.count,
            }))}
          />
        </ChartCard>
        <ChartCard title="Top courses by views" subtitle="Course detail views vs enroll clicks">
          <HorizontalBarChart
            data={(data?.byCourse || []).map((row) => ({
              label: row.course,
              count: row.views,
            }))}
          />
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-[#00274c]">Recent activity feed</h2>
        </div>
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Path / course</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Visitor</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent || []).map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 font-semibold text-[#00274c]">{row.event_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p>{row.path || "—"}</p>
                    {row.course_code ? (
                      <p className="text-[#c10020] font-semibold mt-0.5">{row.course_code}</p>
                    ) : null}
                    {row.source ? <p className="text-slate-400">src: {row.source}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {[row.city, row.region, row.country].filter(Boolean).join(", ") || "Unknown"}
                    {row.timezone ? <p className="text-slate-400">{row.timezone}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">
                    {String(row.visitor_id || "—").slice(0, 16)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
