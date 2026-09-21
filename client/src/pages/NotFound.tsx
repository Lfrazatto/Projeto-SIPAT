import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { AlertTriangle, ArrowRight, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100">
      <Navbar />
      <main className="relative flex min-h-[72vh] items-center justify-center overflow-hidden px-4 py-16">
        <div className="industrial-grid-bg absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(218,41,28,.18),transparent_38%)]" aria-hidden="true" />
        <section className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#151922]/95 p-7 text-center shadow-2xl sm:p-10" aria-labelledby="not-found-title">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-950/40 text-amber-300">
            <AlertTriangle className="h-9 w-9" aria-hidden="true" />
          </div>
          <div className="mt-5 font-mono text-xs font-bold uppercase tracking-[.22em] text-[#ff675c]">Código 404 • rota não localizada</div>
          <h1 id="not-found-title" className="mt-3 font-industrial text-4xl font-black uppercase text-white sm:text-5xl">Esta área não existe.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">O endereço pode ter mudado ou sido digitado incorretamente. Você pode voltar ao início ou seguir diretamente para os desafios da SIPAT.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="min-h-12 w-full bg-[#da291c] px-6 font-bold text-white sm:w-auto"><Link href="/"><Home className="mr-2 h-4 w-4" aria-hidden="true" /> Voltar ao início</Link></Button>
            <Button asChild variant="outline" className="min-h-12 w-full border-white/20 px-6 font-bold text-white sm:w-auto"><Link href="/jogos">Ver desafios <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          </div>
        </section>
      </main>
    </div>
  );
}
