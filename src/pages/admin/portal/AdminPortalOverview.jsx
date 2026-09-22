import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Wallet,
  Award,
  FileText,
  Video,
} from "lucide-react";
import StatCard from "../../../components/admin/StatCard";
import { portalAdmin } from "../../../utils/portalApi";

const LINKS = [
  { to: "/academy/admin/portal/students", label: "Students", icon: Users, hint: "Approve enrollments & credentials" },
  { to: "/academy/admin/portal/instructors", label: "Instructors", icon: GraduationCap, hint: "Create instructor accounts" },
  { to: "/academy/admin/portal/courses", label: "Courses", icon: BookOpen, hint: "Live catalogue & assign instructors" },
  { to: "/academy/admin/portal/grades", label: "Grades", icon: ClipboardList, hint: "Approve instructor submissions" },
  { to: "/academy/admin/portal/attendance", label: "Attendance", icon: CalendarCheck, hint: "Session attendance" },
  { to: "/academy/admin/portal/assignments", label: "Assignments", icon: FileText, hint: "All assignments & submissions" },
  { to: "/academy/admin/portal/classroom", label: "ClassRoom", icon: Video, hint: "Meet/Zoom session history" },
  { to: "/academy/admin/portal/fees", label: "Fees Payments", icon: Wallet, hint: "40/30/30 installments" },
  { to: "/academy/admin/portal/certificates", label: "Certificates", icon: Award, hint: "Upload & issue certificates" },
];

export default function AdminPortalOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    portalAdmin("overview", {}, "GET").then((d) => setStats(d.stats)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#00274c]">Academy Portal</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve enrollments, manage live courses, review grades, and oversee classroom sessions,
          assignments, attendance, fees, and certificates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Portal students" value={stats?.students} />
        <StatCard label="Instructors" value={stats?.instructors} />
        <StatCard label="Portal courses" value={stats?.courses} />
        <StatCard label="Paid fees" value={stats?.payments} />
        <StatCard label="Certificates" value={stats?.certificates} />
        <StatCard label="Pending enrollments" value={stats?.pendingEnrollments} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-[#c10020]/40 transition-colors"
          >
            <item.icon className="text-[#c10020]" size={22} />
            <h2 className="mt-3 font-display font-bold text-[#00274c]">{item.label}</h2>
            <p className="mt-1 text-sm text-slate-500">{item.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
