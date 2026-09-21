import { useEffect, useRef, useState } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  format?: (value: number) => string;
};

export function AnimatedNumber({ value, duration = 650, prefix = "", suffix = "", className = "", format = (number) => new Intl.NumberFormat("pt-BR").format(number) }: AnimatedNumberProps) {
  const { reducedMotion } = useAccessibility();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reducedMotion || from === value) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, reducedMotion, value]);

  return <span className={`tabular-nums ${className}`} aria-label={`${prefix}${format(value)}${suffix}`}>{prefix}{format(display)}{suffix}</span>;
}
