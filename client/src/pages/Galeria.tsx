import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { InstitutionalGallery } from "@/components/InstitutionalGallery";

export default function Galeria() {
  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100"><Navbar /><main>
      <section className="border-b border-white/10 bg-gradient-to-b from-[#161a24] to-[#0d0f13] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="v2-kicker">Galeria de fotos</div><h1 className="mt-3 max-w-4xl font-industrial text-5xl uppercase leading-[.95] text-white sm:text-8xl">Imagens que contam <span className="text-[#da291c]">contextos.</span></h1><p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300">Conheça registros da operação, da tecnologia, da equipe e da aprendizagem que deram forma ao projeto SIPAT Cummins Osasco.</p></div></section>
      <section className="border-b border-white/10 bg-[#12151d] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><InstitutionalGallery /></div></section>
      <section className="px-4 py-10 text-center sm:px-6 lg:px-8"><p className="mx-auto max-w-3xl text-xs leading-relaxed text-slate-500">Fotos de imprensa e imagens enviadas pela equipe aparecem com créditos e indicação de autorização. Para publicação externa das fotos de pessoas, confirme o consentimento conforme as regras da organização.</p><Link href="/nosso-projeto" className="mt-4 inline-flex min-h-11 items-center text-xs font-bold uppercase text-amber-300 hover:text-white">Voltar ao nosso projeto <ArrowRight className="ml-2 h-4 w-4" /></Link></section>
    </main></div>
  );
}
