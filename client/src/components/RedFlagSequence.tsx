import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { title: "PARE", text: "Interrompa a atividade quando identificar um risco. A pausa protege você e quem está ao redor.", Icon: AlertTriangle },
  { title: "COMUNIQUE", text: "Acione liderança e EHS. Compartilhe o que foi encontrado, onde está e por que precisa de atenção.", Icon: MessageCircle },
  { title: "AJA COM SEGURANÇA", text: "Elimine ou controle o perigo com orientação adequada. Só retome quando a condição estiver segura.", Icon: ShieldCheck },
];

export function RedFlagSequence({ onPractice }: { onPractice: () => void }) {
  const [active, setActive] = useState(0);
  const completed = active === steps.length - 1;
  const step = steps[active] ?? steps[0];
  if (!step) return null;
  return <div className="red-flag-sequence"><div className="grid gap-3 sm:grid-cols-3">{steps.map((item, index) => { const Icon = item.Icon; const selected = index === active; const done = index < active; return <button key={item.title} type="button" onClick={() => setActive(index)} aria-current={selected ? "step" : undefined} aria-expanded={selected} className={`red-flag-step group min-h-32 rounded-xl border p-4 text-left transition ${selected ? "border-red-300 bg-red-950/60 shadow-lg shadow-red-950/30" : done ? "border-emerald-400/35 bg-emerald-950/20" : "border-white/10 bg-black/35 hover:-translate-y-1 hover:border-red-300/50"}`}><div className="flex items-center justify-between"><span className={`font-mono text-xs font-black ${done ? "text-emerald-300" : "text-red-300"}`}>0{index + 1}</span>{done ? <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-label="Etapa concluída" /> : <Icon className={`h-5 w-5 ${selected ? "text-red-200" : "text-slate-400 group-hover:text-red-200"}`} aria-hidden="true" />}</div><h3 className="mt-5 font-industrial text-base uppercase text-white">{item.title}</h3></button>; })}</div><div className="mt-4 flex flex-col gap-4 rounded-xl border border-white/10 bg-black/35 p-5 sm:flex-row sm:items-center sm:justify-between" aria-live="polite"><div><div className="text-[10px] font-mono uppercase tracking-widest text-red-300">Etapa selecionada</div><p className="mt-1 text-sm leading-relaxed text-slate-200">{step.text}</p></div><Button type="button" onClick={() => completed ? onPractice() : setActive((value) => Math.min(steps.length - 1, value + 1))} className="min-h-11 shrink-0 bg-[#da291c] text-xs font-bold uppercase text-white hover:bg-[#b01e12]"><span>{completed ? "Praticar nos jogos" : "Próxima etapa"}</span><ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button></div>{completed && <p className="mt-3 text-center text-xs font-bold text-emerald-300">Viu um risco? Não ignore. Pare, comunique e aja com segurança.</p>}</div>;
}
