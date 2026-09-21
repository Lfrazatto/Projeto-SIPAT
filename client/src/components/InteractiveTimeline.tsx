import { useState, type ComponentType } from "react";
import { ArrowRight, ChevronDown, type LucideProps } from "lucide-react";

type TimelineIcon = ComponentType<LucideProps>;

type TimelineItem = {
  period: string;
  title: string;
  text: string;
  source: string;
  icon: TimelineIcon;
};

export function InteractiveTimeline({ items }: { items: TimelineItem[] }) {
  const [active, setActive] = useState(0);
  const selected = items[active] ?? items[0];
  if (!selected) return null;

  return <div className="interactive-timeline grid gap-5 lg:grid-cols-[.72fr_1.28fr]" aria-label="Linha do tempo interativa">
    <div className="relative space-y-2 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-red-500/30 lg:before:left-6">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === active;
        return <button key={item.period} type="button" onClick={() => setActive(index)} aria-current={isActive ? "step" : undefined} aria-expanded={isActive} aria-controls={`timeline-panel-${index}`} className={`timeline-trigger relative flex min-h-16 w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition ${isActive ? "border-red-400/60 bg-red-950/45 text-white shadow-lg shadow-red-950/20" : "border-white/10 bg-black/20 text-slate-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-white/5"}`}><span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${isActive ? "border-amber-300 bg-amber-400 text-slate-950" : "border-white/20 bg-[#141822] text-amber-300"}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0"><strong className="block font-industrial text-lg uppercase">{item.period}</strong><span className="block truncate text-xs text-slate-400">{item.title}</span></span><ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition-transform ${isActive ? "rotate-180 text-amber-300" : "text-slate-500"}`} aria-hidden="true" /></button>;
      })}
    </div>
    <article id={`timeline-panel-${active}`} className="timeline-panel v2-surface min-h-64 rounded-2xl p-6 sm:p-8" aria-live="polite"><div className="v2-kicker">Marco selecionado • {selected.period}</div><h3 className="mt-3 font-industrial text-3xl uppercase text-white sm:text-4xl">{selected.title}</h3><p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300">{selected.text}</p><a href={selected.source} target="_blank" rel="noreferrer" className="mt-7 inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase text-amber-300 hover:text-white">Ver fonte oficial <ArrowRight className="h-4 w-4" aria-hidden="true" /></a></article>
  </div>;
}
