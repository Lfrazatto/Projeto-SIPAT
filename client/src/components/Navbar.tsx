import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  BookOpen,
  Camera,
  ChevronDown,
  Gamepad2,
  HeartHandshake,
  Info,
  LogOut,
  Menu,
  ScrollText,
  Sparkles,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import { useParticipant } from "@/contexts/ParticipantContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onOpenIdentify?: () => void;
}

// Ordem oficial estrita do prompt (Seção 2 - Ordem dos links)
const MOBILE_PRIORITY_LINKS = [
  { label: "Começar desafio", path: "/jogos", icon: Zap, isHighlight: true },
  { label: "Jogos", path: "/jogos", icon: Gamepad2 },
  { label: "Ranking", path: "/ranking", icon: Trophy },
  { label: "Mural", path: "/mural", icon: HeartHandshake },
  { label: "Meu progresso", path: "/meu-progresso", icon: BarChart3 },
  { label: "Nosso projeto", path: "/nosso-projeto", icon: Sparkles },
  { label: "Formare", path: "/formare", icon: BookOpen },
  { label: "História da Cummins", path: "/historia-cummins", icon: ScrollText },
  { label: "Galeria de fotos", path: "/galeria", icon: Camera },
];

const DESKTOP_PRIMARY_LINKS = [
  { label: "Início", path: "/" },
  { label: "Jogos", path: "/jogos", icon: Gamepad2 },
  { label: "Ranking", path: "/ranking", icon: Trophy },
  { label: "Mural", path: "/mural", icon: HeartHandshake },
  { label: "Meu progresso", path: "/meu-progresso", icon: BarChart3 },
  { label: "Nosso projeto", path: "/nosso-projeto", icon: Sparkles },
];

const DESKTOP_INSTITUTIONAL_LINKS = [
  { label: "Formare", path: "/formare", icon: BookOpen },
  { label: "História da Cummins", path: "/historia-cummins", icon: ScrollText },
  { label: "Galeria de fotos", path: "/galeria", icon: Camera },
  { label: "Sobre a SIPAT", path: "/sobre", icon: Info },
];

function navIsActive(location: string, path: string) {
  if (path === "/") return location === "/";
  return location.startsWith(path);
}

export function Navbar({ onOpenIdentify }: NavbarProps) {
  const [location, navigate] = useLocation();
  const { participant, logoutParticipant } = useParticipant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pageProgress, setPageProgress] = useState(0);

  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const progressQuery = trpc.participant.getProgress.useQuery(
    {},
    { enabled: Boolean(participant?.wwid), refetchInterval: 30_000 }
  );
  const progress = progressQuery.data?.participant;

  useEffect(() => {
    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 18);
      setPageProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [location]);

  // Gestão de foco e scroll lock no menu mobile acessível
  useEffect(() => {
    if (!mobileMenuOpen) {
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
        previouslyFocusedRef.current = null;
      }
      return;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : mobileMenuButtonRef.current;

    // Trava de rolagem no fundo
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Foca o primeiro elemento focável dentro do painel
    const panel = mobilePanelRef.current;
    const getFocusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>("a, button, [tabindex='0']") || []
      ).filter((element) => !element.hasAttribute("disabled"));

    const initialFocusables = getFocusables();
    if (initialFocusables.length > 0) {
      initialFocusables[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const items = getFocusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Fecha o menu ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const identify = () => {
    if (onOpenIdentify) onOpenIdentify();
    else navigate("/jogos?identify=1");
  };

  const institutionalActive = DESKTOP_INSTITUTIONAL_LINKS.some((link) =>
    navIsActive(location, link.path)
  );

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-white/15 bg-[#0b0e14]/95 shadow-xl backdrop-blur-xl transition-all duration-200 ${
        scrolled ? "nav-is-compact" : ""
      }`}
    >
      <div
        className="h-1 w-full bg-gradient-to-r from-[#8b1710] via-[#da291c] to-[#ffc72c]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between gap-3 transition-[min-height,padding] duration-200 ${
            scrolled ? "min-h-14 py-1.5" : "min-h-16 py-2"
          }`}
        >
          {/* Logo e identificação */}
          <Link
            href="/"
            aria-label="SIPAT Cummins — página inicial"
            className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white p-1.5 shadow-md ring-1 ring-red-400/40">
              <img
                src="/manus-storage/cummins-logo_33ff0756.svg"
                alt="Logo oficial da Cummins"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-industrial text-base font-extrabold tracking-wider text-white sm:text-lg">
                CUMMINS <span className="text-[#ff5548]">SIPAT</span>
              </span>
              <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-slate-300">
                Desafio 2026
              </span>
            </span>
          </Link>

          {/* Navegação Desktop */}
          <nav aria-label="Navegação principal" className="hidden items-center gap-1 xl:flex">
            {DESKTOP_PRIMARY_LINKS.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                aria-current={navIsActive(location, link.path) ? "page" : undefined}
                className={`nav-link flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition-colors ${
                  navIsActive(location, link.path)
                    ? "nav-link-active bg-[#da291c] text-white"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.icon && <link.icon className="h-3.5 w-3.5" aria-hidden="true" />}
                {link.label}
              </Link>
            ))}
            <details className="relative group">
              <summary
                className={`flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold text-slate-200 transition hover:bg-white/10 hover:text-white ${
                  institutionalActive ? "bg-white/10 text-amber-300" : ""
                }`}
              >
                <span>Institucional</span>
                <ChevronDown
                  className="h-3.5 w-3.5 transition group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/15 bg-[#111620] p-2 shadow-2xl shadow-black/60">
                {DESKTOP_INSTITUTIONAL_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    aria-current={navIsActive(location, link.path) ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold ${
                      navIsActive(location, link.path)
                        ? "bg-[#da291c] text-white"
                        : "text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <link.icon className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </details>
          </nav>

          {/* Área de ações desktop */}
          <div className="hidden items-center gap-2 xl:flex">
            {participant ? (
              <div className="flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-950/20 px-3 text-xs">
                <User className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                <span className="max-w-28 truncate font-semibold text-white">
                  {participant.name}
                </span>
                <span className="whitespace-nowrap font-mono text-amber-300">
                  {progress?.totalScore || 0} pts
                </span>
                <button
                  type="button"
                  onClick={logoutParticipant}
                  aria-label="Encerrar identificação de participante"
                  title="Trocar participante"
                  className="min-h-9 min-w-9 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="mx-auto h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={identify}
                className="min-h-10 border-white/20 text-xs font-bold text-white hover:bg-white/10"
              >
                <User className="mr-2 h-4 w-4" aria-hidden="true" /> Identificar-se
              </Button>
            )}
            <Button
              asChild
              className="nav-cta min-h-10 bg-[#da291c] text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-950/60 hover:bg-[#b01e12]"
            >
              <Link href="/jogos">
                <Zap className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Participar agora
              </Link>
            </Button>
          </div>

          {/* Header Mobile: CTA compacto em destaque + Botão Menu >= 44x44px */}
          <div className="flex items-center gap-2 xl:hidden">
            <Link
              href="/jogos"
              className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#da291c] px-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-[#b01e12]"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span>Jogar</span>
            </Link>

            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Fechar menu principal" : "Abrir menu principal"}
              aria-expanded={mobileMenuOpen}
              aria-controls="menu-principal-mobile"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Linha de progresso de leitura suave no topo */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-[#ffc72c] transition-[width] duration-150"
        style={{ width: `${pageProgress}%` }}
        aria-hidden="true"
      />

      {/* Painel do Menu Mobile com foco contido e escurecimento do fundo */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[4.25rem] z-40 bg-black/75 backdrop-blur-md xl:hidden"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div
            ref={mobilePanelRef}
            id="menu-principal-mobile"
            className="mobile-menu-panel mx-auto max-h-[calc(100dvh-4.25rem)] max-w-[1440px] overflow-y-auto border-t border-white/15 bg-[#10141b] px-4 py-5 shadow-2xl sm:px-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-principal-mobile-title"
          >
            {/* Cabeçalho do menu com dados do participante */}
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Desafio 2026 • Navegação
                </span>
                <h2
                  id="menu-principal-mobile-title"
                  className="mt-0.5 font-industrial text-base font-bold uppercase text-white"
                >
                  Menu Oficial SIPAT
                </h2>
              </div>
              {participant ? (
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400">Pontuação</div>
                  <strong className="font-industrial text-sm text-amber-300">
                    {progress?.totalScore || 0} pts
                  </strong>
                </div>
              ) : (
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-mono text-slate-300">
                  Visitante
                </span>
              )}
            </div>

            {/* Lista dos 8 links na ordem estrita do prompt */}
            <nav aria-label="Links do menu mobile" className="flex flex-col gap-2">
              {MOBILE_PRIORITY_LINKS.map((link, index) => {
                const isActive = navIsActive(location, link.path);
                const isFirstCta = index === 0;

                if (isFirstCta) {
                  return (
                    <Link
                      key={`mobile-${link.label}`}
                      href={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className="mb-2 flex min-h-[50px] items-center justify-center gap-2.5 rounded-xl bg-[#da291c] px-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/50 hover:bg-[#b01e12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    >
                      <link.icon className="h-5 w-5" aria-hidden="true" />
                      <span>{link.label}</span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={`mobile-${link.label}`}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-[48px] items-center justify-between rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                      isActive
                        ? "bg-[#da291c] text-white shadow-md shadow-red-950/40"
                        : "bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <link.icon
                        className={`h-5 w-5 ${isActive ? "text-white" : "text-amber-400"}`}
                        aria-hidden="true"
                      />
                      <span>{link.label}</span>
                    </span>
                    <span className="font-mono text-[10px] uppercase text-slate-400">
                      {isActive ? "Atual" : ""}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Rodapé de autenticação do menu mobile */}
            <div className="mt-5 border-t border-white/10 pt-4">
              {participant ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                    <div>
                      <span className="block font-mono text-[10px] text-slate-400">Conectado como</span>
                      <strong className="block truncate text-white">{participant.name}</strong>
                    </div>
                    <span className="font-mono text-xs text-amber-300">
                      Perfil: {participant.participantType === "cummins" ? "Cummins" : participant.participantType === "terceiro" ? "Terceiro" : "Visitante"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      logoutParticipant();
                      setMobileMenuOpen(false);
                    }}
                    className="min-h-[48px] w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Trocar participante
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    identify();
                    setMobileMenuOpen(false);
                  }}
                  className="min-h-[48px] w-full bg-white/15 text-white hover:bg-white/25"
                >
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  Identificar-se para salvar pontuação
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
