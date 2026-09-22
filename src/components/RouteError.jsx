import { useEffect } from "react";
import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { isChunkLoadError, recoverFromChunkError } from "../utils/lazyWithRetry";

export default function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText || error.data
    : error?.message || String(error || "Something went wrong.");

  useEffect(() => {
    if (recoverFromChunkError(error)) return;
  }, [error]);

  const chunkFail = isChunkLoadError(error);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">
          SVL Training Academy
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-[#00274c]">
          {chunkFail ? "Updating the page…" : "Something went wrong"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {chunkFail
            ? "A newer version of the site just deployed. Reloading to get the latest files."
            : message}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <Link to="/academy" className="btn-outline">
            Back to Academy
          </Link>
        </div>
      </div>
    </div>
  );
}
