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
      { path: "/academy/applications", element: withAcademySuspense(<AcademyApplicationsRedirect />) },
      { path: "/academy/login", element: withAcademySuspense(<AcademyLogin />) },
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
      { path: "assistant", element: withAcademySuspense(<AdminAssistantOverview />) },
      { path: "assistant/conversations", element: withAcademySuspense(<AdminAssistantConversations />) },
      { path: "assistant/insights", element: withAcademySuspense(<AdminAssistantInsights />) },
      { path: "assistant/unanswered", element: withAcademySuspense(<AdminUnanswered />) },
      { path: "assistant/documents", element: withAcademySuspense(<AdminAdmissionDocuments />) },
      { path: "assistant/settings", element: withAcademySuspense(<AdminAssistantSettings />) },
    ],
  },
]);

export default router;
