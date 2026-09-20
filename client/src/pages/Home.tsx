import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { IdentifyModal } from "@/components/IdentifyModal";
import { useParticipant } from "@/contexts/ParticipantContext";
import { trpc } from "@/lib/trpc";
import { 
  ShieldAlert, 
  Leaf, 
  HeartPulse, 
  Sparkles, 
  Target, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle, 
  Trophy, 
  Award,
  Factory,
  Cog,
  ShieldCheck,
  ChevronRight,
  Eye,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealFactoryPhoto } from "@/components/RealFactoryPhoto";
import { REAL_PHOTOS } from "@/data/realPhotos";

export default function Home() {
  const [, navigate] = useLocation();
  const { participant } = useParticipant();
  const [identifyModalOpen, setIdentifyModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const settingsQuery = trpc.games.getSettings.useQuery(undefined, { refetchInterval: 30_000 });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const eventWindow = useMemo(() => {
    const settings = settingsQuery.data || [];
    const starts = settings.map((item) => item.accessStartAt?.getTime()).filter((value): value is number => typeof value === "number");
    const ends = settings.map((item) => item.accessEndAt?.getTime()).filter((value): value is number => typeof value === "number");
    const startAt = starts.length ? Math.min(...starts) : null;
    const endAt = ends.length ? Math.max(...ends) : null;
    const active = settings.some((item) => item.isOpen);
    const status = startAt && now < startAt ? "scheduled" : endAt && now > endAt ? "closed" : active ? "active" : "active";
    const target = status === "scheduled" ? startAt : status === "closed" ? endAt : null;
    const remaining = target ? Math.max(0, target - now) : 0;
    const days = Math.floor(remaining / 86_400_000);
    const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1_000);
    return { status, startAt, endAt, days, hours, minutes, seconds };
  }, [settingsQuery.data, now]);

  const formatEventDate = (value: number | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "sem data definida";

  const handleStartChallenge = () => {
    if (participant) {
      navigate("/jogos");
    } else {
      setIdentifyModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#141821] via-[#101217] to-[#0d0f13]">
        {/* Subtle industrial grid and lighting effect */}
        <div className="absolute inset-0 industrial-grid-bg opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#da291c]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Text and CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/30 text-xs font-semibold text-red-300">
                <span className="w-2 h-2 rounded-full bg-[#da291c] animate-ping" />
                <span>PLATAFORMA OFICIAL • CUMMINS OSASCO • V3.0</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-industrial tracking-tight text-white uppercase leading-none">
                  CUMMINS <span className="text-[#da291c] inline-block">SIPATMA</span><br className="hidden sm:inline" />
                  <span className="text-slate-300">DESAFIO 2026</span>
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-slate-200 tracking-wide font-industrial text-red-400">
                  “Segurança começa com uma escolha.”
                </p>
              </div>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Uma experiência prática de segurança, ergonomia e melhoria contínua. Complete os quatro desafios, acompanhe sua evolução e transforme conhecimento em atitude no chão de fábrica.
              </p>

              {/* Motivational Quote Banner */}
              <div className="p-4 rounded-lg bg-black/40 border-l-4 border-[#da291c] border-y border-r border-white/10 text-slate-300 text-sm italic shadow-inner">
                “Segurança não é apenas uma regra. É uma atitude que protege todos nós.”
              </div>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Button
                  onClick={handleStartChallenge}
                  size="lg"
                  className="bg-[#da291c] hover:bg-[#b82116] text-white font-extrabold text-base tracking-wider uppercase px-8 py-6 rounded-md shadow-lg shadow-red-900/50 flex items-center gap-2 group transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>ENTRAR NA JORNADA</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-white/20 hover:bg-white/10 text-slate-200 font-bold text-base px-6 py-6 rounded-md flex items-center gap-2"
                  >
                    <Link href="/ranking"><Trophy className="w-4 h-4 text-amber-400" /><span>ACOMPANHAR RANKING</span></Link>
                  </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild variant="outline" size="sm" className="border-white/20 text-slate-300 text-xs uppercase"><Link href="/jogos">Jogos</Link></Button>
                <Button asChild variant="outline" size="sm" className="border-white/20 text-slate-300 text-xs uppercase"><Link href="/jogos?game=quiz_seguranca">Quiz de Segurança</Link></Button>
                <Button asChild variant="outline" size="sm" className="border-white/20 text-slate-300 text-xs uppercase"><Link href="/jogos?game=ache_o_erro">Achar os Erros</Link></Button>
              </div>

              <div className={`rounded-lg border p-4 ${eventWindow.status === "active" ? "border-emerald-500/40 bg-emerald-950/30" : eventWindow.status === "closed" ? "border-red-500/40 bg-red-950/30" : "border-amber-500/40 bg-amber-950/30"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Configurações do Evento • America/Sao_Paulo</div>
                    <div className="mt-1 font-industrial text-sm font-bold uppercase text-white">{eventWindow.status === "active" ? "SIPATMA liberada" : eventWindow.status === "closed" ? "A SIPATMA foi encerrada" : "A SIPATMA ainda não começou"}</div>
                    <p className="mt-1 text-xs text-slate-400">{eventWindow.status === "active" ? `Período configurado: ${formatEventDate(eventWindow.startAt)} até ${formatEventDate(eventWindow.endAt)}` : eventWindow.status === "closed" ? "O período de participação deste evento terminou." : `Este evento estará disponível a partir de ${formatEventDate(eventWindow.startAt)}.`}</p>
                  </div>
                  {eventWindow.status !== "active" && <div className="grid grid-cols-4 gap-2 text-center font-mono"><div><div className="text-lg font-black text-white">{String(eventWindow.days).padStart(2, "0")}</div><div className="text-[9px] text-slate-500">dias</div></div><div><div className="text-lg font-black text-white">{String(eventWindow.hours).padStart(2, "0")}</div><div className="text-[9px] text-slate-500">horas</div></div><div><div className="text-lg font-black text-white">{String(eventWindow.minutes).padStart(2, "0")}</div><div className="text-[9px] text-slate-500">min</div></div><div><div className="text-lg font-black text-white">{String(eventWindow.seconds).padStart(2, "0")}</div><div className="text-[9px] text-slate-500">seg</div></div></div>}
                </div>
              </div>

              {/* Quick mini indicators */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
                <div>
                  <div className="text-[#da291c] font-black text-xl font-industrial">4</div>
                  <div className="text-slate-400">Desafios Interativos</div>
                </div>
                <div>
                  <div className="text-amber-400 font-black text-xl font-industrial">1.200+</div>
                  <div className="text-slate-400">Pontos Máximos</div>
                </div>
                <div>
                  <div className="text-emerald-400 font-black text-xl font-industrial">100%</div>
                  <div className="text-slate-400">Foco em Prevenção</div>
                </div>
              </div>
            </div>

            {/* Right Column: Industrial Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl p-1 bg-gradient-to-b from-red-600/30 via-slate-700/20 to-black/80 shadow-2xl">
                <div className="rounded-xl overflow-hidden bg-[#151922] border border-white/10 p-6 space-y-6">
                  {/* Top Card Badge */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Factory className="w-5 h-5 text-[#da291c]" />
                      <span className="font-industrial font-bold text-sm tracking-wider uppercase text-white">
                        PLATA FORMA INDUSTRIAL 4.0
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      SISTEMA ATIVO
                    </span>
                  </div>

                  {/* 4 Games preview list */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between hover:border-[#da291c]/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-red-500/20 text-[#da291c]">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">1. Quiz de Segurança</div>
                          <div className="text-[11px] text-slate-400">12 perguntas cronometradas</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">60s / q</span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between hover:border-emerald-500/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-emerald-500/20 text-emerald-400">
                          <Leaf className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">2. Quiz de Ergonomia</div>
                          <div className="text-[11px] text-slate-400">Postura, movimentação e pausas seguras</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">60s / q</span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between hover:border-amber-500/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-amber-500/20 text-amber-400">
                          <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">3. Ache o Erro</div>
                          <div className="text-[11px] text-slate-400">Identificação visual de riscos</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">Clique</span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between hover:border-cyan-500/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-cyan-500/20 text-cyan-400">
                          <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white uppercase">4. Organize a Fábrica</div>
                          <div className="text-[11px] text-slate-400">Drag & Drop 5S e Lean</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300">Arrastar</span>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-slate-400">
                      As melhores pontuações de cada desafio se somam para formar sua Pontuação Total no Ranking Oficial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b0e13] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {[
            { n: "01", title: "IDENTIFIQUE-SE", text: "Entre com sua chapa ou WWID para salvar seu desempenho." },
            { n: "02", title: "JOGUE OS 4 DESAFIOS", text: "Segurança, ergonomia, inspeção visual e 5S." },
            { n: "03", title: "EVOLUA NO RANKING", text: "Sua melhor pontuação em cada desafio forma seu resultado." },
          ].map((item, index) => (
            <div key={item.n} className="v2-rise v2-surface rounded-xl p-4" style={{ animationDelay: `${index * 70}ms` }}>
              <div className="mb-3 flex items-center gap-3"><span className="font-mono text-xs font-black text-[#da291c]">{item.n}</span><div className="v2-divider flex-1" /></div>
              <h3 className="font-industrial text-sm font-bold uppercase tracking-wide text-white">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#0f1218]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <RealFactoryPhoto
            src={REAL_PHOTOS.productionLine.src}
            alt="Linha automatizada de produção na fábrica da Cummins em Osasco, com equipamentos industriais e área de montagem"
            caption="Linha de produção e automação na unidade Cummins de Osasco."
            credit={REAL_PHOTOS.productionLine.credit}
            sourceUrl={REAL_PHOTOS.productionLine.sourceUrl}
            className="group lg:col-span-3"
          />
          <RealFactoryPhoto
            src={REAL_PHOTOS.assembly.src}
            alt="Colaborador trabalhando na montagem de componentes em uma linha industrial da Cummins Meritor em Osasco"
            caption="Manufatura e cuidado ativo no trabalho diário da planta."
            credit={REAL_PHOTOS.assembly.credit}
            sourceUrl={REAL_PHOTOS.assembly.sourceUrl}
            className="group lg:col-span-2"
          />
        </div>
      </section>

      {/* SECTION 4: RED FLAG - CUMMINS OSASCO */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative overflow-hidden bg-[#11141b]">
        <div className="max-w-7xl mx-auto">
          {/* Industrial Danger Plate Style */}
          <div className="rounded-2xl overflow-hidden border-2 border-[#da291c] bg-[#171b24] shadow-2xl relative">
            {/* Caution stripes header */}
            <div className="h-4 w-full industrial-stripes" />

            <div className="p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#da291c] text-white font-mono text-xs font-bold tracking-widest uppercase shadow">
                    <AlertTriangle className="w-4 h-4" />
                    PROCEDIMENTO OPERACIONAL DE SEGURANÇA
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-extrabold font-industrial text-white tracking-wide uppercase">
                    RED FLAG <span className="text-[#da291c]">| ATENÇÃO MÁXIMA À SEGURANÇA</span>
                  </h2>

                  <div className="space-y-3 text-base leading-relaxed text-slate-300 sm:text-lg">
                    <p>Na Cummins, a segurança das pessoas vem em primeiro lugar.</p>
                    <p>O Red Flag reforça a necessidade de atenção máxima em nossas atividades, com foco na identificação de riscos, prevenção de incidentes e cuidado com todos ao nosso redor.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-lg bg-black/40 border border-white/10 flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-red-950 flex items-center justify-center text-[#da291c] font-bold text-lg mb-2 border border-red-500/40">
                        1
                      </div>
                      <h4 className="font-bold text-sm text-white uppercase font-industrial">PARE</h4>
                      <p className="text-xs text-slate-400 mt-1">Interrompa a atividade de risco imediatamente</p>
                    </div>

                    <div className="p-4 rounded-lg bg-black/40 border border-white/10 flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-amber-950 flex items-center justify-center text-amber-400 font-bold text-lg mb-2 border border-amber-500/40">
                        2
                      </div>
                      <h4 className="font-bold text-sm text-white uppercase font-industrial">COMUNIQUE</h4>
                      <p className="text-xs text-slate-400 mt-1">Acione a liderança e equipe de segurança EHS</p>
                    </div>

                    <div className="p-4 rounded-lg bg-black/40 border border-white/10 flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center text-emerald-400 font-bold text-lg mb-2 border border-emerald-500/40">
                        3
                      </div>
                      <h4 className="font-bold text-sm text-white uppercase font-industrial">AJA COM SEGURANÇA</h4>
                      <p className="text-xs text-slate-400 mt-1">Retome o trabalho somente após a eliminação do perigo</p>
                    </div>
                  </div>

                  {/* Official prompt callout */}
                  <div className="p-4 rounded-lg bg-red-950/40 border border-[#da291c]/50 text-white font-bold text-sm sm:text-base flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-[#da291c] shrink-0" />
                    <span>“Viu um risco? Não ignore. Pare, comunique e aja com segurança.”</span>
                  </div>
                </div>

                {/* Right visual industrial plate */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-black/50 rounded-xl border border-white/10 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#da291c] p-3 shadow-xl shadow-red-900/60 mb-4 border-2 border-red-300">
                    <img src="/manus-storage/cummins-logo_33ff0756.svg" alt="Logo oficial da Cummins" className="h-full w-full object-contain" />
                  </div>
                  <h3 className="font-industrial font-extrabold text-xl text-white tracking-wider">
                    BANDEIRA VERMELHA
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">
                    A segurança de todos os colaboradores da Cummins em Osasco é prioridade inegociável.
                  </p>
                  <Button
                    onClick={handleStartChallenge}
                    className="mt-4 w-full bg-[#da291c] hover:bg-[#b01e12] text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Praticar Red Flag nos Jogos
                  </Button>
                </div>
              </div>
            </div>

            {/* Caution stripes bottom */}
            <div className="h-2 w-full industrial-stripes" />
          </div>
        </div>
      </section>

      {/* SECTION 5:SIPATMA & PILARES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#0d0f13]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
              <ShieldCheck className="w-4 h-4 text-[#da291c]" />
              SEMANA INTERNA DE PREVENÇÃO DE ACIDENTES DO TRABALHO
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-industrial text-white tracking-wide uppercase">
              O QUE É <span className="text-[#da291c]">SIPATMA</span>?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              “A SIPATMA é uma iniciativa voltada à conscientização sobre Segurança, Saúde, Ergonomia e prevenção de acidentes no ambiente de trabalho.”
            </p>
          </div>

          {/* 5 Prominent Pillars required by brief */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Pilar 1 */}
            <div className="p-6 rounded-xl bg-[#141822] border border-white/10 hover:border-[#da291c] transition-all duration-200 flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-[#da291c] mb-4 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="font-industrial font-extrabold text-lg text-white tracking-wider uppercase">
                SEGURANÇA
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Prevenção zero acidentes, uso obrigatório de EPIs e cumprimento dos padrões operacionais.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="p-6 rounded-xl bg-[#141822] border border-white/10 hover:border-pink-500 transition-all duration-200 flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-7 h-7" />
              </div>
              <h3 className="font-industrial font-extrabold text-lg text-white tracking-wider uppercase">
                SAÚDE
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Ergonomia na linha de montagem, bem-estar físico, psicológico e qualidade de vida.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="p-6 rounded-xl bg-[#141822] border border-white/10 hover:border-emerald-500 transition-all duration-200 flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <Leaf className="w-7 h-7" />
              </div>
              <h3 className="font-industrial font-extrabold text-lg text-white tracking-wider uppercase">
                ERGONOMIA
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Rotina Cummins Postura & Pausas: ajuste do posto, movimentação segura e recuperação física.
              </p>
            </div>

            {/* Pilar 4 */}
            <div className="p-6 rounded-xl bg-[#141822] border border-white/10 hover:border-amber-500 transition-all duration-200 flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="font-industrial font-extrabold text-lg text-white tracking-wider uppercase">
                PREVENÇÃO
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Antecipar perigos, reportar quase-acidentes e eliminar riscos antes que se tornem danos.
              </p>
            </div>

            {/* Pilar 5 */}
            <div className="p-6 rounded-xl bg-[#141822] border border-white/10 hover:border-blue-500 transition-all duration-200 flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-industrial font-extrabold text-lg text-white tracking-wider uppercase">
                RESPONSABILIDADE
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Cuidado ativo: cada colaborador cuidando de si e dos seus colegas de bancada e linha.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK HOW IT WORKS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#12151d]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#da291c] tracking-widest uppercase">
                DINÂMICA DE GAMIFICAÇÃO
              </span>
              <h2 className="text-3xl font-extrabold font-industrial text-white tracking-wide uppercase mt-1">
                COMO FUNCIONA O DESAFIO
              </h2>
            </div>
            <Button asChild className="bg-[#da291c] hover:bg-[#b01e12] text-white font-bold text-xs uppercase tracking-wider"><Link href="/jogos">Acessar Área de Jogos</Link></Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-lg bg-black/40 border border-white/10 space-y-2">
              <div className="text-2xl font-black font-industrial text-[#da291c]">01</div>
              <h4 className="font-bold text-white text-sm uppercase">Identificação</h4>
              <p className="text-xs text-slate-400">
                Informe seu nome e o identificador do seu perfil — chapa para terceiro ou WWID para funcionário Cummins — para salvar suas pontuações oficiais.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-black/40 border border-white/10 space-y-2">
              <div className="text-2xl font-black font-industrial text-[#da291c]">02</div>
              <h4 className="font-bold text-white text-sm uppercase">Escolha a Dificuldade</h4>
              <p className="text-xs text-slate-400">
                Fácil (100 pts), Médio (200 pts) ou Difícil (300 pts). Maior risco, maior recompensa!
              </p>
            </div>

            <div className="p-5 rounded-lg bg-black/40 border border-white/10 space-y-2">
              <div className="text-2xl font-black font-industrial text-[#da291c]">03</div>
              <h4 className="font-bold text-white text-sm uppercase">Velocidade & Precisão</h4>
              <p className="text-xs text-slate-400">
                Responda com agilidade dentro dos 60 segundos por questão para pontuação máxima.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-black/40 border border-white/10 space-y-2">
              <div className="text-2xl font-black font-industrial text-[#da291c]">04</div>
              <h4 className="font-bold text-white text-sm uppercase">Acumule no Ranking</h4>
              <p className="text-xs text-slate-400">
                Complete os 4 desafios. Sua melhor pontuação em cada um forma seu total no Ranking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <IdentifyModal
        open={identifyModalOpen}
        onOpenChange={setIdentifyModalOpen}
        onSuccess={() => navigate("/jogos")}
      />
    </div>
  );
}
