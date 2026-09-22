import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Star,
  LineChart,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Bot,
  School,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Wallet,
  Award,
  UserCog,
} from "lucide-react";
import {
  clearAdminSession,
  fetchAdminMe,
  getAdminToken,
  getStoredAdmin,
  adminLogout,
} from "../../utils/adminApi";

const NAV = [
  { to: "/academy/admin", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/academy/admin/enrollments", label: "Applications", icon: Users },
  { to: "/academy/admin/portal", end: true, label: "Academy Portal", icon: School },
  { to: "/academy/admin/portal/students", label: "Portal Students", icon: GraduationCap },
  { to: "/academy/admin/portal/instructors", label: "Instructors", icon: UserCog },
  { to: "/academy/admin/portal/courses", label: "Courses", icon: BookOpen },
  { to: "/academy/admin/portal/grades", label: "Grades", icon: ClipboardList },
  { to: "/academy/admin/portal/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/academy/admin/portal/fees", label: "Fees Payments", icon: Wallet },
  { to: "/academy/admin/portal/certificates", label: "Certificates", icon: Award },
  { to: "/academy/admin/ratings", label: "Ratings", icon: Star },
  { to: "/academy/admin/insights", label: "Insights", icon: LineChart },
  { to: "/academy/admin/assistant", end: true, label: "AI Assistant", icon: Bot },
  { to: "/academy/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(getStoredAdmin());
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "Academy Admin | SVL Training Academy";
    const token = getAdminToken();
    if (!token) {
      navigate("/academy/login", { replace: true });
      return;
    }

    let cancelled = false;
    fetchAdminMe()
      .then((data) => {
        if (cancelled) return;
        setAdmin(data.admin);
      })
      .catch(() => {
        clearAdminSession();
        if (!cancelled) navigate("/academy/login", { replace: true });
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await adminLogout();
    navigate("/academy/login", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">
        Checking admin session…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#00274c] text-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center h-10 w-10 rounded-full bg-[#c10020] shrink-0">
              <GraduationCap size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/60">SVL Academy</p>
              <p className="font-display font-bold truncate">Admin Dashboard</p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#c10020] text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={18} aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div>
            <p className="text-xs text-white/50">Signed in as</p>
            <p className="text-sm font-semibold truncate">{admin?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold hover:bg-white/15"
          >
            <LogOut size={16} aria-hidden />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg border border-slate-200 text-[#00274c]"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              SVL Training Academy
            </p>
            <p className="font-display font-bold text-[#00274c] truncate">
              Welcome{admin?.name ? `, ${admin.name}` : ""}
            </p>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
