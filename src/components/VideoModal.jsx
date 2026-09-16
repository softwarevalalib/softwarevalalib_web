import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiExternalLink, FiX } from "react-icons/fi";
import { YOUTUBE_SHOWREEL_URL } from "../config/company";

/**
 * Modal video player. Pass `open` + `onClose` + a YouTube `videoId`.
 */
export default function VideoModal({ open, onClose, videoId, title = "Software Vala Liberia showreel" }) {
  const titleId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl bg-[#0f172a]"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b border-white/10">
              <h2 id={titleId} className="text-sm sm:text-base font-semibold text-white truncate pr-2">
                {title}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={YOUTUBE_SHOWREEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <FiExternalLink size={14} aria-hidden="true" />
                  YouTube
                </a>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close video"
                  className="grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <FiX size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="relative w-full aspect-video bg-black">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
