import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Eye, Factory, HeartPulse, Leaf, Medal, ShieldAlert, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy, Users, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { IdentifyModal } from "@/components/IdentifyModal";
import { useParticipant } from "@/contexts/ParticipantContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { REAL_PHOTOS } from "@/data/realPhotos";
import { Reveal } from "@/components/Reveal";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { RedFlagSequence } from "@/components/RedFlagSequence";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { MuralHomeSection } from "@/components/MuralHomeSection";
import { Sipat3DExperience } from "@/components/Sipat3DExperience";

const games = [
  { key: "quiz_seguranca", number: "01", title: "Quiz de Segurança", short: "Atenção, decisão e prevenção.", description: "Red Flag, EPIs, LOTO e comunicação de riscos.", time: "10–12 min", score: "Pontuação por acerto", interaction: "Toque ou teclado", tone: "red", Icon: ShieldAlert },
  { key: "quiz_ergonomia", number: "02", title: "Quiz Lean Manufacturing", short: "Fluxo, qualidade e melhoria contínua.", description: "5S, Kaizen, Kanban, Just in Time e qualidade na fonte.", time: "10–12 min", score: "Pontuação por acerto", interaction: "Toque ou teclado", tone: "cyan", Icon: HeartPulse },
  { key: "ache_o_erro", number: "03", title: "Ache o Erro", short: "Olhar atento. Ação segura.", description: "Encontre atos e condições inseguras em cenas industriais.", time: "5–10 min", score: "Até 5 fases", interaction: "Clique, toque ou teclado", tone: "amber", Icon: Eye },
  { key: "organize_a_fabrica", number: "04", title: "Organize a Fábrica", short: "Fluxo, 5S e melhoria contínua.", description: "Encaixe os itens no posto e ordene o fluxo Lean.", time: "5–8 min", score: "12 encaixes + 5 etapas", interaction: "Toque, arraste ou teclado", tone: "blue", Icon: SlidersHorizontal },
] as const;

const toneClasses = {
  red: { card: "border-red-500/30 hover:border-red-400/80", icon: "bg-red-950/70 text-red-300 border-red-500/40", number: "text-red-300", progress: "bg-red-500", button: "bg-[#da291c] hover:bg-[#b01e12]" },
  cyan: { card: "border-cyan-500/25 hover:border-cyan-400/80", icon: "bg-cyan-950/70 text-cyan-300 border-cyan-500/40", number: "text-cyan-300", progress: "bg-cyan-400", button: "bg-cyan-600 hover:bg-cyan-700" },
  amber: { card: "border-amber-500/25 hover:border-amber-300/80", icon: "bg-amber-950/70 text-amber-300 border-amber-500/40", number: "text-amber-300", progress: "bg-amber-400", button: "bg-amber-600 hover:bg-amber-700" },
  blue: { card: "border-blue-500/25 hover:border-blue-300/80", icon: "bg-blue-950/70 text-blue-300 border-blue-500/40", number: "text-blue-300", progress: "bg-blue-400", button: "bg-blue-600 hover:bg-blue-700" },
};

export default function Home() {
  const [, navigate] = useLocation();
  const { participant } = useParticipant();
  const { reducedMotion } = useAccessibility();
  const [identifyModalOpen, setIdentifyModalOpen] = useState(false);
  const [activeMission, setActiveMission] = useState(0);
  const [heroPointer, setHeroPointer] = useState({ x: 0, y: 0 });
  const [now, setNow] = useState(() => Date.now());
  const settingsQuery = trpc.games.getSettings.useQuery(undefined, { refetchInterval: 30_000 });
  const progressQuery = trpc.participant.getProgress.useQuery({}, { enabled: Boolean(participant?.wwid), refetchInterval: 30_000 });
  const pData = progressQuery.data?.participant;

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1_000); return () => window.clearInterval(timer); }, []);

  const event = useMemo(() => {
    const settings = settingsQuery.data || [];
    const starts = settings.map((item) => item.accessStartAt?.getTime()).filter((value): value is number => typeof value === "number");
    const ends = settings.map((item) => item.accessEndAt?.getTime()).filter((value): value is number => typeof value === "number");
    const startAt = starts.length ? Math.min(...starts) : null;
    const endAt = ends.length ? Math.max(...ends) : null;
    const active = settings.some((item) => item.isOpen);
    const status = startAt && now < startAt ? "scheduled" : endAt && now > endAt ? "closed" : active ? "active" : "checking";
    const target = status === "scheduled" ? startAt : status === "closed" ? endAt : null;
    const remaining = target ? Math.max(0, target - now) : 0;
    return { status, startAt, endAt, days: Math.floor(remaining / 86_400_000), hours: Math.floor((remaining % 86_400_000) / 3_600_000), minutes: Math.floor((remaining % 3_600_000) / 60_000), seconds: Math.floor((remaining % 60_000) / 1_000) };
  }, [settingsQuery.data, now]);

  const handleStart = () => participant ? navigate("/jogos") : setIdentifyModalOpen(true);
  const completed = pData?.completedGamesCount || 0;
  const recommended = games.find((game) => {
    if (game.key === "quiz_seguranca") return !(pData?.bestSecurityScore || 0);
    if (game.key === "quiz_ergonomia") return !(pData?.bestEnvironmentScore || 0);
    if (game.key === "ache_o_erro") return !(pData?.bestSpotErrorScore || 0);
    return !(pData?.bestOrganizeScore || 0);
  }) || games[0];
  const formatDate = (value: number | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : null;

  return <div className="min-h-screen overflow-x-hidden bg-[#0b0e13] text-slate-100 selection:bg-[#da291c] selection:text-white"><Navbar />
    <main>
      <section className="hero-control relative isolate overflow-hidden border-b border-white/10" onMouseMove={(event) => { if (reducedMotion) return; const rect = event.currentTarget.getBoundingClientRect(); setHeroPointer({ x: ((event.clientX - rect.left) / rect.width - 0.5) * 18, y: ((event.clientY - rect.top) / rect.height - 0.5) * 18 }); }} onMouseLeave={() => setHeroPointer({ x: 0, y: 0 })}><div className="hero-control-bg absolute inset-0" style={{ backgroundImage: `url(${REAL_PHOTOS.productionLine.src})`, "--pointer-x": heroPointer.x, "--pointer-y": heroPointer.y } as React.CSSProperties} aria-hidden="true" /><div className="hero-energy-lines absolute inset-0" aria-hidden="true" /><div className="hero-connectors absolute inset-0" aria-hidden="true" /><div className="hero-cursor-glow absolute h-56 w-56 rounded-full" style={{ left: `calc(50% + ${heroPointer.x * 2}%)`, top: `calc(42% + ${heroPointer.y * 2}%)` }} aria-hidden="true" /><div className="hero-control-grid absolute inset-0" aria-hidden="true" /><div className="hero-control-glow absolute inset-0" aria-hidden="true" /><div className="relative mx-auto grid max-w-[1520px] gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-16">
        <Reveal className="max-w-3xl">
          <div className="hero-enter hero-enter-1 inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-950/80 px-3 py-1.5 text-xs font-bold text-red-200">
            <span className="status-dot" aria-hidden="true" /> DESAFIO 2026 • CUMMINS OSASCO
          </div>
          <h1 className="hero-enter hero-enter-2 mt-6 font-industrial text-5xl uppercase leading-[.88] tracking-tight text-white sm:text-7xl lg:text-8xl">
            CUMMINS <span className="text-[#da291c]">SIPAT</span><br />
            <span className="text-slate-200">DESAFIO 2026</span>
          </h1>
          <p className="hero-enter hero-enter-3 mt-6 max-w-2xl font-industrial text-xl uppercase tracking-wide text-amber-200 sm:text-2xl">
            Segurança começa com uma escolha.
          </p>
          <p className="hero-enter hero-enter-4 mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
            Entre na central de desafios da SIPAT Cummins Osasco. Jogue, aprenda, some pontos e transforme conhecimento em atitude no chão de fábrica.
          </p>
          <div className="hero-enter hero-enter-5 mt-8 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleStart}
              size="lg"
              className="nav-cta min-h-14 bg-[#da291c] px-7 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/60 hover:bg-[#b01e12]"
            >
              <Zap className="mr-2 h-5 w-5" aria-hidden="true" /> Participar agora <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-14 border-amber-400/40 bg-amber-950/20 px-6 text-sm font-bold uppercase text-amber-200 hover:bg-amber-900/30"
            >
              <Link href="/projeto-3d">
                <Factory className="mr-2 h-4 w-4 text-amber-300" aria-hidden="true" /> Explorar em 3D
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-14 border-white/25 bg-black/40 px-5 text-sm font-bold uppercase text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <Link href="/ranking">
                <Trophy className="mr-2 h-4 w-4 text-amber-300" aria-hidden="true" /> Ver ranking
              </Link>
            </Button>
          </div>
          <div className="hero-enter hero-enter-6 mt-8 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-300">
            <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5">4 desafios</span>
            <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5">Pontuação por desempenho</span>
            <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5">Premiação conforme regulamento</span>
          </div>
        </Reveal>
        <Reveal delay={100} className="w-full lg:max-w-none">
          <div className="hero-3d-wrapper rounded-3xl border border-red-400/40 bg-[#10151f]/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-md sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-amber-300" aria-hidden="true" />
                <div>
                  <span className="block font-industrial text-xs uppercase tracking-widest text-white">Projeto 3D Interativo</span>
                  <span className="text-[11px] text-slate-400">Ambiente industrial SIPAT • Eixo MS-120</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-emerald-300">
                  Exploração ativa
                </span>
                <Button asChild size="sm" variant="outline" className="min-h-9 border-white/20 bg-transparent text-xs font-bold text-white hover:bg-white/10">
                  <Link href="/projeto-3d">Tela completa <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <Sipat3DExperience heroLayout />
            </div>
          </div>
        </Reveal>
      </div></section>

      <section className="border-b border-white/10 bg-[#0e1219] px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1440px]"><Reveal><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="v2-kicker">{participant ? "Continue sua missão" : "Sua missão começa agora"}</div><h2 className="mt-2 font-industrial text-3xl uppercase text-white">{participant ? `Próximo desafio: ${recommended.title}` : "Identifique. Jogue. Suba no ranking."}</h2></div>{participant && <div className="rounded-xl border border-emerald-400/25 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200"><strong><AnimatedNumber value={completed} /> de 4</strong> desafios concluídos • <strong><AnimatedNumber value={pData?.totalScore || 0} suffix=" pts" /></strong></div>}</div><div className="mt-7 grid gap-3 md:grid-cols-3">{[{ n: "01", title: "Identifique-se", text: "Escolha seu perfil e entre na missão.", Icon: Users, done: Boolean(participant) }, { n: "02", title: "Desafie seus conhecimentos", text: "Complete os quatro jogos da SIPAT.", Icon: Target, done: completed > 0 }, { n: "03", title: "Suba no ranking", text: "Melhore sua pontuação e acompanhe sua posição.", Icon: Trophy, done: completed === 4 }].map((step, index) => <button type="button" key={step.n} onClick={() => setActiveMission(index)} aria-pressed={activeMission === index} className={`mission-step v2-surface rounded-2xl p-5 text-left ${step.done ? "mission-step-done" : ""} ${activeMission === index ? "mission-step-active" : ""}`} style={{ "--reveal-delay": `${index * 80}ms` } as React.CSSProperties}><div className="flex items-center justify-between"><span className={`mission-step-number font-industrial text-4xl ${activeMission === index ? "text-amber-300" : "text-red-300"}`}>{step.n}</span><span className={`flex h-10 w-10 items-center justify-center rounded-full ${step.done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-300"}`}>{step.done ? <CheckCircle2 className="h-5 w-5" aria-label="Etapa concluída" /> : <step.Icon className="h-5 w-5" aria-hidden="true" />}</span></div><h3 className="mt-5 font-industrial text-lg uppercase text-white">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{step.text}</p>{activeMission === index && <span className="mt-3 block text-xs font-bold text-amber-200">Próximo passo destacado: {index === 0 ? "identifique-se para começar" : index === 1 ? "escolha um desafio e jogue" : "acompanhe sua posição no ranking"}.</span>}</button>)}</div></Reveal></div></section>

      <section className="border-b border-white/10 bg-[#11141b] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1440px]"><Reveal><div className="overflow-hidden rounded-2xl border-2 border-[#da291c] bg-[#171b24] shadow-2xl"><div className="industrial-stripes h-3 w-full" /><div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_.55fr] lg:items-center"><div><div className="inline-flex items-center gap-2 rounded bg-[#da291c] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-white"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Red Flag</div><h2 className="mt-5 font-industrial text-3xl uppercase text-white sm:text-5xl">Atenção máxima à <span className="text-[#da291c]">segurança.</span></h2><p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300">Na Cummins, a segurança das pessoas vem em primeiro lugar. O Red Flag reforça a necessidade de atenção máxima em nossas atividades, com foco na identificação de riscos, prevenção de incidentes e cuidado com todos ao nosso redor.</p><RedFlagSequence onPractice={handleStart} /></div><div className="rounded-2xl border border-white/10 bg-black/45 p-6 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-emerald-300" aria-hidden="true" /><p className="mt-4 font-industrial text-2xl uppercase text-white">Atenção identifica.<br /><span className="text-emerald-300">Atitude protege.</span></p><Button type="button" onClick={handleStart} className="mt-6 min-h-12 w-full bg-[#da291c] text-xs font-bold uppercase text-white hover:bg-[#b01e12]">Praticar Red Flag nos jogos <ArrowRight className="ml-2 inline h-4 w-4" aria-hidden="true" /></Button></div></div><div className="industrial-stripes h-2 w-full" /></div></Reveal></div></section>

      {/* 5. Mural Voltar Seguro para Casa (depois de Red Flag e antes da Central de Jogos) */}
      <MuralHomeSection />

      {/* 6. Central de Jogos */}
      <section id="central-jogos" className="border-b border-white/10 bg-[#0b0e13] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1440px]"><Reveal><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="v2-kicker">Centro de desafios</div><h2 className="mt-2 font-industrial text-4xl uppercase text-white">Escolha seu desafio</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Cada jogo foi pensado para treinar um olhar diferente: decisão, melhoria contínua, percepção ou organização.</p></div><Button asChild variant="outline" className="min-h-11 w-fit border-white/20 text-white hover:bg-white/10"><Link href="/jogos">Abrir central completa <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{games.map((game, index) => { const tone = toneClasses[game.tone]; const score = game.key === "quiz_seguranca" ? pData?.bestSecurityScore : game.key === "quiz_ergonomia" ? pData?.bestEnvironmentScore : game.key === "ache_o_erro" ? pData?.bestSpotErrorScore : pData?.bestOrganizeScore; const done = Boolean(score); return <article key={game.key} className={`game-card group flex flex-col rounded-2xl border bg-[#141822] p-5 shadow-xl transition hover:-translate-y-1 ${tone.card}`}><div className="flex items-start justify-between gap-3"><span className={`flex h-12 w-12 items-center justify-center rounded-xl border ${tone.icon}`}><game.Icon className="h-6 w-6" aria-hidden="true" /></span><div className="text-right"><span className={`font-mono text-xs font-black ${tone.number}`}>{game.number}</span><span className={`mt-1 block rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${done ? "border-emerald-400/30 bg-emerald-950/30 text-emerald-300" : "border-white/15 bg-black/20 text-slate-400"}`}>{done ? "Concluído" : participant ? "Novo desafio" : "Disponível"}</span></div></div><h3 className="mt-5 font-industrial text-xl uppercase text-white">{game.title}</h3><p className="mt-2 text-sm font-semibold text-slate-200">{game.short}</p><p className="mt-2 min-h-12 text-xs leading-relaxed text-slate-400">{game.description}</p><dl className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs"><div className="flex justify-between gap-2"><dt className="text-slate-500">Tempo</dt><dd className="text-slate-200">{game.time}</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">Interação</dt><dd className="text-right text-slate-200">{game.interaction}</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">Seu recorde</dt><dd className="text-amber-300">{score ? `${score} pts` : "—"}</dd></div></dl><div className="mt-4"><div className="mb-1 flex justify-between text-[10px] uppercase text-slate-500"><span>progresso</span><span>{done ? "100%" : "pronto para começar"}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-black/50"><div className={`h-full ${tone.progress} transition-all duration-700`} style={{ width: done ? "100%" : "8%" }} /></div></div><Button asChild className={`mt-5 min-h-11 w-full text-xs font-bold uppercase text-white ${tone.button}`}><Link href={`/jogos?game=${game.key}`}>{done ? "Jogar novamente" : "Jogar agora"}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button></article>; })}</div></Reveal></div></section>

      <section className="border-b border-white/10 bg-[#0d0f13] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1440px]"><Reveal><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><div className="v2-kicker">Por que a SIPAT existe</div><h2 className="mt-2 font-industrial text-4xl uppercase text-white">Atenção que vira hábito</h2><p className="mt-4 text-sm leading-relaxed text-slate-300">Segurança, saúde, ergonomia, prevenção e responsabilidade se encontram em cada decisão da rotina.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[{ title: "Segurança", text: "Escolher o padrão seguro." }, { title: "Saúde", text: "Cuidar do corpo e da mente." }, { title: "Ergonomia", text: "Ajustar o trabalho à pessoa." }, { title: "Prevenção", text: "Agir antes do incidente." }, { title: "Responsabilidade", text: "Cuidar de si e do outro." }].map((item) => <div key={item.title} className="rounded-xl border border-white/10 bg-[#141822] p-4 transition hover:-translate-y-1 hover:border-red-400/50"><h3 className="font-industrial text-base uppercase text-white">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{item.text}</p></div>)}</div></div></Reveal></div></section>

      <section className="border-b border-white/10 bg-[#10131a] px-4 py-16 text-center sm:px-6 lg:px-8"><Reveal><div className="mx-auto max-w-4xl"><div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-950/30 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-widest text-amber-200"><Sparkles className="h-4 w-4" aria-hidden="true" /> Aprendemos. Criamos. Aplicamos. Transformamos.</div><h2 className="mt-6 font-industrial text-4xl uppercase text-white sm:text-6xl">Segurança começa com uma escolha.<br /><span className="text-[#da291c]">A sua começa agora.</span></h2><p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-300">Conheça também a história da Cummins, o Formare e o projeto desenvolvido pelos alunos.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button type="button" onClick={handleStart} size="lg" className="min-h-14 bg-[#da291c] px-7 text-sm font-black uppercase text-white hover:bg-[#b01e12]">Participar dos desafios <Zap className="ml-2 h-4 w-4" aria-hidden="true" /></Button><Button asChild size="lg" variant="outline" className="min-h-14 border-white/20 text-white hover:bg-white/10"><Link href="/nosso-projeto">Conhecer o Formare <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button></div></div></Reveal></section>
    </main><IdentifyModal open={identifyModalOpen} onOpenChange={setIdentifyModalOpen} onSuccess={() => navigate("/jogos")} /></div>;
}
