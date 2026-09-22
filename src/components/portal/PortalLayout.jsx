import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Wallet,
  Award,
  LogOut,
  Menu,
  X,
  GraduationCap,
  FileText,
  Video,
} from "lucide-react";
import {
  clearPortalSession,
  fetchPortalMe,
  getPortalToken,
  getStoredPortalUser,
  portalLogout,
} from "../../utils/portalApi";

const STUDENT_NAV = [
  { to: "/academy/portal/student", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/academy/portal/student/grades", label: "Grades", icon: ClipboardList },
  { to: "/academy/portal/student/assignments", label: "Assignments", icon: FileText },
  { to: "/academy/portal/student/classroom", label: "ClassRoom", icon: Video },
  { to: "/academy/portal/student/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/academy/portal/student/fees", label: "Fees", icon: Wallet },
  { to: "/academy/portal/student/certificates", label: "Certificates", icon: Award },
];

const INSTRUCTOR_NAV = [
  { to: "/academy/portal/instructor", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/academy/portal/instructor/courses", label: "My Courses", icon: BookOpen },
  { to: "/academy/portal/instructor/students", label: "Students", icon: GraduationCap },
  { to: "/academy/portal/instructor/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/academy/portal/instructor/grades", label: "Grades", icon: ClipboardList },
  { to: "/academy/portal/instructor/assignments", label: "Assignments", icon: FileText },
  { to: "/academy/portal/instructor/classroom", label: "ClassRoom", icon: Video },
];

export default function PortalLayout({ role }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredPortalUser());
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const nav = role === "instructor" ? INSTRUCTOR_NAV : STUDENT_NAV;
  const home = role === "instructor" ? "/academy/portal/instructor" : "/academy/portal/student";

  useEffect(() => {
    document.title = `${role === "instructor" ? "Instructor" : "Student"} Portal | SVL Academy`;
    const token = getPortalToken();
    if (!token) {
      navigate("/academy/portal/login", { replace: true });
      return;
    }
    let cancelled = false;
    fetchPortalMe()
      .then((data) => {
        if (cancelled) return;
        if (data.user.role !== role) {
          clearPortalSession();
          navigate("/academy/portal/login", { replace: true });
          return;
        }
        setUser(data.user);
      })
      .catch(() => {
        clearPortalSession();
        if (!cancelled) navigate("/academy/portal/login", { replace: true });
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, role]);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">
        Loading portal…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#00274c] text-white flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/60">SVL Academy Portal</p>
            <p className="font-display font-bold capitalize">{role} Dashboard</p>
          </div>
          <button type="button" className="lg:hidden p-2" onClick={() => setOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  isActive ? "bg-[#c10020] text-white" : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <p className="text-sm font-semibold truncate">{user?.fullName}</p>
          <p className="text-xs text-white/60 truncate">{user?.username}</p>
          <Link to="/academy" className="block text-xs text-white/70 hover:text-white underline">
            Back to Academy
          </Link>
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold"
            onClick={async () => {
              await portalLogout();
              navigate("/academy/portal/login");
            }}
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg border border-slate-200"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Welcome</p>
            <p className="font-display font-bold text-[#00274c]">{user?.fullName}</p>
          </div>
          <Link to={home} className="ml-auto text-xs font-semibold text-[#c10020] hover:underline">
            Home
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
