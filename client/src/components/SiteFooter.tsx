import React from "react";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/15 bg-[#080a0e] px-4 py-8 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><ShieldCheck className="h-4 w-4 text-red-300" aria-hidden="true" /> Cummins SIPAT • CDBS Osasco</div>
          <p className="mt-2 max-w-xl text-xs leading-relaxed">Plataforma educativa de segurança, saúde, ergonomia e prevenção. A identificação do participante permanece somente durante a sessão do navegador.</p>
        </div>
        <nav aria-label="Links do rodapé" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold">
          <Link href="/sobre" className="min-h-11 content-center hover:text-white">Sobre</Link>
          <Link href="/nosso-projeto" className="min-h-11 content-center hover:text-white">Nosso projeto</Link>
          <Link href="/projeto-3d" className="min-h-11 content-center hover:text-white">Projeto 3D</Link>
          <Link href="/jogos" className="min-h-11 content-center hover:text-white">Desafios</Link>
          <Link href="/ranking" className="min-h-11 content-center hover:text-white">Ranking</Link>
          <Link href="/meu-progresso" className="min-h-11 content-center hover:text-white">Meu progresso</Link>
        </nav>
      </div>
    </footer>
  );
}
