import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { captureAttribution } from "../utils/attribution";
import AdminPortal from "./AdminPortal";
import Apply from "./Apply";
import Landing from "./Landing";
import ThankYou from "./ThankYou";

export default function RecruitmentApp() {
  const location = useLocation();

  useEffect(() => {
    captureAttribution();
  }, [location.search]);

  useEffect(() => {
    const privateRoute = ["/admin", "/apply", "/thank-you"].some((path) => location.pathname.startsWith(path));
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", privateRoute ? "noindex, nofollow" : "index, follow");
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/recruitment.html" element={<Landing />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="/admin" element={<AdminPortal />} />
    </Routes>
  );
}
