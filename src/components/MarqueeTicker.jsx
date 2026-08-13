import { AiFillStar } from "react-icons/ai";

/**
 * Digtek-style repeating marquee strip ("THE BEST SOLUTION" with stars).
 * Content is duplicated so the -50% translate loops seamlessly.
 */
export default function MarqueeTicker({
  texts = ["THE BEST SOLUTION", "AWARD WINNING AGENCY", "TRUSTED BY 1K+ BRANDS"],
  repeat = 6,
}) {
  const items = Array.from({ length: repeat });

  const Row = () => (
    <div className="flex items-center shrink-0">
      {items.map((_, i) => (
        <div key={i} className="flex items-center">
          {texts.map((t, j) => (
            <span key={j} className="flex items-center">
              <span className="mx-6 sm:mx-10 text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-white/90 whitespace-nowrap">
                {t}
              </span>
              <AiFillStar className="star" size={18} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-slate-950 py-4 border-y border-white/5">
      <div className="marquee-ticker">
        <Row />
        <Row />
      </div>
    </div>
  );
}
