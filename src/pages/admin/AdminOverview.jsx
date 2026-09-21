import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/admin/StatCard";
import {
  ChartCard,
  EnrollmentAreaChart,
  StatusPieChart,
  RatingsLineChart,
  InsightsMultiChart,
} from "../../components/admin/Charts";
import { fetchDashboard, fetchInsights } from "../../utils/adminApi";

export default function AdminOverview() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [insightSeries, setInsightSeries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([fetchDashboard(days), fetchInsights(days)])
      .then(([dash, insights]) => {
        if (cancelled) return;
        setData(dash);
        setInsightSeries(insights.byDay || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading) {
    return <p className="text-slate-500">Loading dashboard…</p>;
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  const e = data?.enrollments?.stats || {};
  const r = data?.ratings?.stats || {};
  const i = data?.insights || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enrollments, ratings, and site activity at a glance.
          </p>
        </div>
        <label className="text-sm font-semibold text-[#00274c]">
          Range
          <select
            value={days}
            onChange={(ev) => setDays(Number(ev.target.value))}
            className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total enrollments" value={e.total} hint={`${e.recent || 0} in selected range`} />
        <StatCard label="Pending applications" value={e.pending} />
        <StatCard
          label="Average rating"
          value={Number(r.average_rating || 0).toFixed(2)}
          hint={`${r.total_ratings || 0} ratings · ${r.rated_courses || 0} courses`}
        />
        <StatCard
          label="Unique visitors"
          value={i.unique_visitors}
          hint={`${i.page_views || 0} page views · ${i.enroll_clicks || 0} enroll clicks`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Enrollments over time" subtitle="Applications submitted per day">
          <EnrollmentAreaChart data={data?.enrollments?.byDay || []} />
        </ChartCard>
        <ChartCard title="Enrollment status" subtitle="Current pipeline mix">
          <StatusPieChart data={data?.enrollments?.byStatus || []} />
        </ChartCard>
        <ChartCard title="Ratings trend" subtitle="Daily rating volume and average score">
          <RatingsLineChart data={data?.ratings?.byDay || []} />
        </ChartCard>
        <ChartCard title="Site activity" subtitle="Views and enroll intent">
          <InsightsMultiChart data={insightSeries} />
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-[#00274c]">Recent enrollments</h2>
          <Link to="/academy/admin/enrollments" className="text-sm font-semibold text-[#c10020] hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {(data?.enrollments?.recent || []).slice(0, 8).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-[#00274c] whitespace-nowrap">
                    {row.reference_number}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#00274c]">{row.full_name}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {(Array.isArray(row.course_codes) ? row.course_codes : []).join(", ")}
                  </td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
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
