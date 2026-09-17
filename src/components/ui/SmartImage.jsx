// src/components/ui/SmartImage.jsx
import { useState } from "react";
import { cn } from "@/lib/utils";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"><rect width="300" height="450" fill="#1f1f1f"/><text x="150" y="225" text-anchor="middle" fill="#6b6b6b" font-family="sans-serif" font-size="16">No Image</text></svg>`,
  );

export default function SmartImage({
  src,
  alt = "",
  className,
  wrapperClassName,
  aspect = "aspect-[2/3]",
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-elevated",
        aspect,
        wrapperClassName,
      )}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-surface-elevated" />
      )}

      <img
        src={error || !src ? FALLBACK : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        className={cn(
          "h-full w-full object-cover transition duration-500",
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-md",
          className,
        )}
        {...rest}
      />
    </div>
  );
}
