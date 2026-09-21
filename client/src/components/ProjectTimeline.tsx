import { useState } from "react";
import { CheckCircle2, Lightbulb, PencilRuler, Rocket, TestTube2 } from "lucide-react";

const steps = [
  { title: "Aprendemos", text: "Entendemos a SIPAT, a realidade da fábrica e os temas que precisavam virar experiências práticas.", Icon: Lightbulb },
  { title: "Planejamos", text: "Organizamos conteúdos, fluxos, jogos, acessibilidade, pontuação e uma narrativa que qualquer pessoa consegue acompanhar.", Icon: PencilRuler },
  { title: "Criamos", text: "Transformamos ideias em interface, desafios, imagens, banco de dados e elementos visuais inspirados no ambiente industrial.", Icon: Rocket },
  { title: "Testamos", text: "Revisamos telas, imagens, hotspots, teclado, celular, leitores de tela, tempo e respostas dos jogos.", Icon: TestTube2 },
  { title: "Entregamos", text: "Conectamos tudo em uma plataforma para aprender, praticar, competir e levar a segurança para a rotina.", Icon: CheckCircle2 },
];

export function ProjectTimeline() {
  const [active, setActive] = useState(0);
  const step = steps[active] ?? steps[0];
  if (!step) return null;
  return <section className="project-timeline mt-12 rounded-2xl border border-amber-300/25 bg-gradient-to-br from-amber-950/25 to-[#141822] p-5 sm:p-8" aria-labelledby="project-timeline-title"><div className="v2-kicker">Linha do tempo do projeto</div><h3 id="project-timeline-title" className="mt-2 font-industrial text-3xl uppercase text-white">Da ideia à entrega</h3><div className="mt-7 grid gap-6 lg:grid-cols-[1fr_.9fr] lg:items-center"><div className="relative flex flex-wrap gap-2 sm:gap-3 lg:flex-col">{steps.map((item, index) => { const Icon = item.Icon; const selected = index === active; return <button key={item.title} type="button" onClick={() => setActive(index)} aria-current={selected ? "step" : undefined} aria-expanded={selected} className={`flex min-h-14 flex-1 items-center gap-3 rounded-xl border px-3 py-3 text-left transition lg:flex-none ${selected ? "border-amber-300/70 bg-amber-400 text-slate-950 shadow-lg" : "border-white/10 bg-black/20 text-slate-200 hover:-translate-y-0.5 hover:border-amber-300/50"}`}><span className="font-mono text-xs font-black">0{index + 1}</span><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="text-xs font-black uppercase">{item.title}</span></button>; })}</div><article className="min-h-48 rounded-xl border border-white/10 bg-black/30 p-6" aria-live="polite"><div className="flex items-center gap-3 text-amber-300"><step.Icon className="h-7 w-7" aria-hidden="true" /><span className="font-mono text-xs uppercase">Etapa 0{active + 1}</span></div><h4 className="mt-5 font-industrial text-2xl uppercase text-white">{step.title}</h4><p className="mt-3 text-sm leading-relaxed text-slate-300">{step.text}</p></article></div></section>;
}
