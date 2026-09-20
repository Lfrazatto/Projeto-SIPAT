import React, { useEffect, useRef, useState } from "react";
import { Accessibility, RotateCcw, Type, X } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

function PreferenceSwitch({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border border-white/15 bg-black/35 p-3 text-left transition-colors hover:border-amber-300/60 hover:bg-white/10"
    >
      <span>
        <span className="block text-sm font-bold text-white">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-300">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${checked ? "border-amber-300 bg-amber-400" : "border-white/30 bg-slate-700"}`}
      >
        <span className={`absolute top-1 h-[18px] w-[18px] rounded-full bg-slate-950 transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </button>
  );
}

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    highContrast,
    reducedMotion,
    extendedTime,
    textScale,
    setHighContrast,
    setReducedMotion,
    setExtendedTime,
    cycleTextScale,
    resetPreferences,
  } = useAccessibility();

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const scaleLabel = textScale === "normal" ? "Padrão" : textScale === "large" ? "Grande" : "Extra grande";

  return (
    <aside className="fixed bottom-4 right-4 z-[80] flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="false"
          aria-labelledby="accessibility-title"
          className="w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-amber-300/40 bg-[#11151d]/98 p-4 text-slate-100 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 id="accessibility-title" className="flex items-center gap-2 text-base font-black text-white">
                <Accessibility className="h-5 w-5 text-amber-300" aria-hidden="true" />
                Recursos de acessibilidade
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">Ajustes salvos neste navegador.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar recursos de acessibilidade" className="min-h-11 min-w-11 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white">
              <X className="mx-auto h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-2">
            <PreferenceSwitch checked={highContrast} onChange={setHighContrast} label="Alto contraste" description="Reforça textos, bordas e controles." />
            <PreferenceSwitch checked={reducedMotion} onChange={setReducedMotion} label="Reduzir movimentos" description="Desativa animações e rolagem suave." />
            <PreferenceSwitch checked={extendedTime} onChange={setExtendedTime} label="Tempo ampliado nos jogos" description="Dobra o tempo dos desafios cronometrados." />
            <button type="button" onClick={cycleTextScale} className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border border-white/15 bg-black/35 p-3 text-left transition-colors hover:border-amber-300/60 hover:bg-white/10">
              <span>
                <span className="flex items-center gap-2 text-sm font-bold text-white"><Type className="h-4 w-4 text-amber-300" aria-hidden="true" /> Tamanho do texto</span>
                <span className="mt-0.5 block text-xs text-slate-300">Atual: {scaleLabel}. Clique para alterar.</span>
              </span>
              <span aria-hidden="true" className="font-black text-amber-300">A+</span>
            </button>
          </div>

          <button type="button" onClick={resetPreferences} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-xs font-bold text-slate-200 hover:bg-white/10">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restaurar preferências
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="accessibility-title"
        className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-amber-300 bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-2xl transition-transform active:scale-[.97]"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Accessibility className="h-5 w-5 text-amber-300" aria-hidden="true" />}
        <span>{open ? "Fechar" : "Acessibilidade"}</span>
      </button>
    </aside>
  );
}
