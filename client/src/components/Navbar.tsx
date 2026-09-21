import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, BookOpen, Box, Camera, Gamepad2, Info, LogOut, Menu, ScrollText, Sparkles, Trophy, User, X } from "lucide-react";
import { useParticipant } from "@/contexts/ParticipantContext";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onOpenIdentify?: () => void;
}

const navLinks = [
  { label: "Início", path: "/" },
  { label: "Jogos", path: "/jogos", icon: Gamepad2 },
  { label: "Meu progresso", path: "/meu-progresso", icon: BarChart3 },
  { label: "Ranking", path: "/ranking", icon: Trophy },
  { label: "Sobre", path: "/sobre", icon: Info },
  { label: "Projeto 3D", path: "/projeto-3d", icon: Box },
  { label: "Nosso projeto", path: "/nosso-projeto", icon: Sparkles },
  { label: "Formare", path: "/formare", icon: BookOpen },
  { label: "História", path: "/historia-cummins", icon: ScrollText },
  { label: "Galeria", path: "/galeria", icon: Camera },
];

export function Navbar({ onOpenIdentify }: NavbarProps) {
  const [location, navigate] = useLocation();
  const { participant, logoutParticipant } = useParticipant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMobileMenuOpen(false), [location]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const isActive = (path: string) => (path === "/" ? location === "/" : location.startsWith(path));
  const identify = () => (onOpenIdentify ? onOpenIdentify() : navigate("/jogos"));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/15 bg-[#10141b]/95 shadow-xl backdrop-blur-md">
      <div className="h-1 w-full bg-gradient-to-r from-[#8b1710] via-[#da291c] to-[#ffc72c]" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2">
          <Link href="/" aria-label="SIPAT Cummins — página inicial" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-amber-300">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white p-1.5 shadow-md ring-1 ring-red-400/40">
              <img src="/manus-storage/cummins-logo_33ff0756.svg" alt="Logo oficial da Cummins" className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-industrial text-base font-extrabold tracking-wider text-white sm:text-lg">CUMMINS <span className="text-[#ff5548]">SIPAT</span></span>
              <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-slate-300">Desafio MS-120 • 2026</span>
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-1 xl:flex">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path} aria-current={isActive(link.path) ? "page" : undefined} className={`flex min-h-11 items-center rounded-lg px-3 text-xs font-bold transition-colors ${isActive(link.path) ? "bg-[#da291c] text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            {participant ? (
              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs">
                <User className="h-4 w-4 text-red-300" aria-hidden="true" />
                <span className="max-w-32 truncate font-semibold text-white">{participant.name}</span>
                <button type="button" onClick={logoutParticipant} aria-label="Encerrar identificação de participante" title="Trocar participante" className="min-h-9 min-w-9 rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white">
                  <LogOut className="mx-auto h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={identify} className="min-h-11 border-white/20 text-xs text-white hover:bg-white/10 font-bold">
                <User className="mr-2 h-4 w-4" aria-hidden="true" /> Identificar-se
              </Button>
            )}
            <Button asChild className="min-h-11 bg-[#da291c] font-bold text-xs uppercase tracking-wider text-white hover:bg-[#b01e12] shadow-md shadow-red-950/60">
              <Link href="/jogos">Começar agora</Link>
            </Button>
          </div>

          <button type="button" onClick={() => setMobileMenuOpen((current) => !current)} aria-label={mobileMenuOpen ? "Fechar menu principal" : "Abrir menu principal"} aria-expanded={mobileMenuOpen} aria-controls="menu-principal-mobile" className="min-h-11 min-w-11 rounded-lg border border-white/15 bg-white/5 p-2 text-white hover:bg-white/10 xl:hidden">
            {mobileMenuOpen ? <X className="mx-auto h-6 w-6" aria-hidden="true" /> : <Menu className="mx-auto h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav id="menu-principal-mobile" aria-label="Navegação principal no celular" className="border-t border-white/10 bg-[#10141b] px-4 py-4 xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-2 sm:grid-cols-2">
            {navLinks.map((link) => <Link key={link.path} href={link.path} aria-current={isActive(link.path) ? "page" : undefined} className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold ${isActive(link.path) ? "bg-[#da291c] text-white" : "text-slate-200 hover:bg-white/10"}`}>{link.label}</Link>)}
          </div>
          <div className="mx-auto mt-3 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row">
            {participant ? <Button type="button" variant="outline" onClick={logoutParticipant} className="min-h-11 flex-1 border-white/20 text-white"><LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Trocar participante: {participant.name}</Button> : <Button type="button" onClick={identify} className="min-h-11 flex-1 bg-[#da291c] text-white"><User className="mr-2 h-4 w-4" aria-hidden="true" /> Identificar-se</Button>}
            <Button asChild className="min-h-11 flex-1 bg-[#da291c] font-bold text-white uppercase"><Link href="/jogos">Começar desafio</Link></Button>
          </div>
        </nav>
      )}
    </header>
  );
}
