import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type TextScale = "normal" | "large" | "extra-large";

type AccessibilityContextValue = {
  highContrast: boolean;
  reducedMotion: boolean;
  extendedTime: boolean;
  textScale: TextScale;
  setHighContrast: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setExtendedTime: (value: boolean) => void;
  cycleTextScale: () => void;
  resetPreferences: () => void;
};

const STORAGE_KEY = "sipatma_accessibility_preferences";

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function initialPreferences(): Pick<AccessibilityContextValue, "highContrast" | "reducedMotion" | "extendedTime" | "textScale"> {
  if (typeof window === "undefined") {
    return { highContrast: false, reducedMotion: false, extendedTime: false, textScale: "normal" as TextScale };
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<{
        highContrast: boolean;
        reducedMotion: boolean;
        extendedTime: boolean;
        textScale: TextScale;
      }>;
      return {
        highContrast: Boolean(parsed.highContrast),
        reducedMotion: Boolean(parsed.reducedMotion),
        extendedTime: Boolean(parsed.extendedTime),
        textScale: parsed.textScale === "large" || parsed.textScale === "extra-large" ? parsed.textScale : "normal",
      };
    }
  } catch {
    // Preferências inválidas são ignoradas com segurança.
  }

  return {
    highContrast: false,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    extendedTime: false,
    textScale: "normal" as TextScale,
  };
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(initialPreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = preferences.highContrast ? "high" : "standard";
    root.dataset.motion = preferences.reducedMotion ? "reduced" : "standard";
    root.dataset.textScale = preferences.textScale;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // O site continua funcional quando o armazenamento do navegador está bloqueado.
    }
  }, [preferences]);

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      ...preferences,
      setHighContrast: (highContrast) => setPreferences((current) => ({ ...current, highContrast })),
      setReducedMotion: (reducedMotion) => setPreferences((current) => ({ ...current, reducedMotion })),
      setExtendedTime: (extendedTime) => setPreferences((current) => ({ ...current, extendedTime })),
      cycleTextScale: () =>
        setPreferences((current) => ({
          ...current,
          textScale: current.textScale === "normal" ? "large" : current.textScale === "large" ? "extra-large" : "normal",
        })),
      resetPreferences: () =>
        setPreferences({ highContrast: false, reducedMotion: false, extendedTime: false, textScale: "normal" }),
    }),
    [preferences]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibility deve ser usado dentro de AccessibilityProvider");
  return context;
}
