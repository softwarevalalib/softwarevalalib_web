import { lazy } from "react";

const RELOAD_KEY = "svl_chunk_reload";

function isChunkLoadError(error) {
  const msg = String(error?.message || error || "");
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    error?.name === "ChunkLoadError"
  );
}

/** One hard reload after a deploy when an old hashed chunk 404s. */
export function recoverFromChunkError(error) {
  if (!isChunkLoadError(error) || typeof window === "undefined") return false;
  try {
    const last = sessionStorage.getItem(RELOAD_KEY);
    const now = String(Date.now());
    // Avoid reload loops within 15s
    if (last && now - Number(last) < 15000) return false;
    sessionStorage.setItem(RELOAD_KEY, now);
  } catch {
    // sessionStorage blocked — still try once via location reload
  }
  window.location.reload();
  return true;
}

/**
 * lazy() with one retry, then hard reload on stale Vite chunk hashes after deploy.
 */
export function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (first) {
      if (!isChunkLoadError(first)) throw first;
      // Brief wait then retry (CDN/propagation)
      await new Promise((r) => setTimeout(r, 400));
      try {
        return await importer();
      } catch (second) {
        recoverFromChunkError(second);
        throw second;
      }
    }
  });
}

export { isChunkLoadError };
