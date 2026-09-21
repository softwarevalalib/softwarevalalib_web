import { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/admin/StatCard";
import { ChartCard, HorizontalBarChart, RatingsLineChart } from "../../components/admin/Charts";
import { fetchDashboard } from "../../utils/adminApi";
import academyCourses from "../../data/academyCourses";

function courseTitle(idOrCode) {
  const hit = academyCourses.find(
    (c) => c.id === idOrCode || c.code === idOrCode || String(c.id) === String(idOrCode)
  );
  return hit ? hit.shortTitle || hit.title : idOrCode;
}

export default function AdminRatings() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboard(days)
      .then((dash) => {
        if (!cancelled) setData(dash);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load ratings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const topChart = useMemo(() => {
    return (data?.ratings?.topRated || []).map((row) => ({
      label: courseTitle(row.course_id).slice(0, 22),
      average: Number(row.average_rating || 0),
      count: row.rating_count,
    }));
  }, [data]);

  if (loading) return <p className="text-slate-500">Loading ratings…</p>;
  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  const stats = data?.ratings?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">Ratings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live course ratings from learners — never fabricated.
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total ratings" value={stats.total_ratings} />
        <StatCard label="Average rating" value={Number(stats.average_rating || 0).toFixed(2)} />
        <StatCard label="Courses rated" value={stats.rated_courses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ratings over time" subtitle="Volume and average score">
          <RatingsLineChart data={data?.ratings?.byDay || []} />
        </ChartCard>
        <ChartCard title="Top rated courses" subtitle="By average score">
          <HorizontalBarChart
            data={topChart.map((r) => ({ label: r.label, count: r.average }))}
            dataKey="count"
            nameKey="label"
          />
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-[#00274c]">Recent ratings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Reviewer key</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.ratings?.recent || []).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#00274c]">
                    {courseTitle(row.course_id)}
                  </td>
                  <td className="px-4 py-3">{row.rating} / 5</td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {String(row.reviewer_key || "").slice(0, 18)}…
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
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
