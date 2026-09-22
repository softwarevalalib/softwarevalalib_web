import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import Mainlayout from "../layout/Mainlayout";
import Home from "../pages/Home";
import About from "../pages/About";
import Services from "../pages/Services";
import Projects from "../pages/Projects";
import Contact from "../pages/Contact";
import Team from "../pages/Team";
import NotFound from "../pages/NotFound";

const Academy = lazy(() => import("../pages/Academy"));
const AcademyCourse = lazy(() => import("../pages/AcademyCourse"));
const AcademyEnroll = lazy(() => import("../pages/AcademyEnroll"));
const AcademyLogin = lazy(() => import("../pages/AcademyLogin"));
const AcademyApplicationsRedirect = lazy(() => import("../pages/AcademyApplicationsRedirect"));
const AcademyVerifyCertificate = lazy(() => import("../pages/AcademyVerifyCertificate"));
const AdminLayout = lazy(() => import("../components/admin/AdminLayout"));
const AdminOverview = lazy(() => import("../pages/admin/AdminOverview"));
const AdminEnrollments = lazy(() => import("../pages/admin/AdminEnrollments"));
const AdminRatings = lazy(() => import("../pages/admin/AdminRatings"));
const AdminInsights = lazy(() => import("../pages/admin/AdminInsights"));
const AdminSettings = lazy(() => import("../pages/admin/AdminSettings"));
const AdminAssistantOverview = lazy(() => import("../pages/admin/assistant/AdminAssistantOverview"));
const AdminAssistantConversations = lazy(() => import("../pages/admin/assistant/AdminAssistantConversations"));
const AdminAssistantInsights = lazy(() => import("../pages/admin/assistant/AdminAssistantInsights"));
const AdminUnanswered = lazy(() => import("../pages/admin/assistant/AdminUnanswered"));
const AdminAdmissionDocuments = lazy(() => import("../pages/admin/assistant/AdminAdmissionDocuments"));
const AdminAssistantSettings = lazy(() => import("../pages/admin/assistant/AdminAssistantSettings"));
const AdminPortalOverview = lazy(() => import("../pages/admin/portal/AdminPortalOverview"));
const AdminPortalStudents = lazy(() => import("../pages/admin/portal/AdminPortalStudents"));
const AdminPortalInstructors = lazy(() => import("../pages/admin/portal/AdminPortalInstructors"));
const AdminPortalCourses = lazy(() => import("../pages/admin/portal/AdminPortalCourses"));
const AdminPortalGrades = lazy(() =>
  import("../pages/admin/portal/AdminPortalRecords").then((m) => ({ default: m.default }))
);
const AdminPortalAttendance = lazy(() =>
  import("../pages/admin/portal/AdminPortalRecords").then((m) => ({ default: m.AdminPortalAttendance }))
);
const AdminPortalFees = lazy(() =>
  import("../pages/admin/portal/AdminPortalRecords").then((m) => ({ default: m.AdminPortalFees }))
);
const AdminPortalCertificates = lazy(() =>
  import("../pages/admin/portal/AdminPortalRecords").then((m) => ({ default: m.AdminPortalCertificates }))
);
const PortalLogin = lazy(() => import("../pages/portal/PortalLogin"));
const PortalLayout = lazy(() => import("../components/portal/PortalLayout"));
const StudentDashboard = lazy(() => import("../pages/portal/StudentPages"));
const StudentGrades = lazy(() =>
  import("../pages/portal/StudentPages").then((m) => ({ default: m.StudentGrades }))
);
const StudentAttendance = lazy(() =>
  import("../pages/portal/StudentPages").then((m) => ({ default: m.StudentAttendance }))
);
const StudentFees = lazy(() =>
  import("../pages/portal/StudentPages").then((m) => ({ default: m.StudentFees }))
);
const StudentCertificates = lazy(() =>
  import("../pages/portal/StudentPages").then((m) => ({ default: m.StudentCertificates }))
);
const StudentAssignments = lazy(() =>
  import("../pages/portal/StudentPages").then((m) => ({ default: m.StudentAssignments }))
);
const StudentClassroom = lazy(() =>
  import("../pages/portal/StudentPages").then((m) => ({ default: m.StudentClassroom }))
);
const InstructorDashboard = lazy(() => import("../pages/portal/InstructorPages"));
const InstructorCourses = lazy(() =>
  import("../pages/portal/InstructorPages").then((m) => ({ default: m.InstructorCourses }))
);
const InstructorStudents = lazy(() =>
  import("../pages/portal/InstructorPages").then((m) => ({ default: m.InstructorStudents }))
);
const InstructorAttendance = lazy(() =>
  import("../pages/portal/InstructorPages").then((m) => ({ default: m.InstructorAttendance }))
);
const InstructorGrades = lazy(() =>
  import("../pages/portal/InstructorPages").then((m) => ({ default: m.InstructorGrades }))
);
const InstructorAssignments = lazy(() =>
  import("../pages/portal/InstructorPages").then((m) => ({ default: m.InstructorAssignments }))
);
const InstructorClassroom = lazy(() =>
  import("../pages/portal/InstructorPages").then((m) => ({ default: m.InstructorClassroom }))
);
const AdminPortalClassroom = lazy(() =>
  import("../pages/admin/portal/AdminPortalLearning").then((m) => ({ default: m.AdminPortalClassroom }))
);
const AdminPortalAssignments = lazy(() =>
  import("../pages/admin/portal/AdminPortalLearning").then((m) => ({
    default: m.AdminPortalAssignments,
  }))
);

function AcademyFallback() {
  return (
    <div className="section-container section-padding text-center text-slate-600" role="status">
      Loading SVL Training Academy…
    </div>
  );
}

function withAcademySuspense(element) {
  return <Suspense fallback={<AcademyFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <Mainlayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/academy", element: withAcademySuspense(<Academy />) },
      { path: "/academy/courses/:slug", element: withAcademySuspense(<AcademyCourse />) },
      { path: "/academy/enroll", element: withAcademySuspense(<AcademyEnroll />) },
      { path: "/academy/verify", element: withAcademySuspense(<AcademyVerifyCertificate />) },
      { path: "/academy/applications", element: withAcademySuspense(<AcademyApplicationsRedirect />) },
      { path: "/academy/login", element: withAcademySuspense(<AcademyLogin />) },
      { path: "/academy/portal/login", element: withAcademySuspense(<PortalLogin />) },
      { path: "/services", element: <Services /> },
      { path: "/projects", element: <Projects /> },
      { path: "/contact", element: <Contact /> },
      { path: "/team", element: <Team /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/academy/admin",
    element: withAcademySuspense(<AdminLayout />),
    children: [
      { index: true, element: withAcademySuspense(<AdminOverview />) },
      { path: "enrollments", element: withAcademySuspense(<AdminEnrollments />) },
      { path: "ratings", element: withAcademySuspense(<AdminRatings />) },
      { path: "insights", element: withAcademySuspense(<AdminInsights />) },
      { path: "settings", element: withAcademySuspense(<AdminSettings />) },
      { path: "portal", element: withAcademySuspense(<AdminPortalOverview />) },
      { path: "portal/students", element: withAcademySuspense(<AdminPortalStudents />) },
      { path: "portal/instructors", element: withAcademySuspense(<AdminPortalInstructors />) },
      { path: "portal/courses", element: withAcademySuspense(<AdminPortalCourses />) },
      { path: "portal/grades", element: withAcademySuspense(<AdminPortalGrades />) },
      { path: "portal/attendance", element: withAcademySuspense(<AdminPortalAttendance />) },
      { path: "portal/assignments", element: withAcademySuspense(<AdminPortalAssignments />) },
      { path: "portal/classroom", element: withAcademySuspense(<AdminPortalClassroom />) },
      { path: "portal/fees", element: withAcademySuspense(<AdminPortalFees />) },
      { path: "portal/certificates", element: withAcademySuspense(<AdminPortalCertificates />) },
      { path: "assistant", element: withAcademySuspense(<AdminAssistantOverview />) },
      { path: "assistant/conversations", element: withAcademySuspense(<AdminAssistantConversations />) },
      { path: "assistant/insights", element: withAcademySuspense(<AdminAssistantInsights />) },
      { path: "assistant/unanswered", element: withAcademySuspense(<AdminUnanswered />) },
      { path: "assistant/documents", element: withAcademySuspense(<AdminAdmissionDocuments />) },
      { path: "assistant/settings", element: withAcademySuspense(<AdminAssistantSettings />) },
    ],
  },
  {
    path: "/academy/portal/student",
    element: withAcademySuspense(<PortalLayout role="student" />),
    children: [
      { index: true, element: withAcademySuspense(<StudentDashboard />) },
      { path: "grades", element: withAcademySuspense(<StudentGrades />) },
      { path: "assignments", element: withAcademySuspense(<StudentAssignments />) },
      { path: "classroom", element: withAcademySuspense(<StudentClassroom />) },
      { path: "attendance", element: withAcademySuspense(<StudentAttendance />) },
      { path: "fees", element: withAcademySuspense(<StudentFees />) },
      { path: "certificates", element: withAcademySuspense(<StudentCertificates />) },
    ],
  },
  {
    path: "/academy/portal/instructor",
    element: withAcademySuspense(<PortalLayout role="instructor" />),
    children: [
      { index: true, element: withAcademySuspense(<InstructorDashboard />) },
      { path: "courses", element: withAcademySuspense(<InstructorCourses />) },
      { path: "students", element: withAcademySuspense(<InstructorStudents />) },
      { path: "attendance", element: withAcademySuspense(<InstructorAttendance />) },
      { path: "grades", element: withAcademySuspense(<InstructorGrades />) },
      { path: "assignments", element: withAcademySuspense(<InstructorAssignments />) },
      { path: "classroom", element: withAcademySuspense(<InstructorClassroom />) },
    ],
  },
]);

export default router;
