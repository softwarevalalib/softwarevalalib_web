import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import router from "./routes/Mainroutes.jsx";
import { installChunkErrorRecovery } from "./utils/lazyWithRetry";

installChunkErrorRecovery();

// Drop one-time cache-bust param after a chunk-reload recovery
try {
  const url = new URL(window.location.href);
  if (url.searchParams.has("_svl_refresh")) {
    url.searchParams.delete("_svl_refresh");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }
} catch {
  // ignore
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
