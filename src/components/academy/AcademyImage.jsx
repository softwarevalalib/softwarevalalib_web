import { useState } from "react";
import { ACADEMY_ASSETS } from "../../data/academyMeta";

/** Course/academy image with branded fallback if load fails. */
export default function AcademyImage({
  src,
  alt = "SVL Training Academy",
  className = "",
  fallback = ACADEMY_ASSETS.placeholderImage,
}) {
  const [current, setCurrent] = useState(src || fallback);

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
