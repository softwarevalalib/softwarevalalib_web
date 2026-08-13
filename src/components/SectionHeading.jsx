import Reveal from "../Animations/Reveal";

/**
 * Consistent eyebrow + title + subtitle block used across all sections.
 * Pass `dark` when the section background is dark.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  dark = false,
  className = "",
}) {
  const alignment = align === "center" ? "text-center mx-auto" : "text-left";
  const titleClass = dark ? "text-white" : "";

  return (
    <Reveal>
      <div className={`max-w-2xl ${alignment} ${className}`}>
        {eyebrow && (
          <span className={`eyebrow ${dark ? "text-orange-400" : ""}`}>
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 className={`section-heading mt-3 ${titleClass}`}>{title}</h2>
        )}
        {subtitle && (
          <p
            className={`mt-4 text-base sm:text-lg leading-relaxed ${
              dark ? "text-slate-300" : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </Reveal>
  );
}
