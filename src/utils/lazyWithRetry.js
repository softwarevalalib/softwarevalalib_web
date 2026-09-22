import { lazy } from "react";

const RELOAD_KEY = "svl_chunk_reload";

function isChunkLoadError(error) {
  const msg = String(error?.message || error || "");
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    /Unable to preload CSS/i.test(msg) ||
    error?.name === "ChunkLoadError"
  );
}

/** Hard reload once after a deploy when an old hashed chunk 404s. */
export function recoverFromChunkError(error) {
  if (!isChunkLoadError(error) || typeof window === "undefined") return false;
  try {
    const last = sessionStorage.getItem(RELOAD_KEY);
    const now = Date.now();
    // Avoid reload loops within 20s
    if (last && now - Number(last) < 20000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    // continue
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_svl_refresh", String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

/**
 * lazy() with retry, then hard reload on stale Vite chunk hashes after deploy.
 */
export function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (first) {
      if (!isChunkLoadError(first)) throw first;
      await new Promise((r) => setTimeout(r, 500));
      try {
        // Bust HTTP cache on the module graph by forcing a document reload path
        return await importer();
      } catch (second) {
        recoverFromChunkError(second);
        throw second;
      }
    }
  });
}

/** Listen for chunk failures outside React Router (e.g. prefetch). */
export function installChunkErrorRecovery() {
  if (typeof window === "undefined") return;
  const onError = (event) => {
    const err = event?.reason || event?.error || event;
    recoverFromChunkError(err);
  };
  window.addEventListener("unhandledrejection", onError);
  window.addEventListener("error", onError);
}

export { isChunkLoadError };
