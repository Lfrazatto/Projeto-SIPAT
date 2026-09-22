import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Accessibility,
  ArrowRight,
  Factory,
  HelpCircle,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { REAL_PHOTOS } from "@/data/realPhotos";

const LazyAxleAssemblyViewer = lazy(async () => {
  const module = await import("@/components/AxleAssemblyViewer");
  return { default: module.AxleAssemblyViewer };
});

export interface EducationPoint {
  id: string;
  title: string;
  category: string;
  description: string;
  action: string;
  href: string;
  targetComponentId?: string;
}

export const EDUCATION_POINTS: EducationPoint[] = [
  {
    id: "epi",
    title: "EPI e proteção",
    category: "Segurança",
    description: "O equipamento adequado reduz a exposição e precisa ser usado corretamente antes da atividade.",
    action: "Jogar Quiz de Segurança",
    href: "/jogos?game=quiz_seguranca",
    targetComponentId: "left_brake_assembly",
  },
  {
    id: "red-flag",
    title: "Red Flag",
    category: "Atenção máxima",
    description: "Ao identificar uma condição crítica, pare, sinalize, comunique e só retome com o risco controlado.",
    action: "Praticar no Quiz de Segurança",
    href: "/jogos?game=quiz_seguranca",
    targetComponentId: "main_axle_housing",
  },
  {
    id: "circulation",
    title: "Área de circulação",
    category: "Fluxo seguro",
    description: "Rotas livres e sinalizadas ajudam pessoas, materiais e veículos a circularem sem criar exposição desnecessária.",
    action: "Jogar Ache o Erro",
    href: "/jogos?game=ache_o_erro",
    targetComponentId: "left_axle_tube",
  },
  {
    id: "five-s",
    title: "Organização 5S",
    category: "Organização",
    description: "Materiais organizados e identificados facilitam o trabalho, reduzem riscos e preservam o fluxo da operação.",
    action: "Jogar Organize a Fábrica",
    href: "/jogos?game=organize_a_fabrica",
    targetComponentId: "housing_cover",
  },
  {
    id: "ergonomics",
    title: "Ergonomia",
    category: "Saúde",
    description: "Ajustar postura, alcance e ritmo da tarefa reduz sobrecarga e ajuda a trabalhar melhor.",
    action: "Jogar Quiz de Ergonomia",
    href: "/jogos?game=quiz_ergonomia",
    targetComponentId: "right_axle_shaft",
  },
  {
    id: "signage",
    title: "Sinalização",
    category: "Comunicação visual",
    description: "Placas, faixas e marcações comunicam limites, rotas e cuidados antes que alguém entre na zona de risco.",
    action: "Jogar Ache o Erro",
    href: "/jogos?game=ache_o_erro",
    targetComponentId: "fill_plug",
  },
  {
    id: "risk-communication",
    title: "Comunicação de riscos",
    category: "Prevenção",
    description: "Falar sobre o risco, registrar a condição e envolver a equipe transforma observação em prevenção.",
    action: "Jogar Quiz de Segurança",
    href: "/jogos?game=quiz_seguranca",
    targetComponentId: "housing_breather",
  },
  {
    id: "formare",
    title: "Projeto Formare",
    category: "Aprendizagem",
    description: "Este ambiente faz parte de uma experiência criada por alunos do Formare, unindo tecnologia, criatividade e segurança.",
    action: "Conhecer o projeto",
    href: "/nosso-projeto",
    targetComponentId: "differential_carrier",
  },
];

function WebglFallback({ onExplore }: { onExplore: (id?: string) => void }) {
  return (
    <div className="rounded-2xl border-2 border-amber-400/40 bg-[#111720] p-5 shadow-xl sm:p-7" role="status">
      <div className="grid gap-6 md:grid-cols-[.75fr_1.25fr] md:items-center">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <img
            src={REAL_PHOTOS.productionLine.src}
            alt="Linha industrial da Cummins usada como referência visual para a experiência SIPAT"
            className="aspect-[4/3] h-full w-full object-cover opacity-80"
            loading="lazy"
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-950/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-200">
            <Accessibility className="h-4 w-4" aria-hidden="true" /> Versão acessível disponível
          </div>
          <h3 className="mt-4 font-industrial text-2xl uppercase text-white">O conteúdo continua completo sem WebGL</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Seu dispositivo não conseguiu carregar o visualizador 3D. Você ainda pode conhecer todos os pontos educativos em formato de lista, com textos e acesso direto aos desafios.
          </p>
          <Button type="button" onClick={() => onExplore()} className="mt-5 min-h-12 bg-[#da291c] text-xs font-black uppercase text-white hover:bg-[#b01e12]">
            Ver informações sem 3D <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ViewerLoading() {
  return (
    <div className="flex min-h-[340px] items-center justify-center rounded-2xl border border-white/10 bg-[#0c1118] p-6 text-center" role="status" aria-live="polite">
      <div>
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full border-4 border-red-400/30 border-t-red-500" aria-hidden="true" />
        <p className="mt-4 font-industrial text-lg uppercase text-white">Carregando experiência 3D</p>
        <p className="mt-2 text-sm text-slate-400">A página continua disponível enquanto o modelo é renderizado.</p>
      </div>
    </div>
  );
}

interface Sipat3DExperienceProps {
  fullPage?: boolean;
  heroLayout?: boolean;
}

export function Sipat3DExperience({ fullPage = false, heroLayout = false }: Sipat3DExperienceProps) {
  const { reducedMotion } = useAccessibility();
  const experienceRef = useRef<HTMLDivElement>(null);
  const [load3D, setLoad3D] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [accessibleOpen, setAccessibleOpen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("sipat_3d_instructions_seen") !== "true";
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setLoad3D(true), fullPage ? 80 : 250);
    return () => window.clearTimeout(timer);
  }, [fullPage]);

  useEffect(() => {
    if (!load3D || typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    let context: RenderingContext | null = null;
    try {
      context = canvas.getContext("webgl2") ?? canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    } catch {
      context = null;
    }
    setWebglAvailable(Boolean(context));
  }, [load3D]);

  useEffect(() => {
    if (!immersive) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [immersive]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && immersive) setImmersive(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [immersive]);

  const dismissInstructions = () => {
    setShowInstructions(false);
    try {
      window.localStorage.setItem("sipat_3d_instructions_seen", "true");
    } catch {
      // Sem persistência, não quebra nada.
    }
  };

  const toggleImmersive = async () => {
    if (!immersive) {
      setLoad3D(true);
      setImmersive(true);
      try {
        await experienceRef.current?.requestFullscreen?.();
      } catch {
        // Fallback fixo preservado
      }
      return;
    }
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Fallback
      }
    }
    setImmersive(false);
  };

  if (heroLayout && !immersive) {
    return (
      <div ref={experienceRef} className="sipat-3d-hero-container flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/40">
          {!load3D ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center">
              <p className="font-industrial text-xl uppercase text-white">Ambiente SIPAT Interativo</p>
              <Button type="button" onClick={() => setLoad3D(true)} className="mt-4 bg-[#da291c] text-xs font-bold uppercase text-white">
                Carregar experiência 3D
              </Button>
            </div>
          ) : webglAvailable === null ? (
            <ViewerLoading />
          ) : webglAvailable ? (
            <Suspense fallback={<ViewerLoading />}>
              <LazyAxleAssemblyViewer
                compact
                onWebglError={() => setWebglAvailable(false)}
              />
            </Suspense>
          ) : (
            <WebglFallback onExplore={() => setAccessibleOpen(true)} />
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#121620] p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong className="block font-industrial text-sm uppercase tracking-wide text-white">Eixo MS-120 em 3D</strong>
            <span className="mt-0.5 block text-[11px] text-slate-400">Arraste para girar em 360° • Zoom com a roda do mouse ou pinça no celular</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => setAccessibleOpen((v) => !v)} variant="outline" className="min-h-9 border-white/15 bg-transparent px-2.5 text-xs font-medium text-slate-300 hover:bg-white/10">
              <Accessibility className="mr-1.5 h-3.5 w-3.5 text-emerald-300" aria-hidden="true" /> {accessibleOpen ? "Ocultar lista" : "Lista sem 3D"}
            </Button>
            <Button type="button" onClick={toggleImmersive} className="min-h-9 bg-[#da291c] px-3 text-xs font-bold uppercase text-white hover:bg-[#b01e12]">
              <Maximize2 className="mr-1.5 h-3.5 w-3.5" /> Tela cheia
            </Button>
          </div>
        </div>

        {accessibleOpen && (
          <div className="rounded-xl border border-emerald-400/40 bg-[#0d1617] p-3 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <strong className="text-emerald-300">Pontos educativos em texto</strong>
              <button type="button" onClick={() => setAccessibleOpen(false)} className="text-slate-400 hover:text-white">
                Fechar
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {EDUCATION_POINTS.map((pt) => (
                <div key={pt.id} className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                  <div className="font-bold text-white">{pt.title}</div>
                  <p className="mt-1 text-[11px] text-slate-300">{pt.description}</p>
                  <Link href={pt.href} className="mt-2 inline-block font-semibold text-red-300 hover:underline">
                    {pt.action} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const experienceClass = immersive
    ? "fixed inset-0 z-[80] overflow-y-auto bg-[#070a0f] p-3 sm:p-5"
    : "relative";

  return (
    <section
      ref={experienceRef}
      id="explore-sipat-3d"
      className={`${experienceClass} ${fullPage ? "border-y border-white/10 bg-[#0d1219] px-4 py-10 sm:px-6 lg:px-8 lg:py-14" : ""}`}
      aria-labelledby="sipat-3d-title"
    >
      <div className={fullPage ? "mx-auto max-w-[1440px]" : "mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"}>
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
          <div>
            <div className="v2-kicker flex items-center gap-2 text-amber-200">
              <Factory className="h-4 w-4" aria-hidden="true" /> Exploração SIPAT 3D
            </div>
            <h2 id="sipat-3d-title" className="mt-3 font-industrial text-4xl uppercase leading-[.95] text-white sm:text-6xl">
              Explore o ambiente <span className="text-[#da291c]">SIPAT</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              Conheça o projeto em 3D, descubra os pontos de atenção e veja como segurança, organização e prevenção fazem parte da rotina industrial.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wide text-slate-300">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-950/30 px-3 py-1.5 text-emerald-200">Exploração disponível</span>
              <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5">MS-120 / Osasco</span>
              <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5">Projeto Formare</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Interface organizada</div>
              <div className="mt-1 font-industrial text-2xl text-white">Modelo sem tópicos sobre a imagem</div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">A cena fica livre para você observar as peças. Os conteúdos educativos foram movidos para uma área própria.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => setShowInstructions(true)} variant="outline" className="min-h-11 border-white/20 bg-transparent text-xs font-bold text-white hover:bg-white/10">
                <HelpCircle className="mr-2 h-4 w-4 text-amber-300" aria-hidden="true" /> Instruções
              </Button>
              <Button type="button" onClick={() => setAccessibleOpen((value) => !value)} variant="outline" className="min-h-11 border-white/20 bg-transparent text-xs font-bold text-white hover:bg-white/10" aria-expanded={accessibleOpen}>
                <Accessibility className="mr-2 h-4 w-4 text-emerald-300" aria-hidden="true" /> {accessibleOpen ? "Fechar versão acessível" : "Ver versão acessível"}
              </Button>
              <Button type="button" onClick={toggleImmersive} className="min-h-11 bg-[#da291c] text-xs font-black uppercase text-white hover:bg-[#b01e12]">
                {immersive ? <Minimize2 className="mr-2 h-4 w-4" aria-hidden="true" /> : <Maximize2 className="mr-2 h-4 w-4" aria-hidden="true" />}
                {immersive ? "Sair da tela cheia" : "Explorar em tela cheia"}
              </Button>
            </div>
          </div>
        </div>

        {showInstructions && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border-2 border-cyan-400/30 bg-cyan-950/20 p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
            <p className="text-sm font-semibold text-cyan-100"><span className="font-black uppercase text-cyan-300">Como explorar:</span> arraste para girar e use dois dedos para aproximar. Consulte os conteúdos no painel separado.</p>
            <Button type="button" onClick={dismissInstructions} variant="outline" className="min-h-11 shrink-0 border-cyan-300/30 bg-transparent text-xs font-bold text-cyan-100 hover:bg-cyan-900/40">Entendi</Button>
          </div>
        )}

        <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_330px]">
          <div className="min-w-0">
            {!load3D ? (
              <div className="rounded-2xl border border-white/10 bg-[#0c1118] p-5 sm:p-7">
                <div className="grid gap-5 md:grid-cols-[.7fr_1.3fr] md:items-center">
                  <img src={REAL_PHOTOS.productionLine.src} alt="Ambiente industrial da Cummins usado como prévia da experiência 3D" className="aspect-[4/3] w-full rounded-xl object-cover opacity-75" loading="lazy" />
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-950/30 px-3 py-1.5 text-xs font-bold uppercase text-red-200"><Sparkles className="h-4 w-4" aria-hidden="true" /> Experiência interativa</div>
                    <h3 className="mt-4 font-industrial text-2xl uppercase text-white">Carregar experiência 3D</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">Veja o ambiente ligado ao projeto, explore os pontos de segurança e conheça os componentes do eixo MS-120.</p>
                    <Button type="button" onClick={() => setLoad3D(true)} className="mt-5 min-h-12 bg-[#da291c] text-xs font-black uppercase text-white hover:bg-[#b01e12]">Carregar experiência 3D <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
                  </div>
                </div>
              </div>
            ) : webglAvailable === null ? (
              <ViewerLoading />
            ) : webglAvailable ? (
              <Suspense fallback={<ViewerLoading />}>
                <LazyAxleAssemblyViewer
                  compact={!fullPage && !immersive}
                  onWebglError={() => setWebglAvailable(false)}
                />
              </Suspense>
            ) : (
              <WebglFallback onExplore={() => setAccessibleOpen(true)} />
            )}
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[#121821] p-5 shadow-xl" aria-label="Controles e conteúdo do modelo 3D">
            <div className="border-b border-white/10 pb-4">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">Modelo organizado</div>
              <h3 className="mt-1 font-industrial text-xl uppercase text-white">Explore sem poluição visual</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
              <p><strong className="text-white">1.</strong> Arraste para girar a câmera.</p>
              <p><strong className="text-white">2.</strong> Use a roda do mouse ou dois dedos para aproximar.</p>
              <p><strong className="text-white">3.</strong> Use Resetar para voltar à vista inicial.</p>
            </div>
            <Button type="button" onClick={() => setAccessibleOpen(true)} className="mt-5 min-h-12 w-full bg-[#da291c] text-xs font-black uppercase text-white hover:bg-[#b01e12]">
              <Accessibility className="mr-2 h-4 w-4" aria-hidden="true" /> Ver conteúdos educativos
            </Button>
          </aside>
        </div>

        {accessibleOpen && (
          <div className="mt-6 rounded-2xl border-2 border-emerald-400/30 bg-[#0f1a19] p-5 sm:p-7" aria-label="Lista acessível dos pontos educativos">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="v2-kicker text-emerald-200">Alternativa ao visualizador</div><h3 className="mt-1 font-industrial text-2xl uppercase text-white">Aprenda sem usar 3D</h3></div>
              <button type="button" onClick={() => setAccessibleOpen(false)} className="seg-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 text-xs font-bold text-slate-200 hover:bg-white/10"><X className="h-4 w-4" /> Fechar</button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {EDUCATION_POINTS.map((point, index) => (
                  <article key={point.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300 font-black text-black">{index + 1}</span></div>
                    <div className="mt-4 text-[10px] font-bold uppercase tracking-wide text-amber-300">{point.category}</div>
                    <h4 className="mt-1 font-industrial text-lg uppercase text-white">{point.title}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{point.description}</p>
                    <Link href={point.href} className="mt-4 inline-flex min-h-10 items-center text-xs font-black uppercase text-red-200 hover:text-white">{point.action}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
                  </article>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-slate-400 sm:flex-row sm:items-start">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
          <p><strong className="text-slate-200">Projeto desenvolvido por alunos do Formare.</strong> Este ambiente une aprendizado, tecnologia, criatividade e segurança em uma experiência interativa. O modelo é didático e não substitui desenhos, tolerâncias ou procedimentos oficiais de fabricação.</p>
        </div>
      </div>
    </section>
  );
}

export default Sipat3DExperience;
