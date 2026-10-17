import React from "react";

interface CumminsLogoBadgeProps {
  className?: string;
  alt?: string;
}

export function CumminsLogoBadge({
  className = "h-12 w-12",
  alt = "Logo oficial da Cummins",
}: CumminsLogoBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-200/70 bg-white p-1.5 shadow-[0_0_0_1px_rgba(255,199,44,.25),0_0_18px_rgba(255,199,44,.18)] ${className}`}
    >
      <img
        src="/assets/cummins-original-black.webp"
        alt={alt}
        width="2042"
        height="2048"
        className="h-full w-full object-contain"
      />
    </span>
  );
}
