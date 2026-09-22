import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Former student portal — applications are managed by admins only. */
export default function AcademyApplicationsRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Admin Login | SVL Training Academy";
    navigate("/academy/login", { replace: true, state: { from: "/academy/admin/enrollments" } });
  }, [navigate]);
  return (
    <div className="section-container section-padding text-center text-slate-600" role="status">
      Redirecting to admin login…
    </div>
  );
}
