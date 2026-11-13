import React from "react";
import { ArrowRight, BookOpen, Boxes, Gauge, HardHat, Info, MapPin, Rotate3D, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Sipat3DExperience } from "@/components/Sipat3DExperience";
import { RealFactoryPhoto } from "@/components/RealFactoryPhoto";
import { REAL_PHOTOS } from "@/data/realPhotos";

const highlights = [
  { icon: Boxes, title: "Redução simples hipóide", text: "Arquitetura descrita no manual público do diferencial 18X / 18X HD." },
  { icon: Gauge, title: "Aplicação extrapesada", text: "O anúncio brasileiro do MS-18X HD destaca sua aplicação no transporte rodoviário extrapesado." },
  { icon: ShieldCheck, title: "Três apoios do pinhão", text: "Dois rolamentos cônicos e um rolamento cilíndrico, representados no modelo didático." },
  { icon: Wrench, title: "Conjunto soldado", text: "Coroa e caixa dos satélites permanecem unidas, inclusive na vista explodida." },
  { icon: HardHat, title: "Inspeção didática", text: "Explore o interior, os cubos e os freios. O modelo não substitui procedimentos oficiais." },
  { icon: MapPin, title: "Cummins Osasco", text: "A produção local do MS-18X HD em Osasco foi anunciada em 2024, com início previsto para 2025." },
];

const specs = [
  ["Referência", "MS-18X HD — reconstrução visual"],
  ["Arquitetura", "Eixo traseiro de simples redução hipóide"],
  ["Coroa e caixa dos satélites", "Conjunto soldado"],
  ["Apoios do pinhão", "Dois rolamentos cônicos e um cilíndrico"],
  ["Apoios da caixa", "Dois rolamentos cônicos com anéis de ajuste"],
  ["Par de dentes representado", "11 x 37, listado no manual 18X / 18X HD; perfil geométrico aproximado"],
  ["Escala do modelo", "Unidades relativas; sem dimensões de fabricação validadas"],
  ["Componentes catalogados", "57 grupos didáticos, incluindo painéis virtuais de inspeção"],
  ["Uso", "Visualização e aprendizagem; não utilizar para fabricação, dimensionamento ou reparo"],
];

export default function Projeto3D() {
  return <div className="min-h-screen bg-[#0d0f13] text-slate-100"><Navbar /><main>
    <section className="border-b border-white/10 bg-[radial-gradient(circle_at_80%_10%,rgba(218,41,28,.2),transparent_35%),linear-gradient(135deg,#171b24,#0d0f13)] px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="mx-auto max-w-7xl"><div className="v2-kicker flex items-center gap-2"><Rotate3D className="h-3.5 w-3.5" /> CDBS OSASCO / EXPERIÊNCIA TÉCNICA</div><h1 className="mt-4 font-industrial text-5xl uppercase leading-[.92] text-white sm:text-8xl">Projeto<br /><span className="text-[#da291c]">3D.</span></h1><p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">Explore uma reconstrução digital 3D inspirada no eixo Cummins MS-18X HD, com arquitetura baseada no manual público 18X / 18X HD e geometria visual aproximada. Gire, aproxime, consulte mais de 50 componentes catalogados e abra uma vista explodida do conjunto.</p><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-md border border-red-400/30 bg-red-950/30 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-200">MS-18X HD</span><span className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-300">Eixo traseiro simples</span><span className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-300">Treinamento técnico</span></div></div></section>

    <section className="border-b border-white/10 bg-[#12151d] px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex items-center gap-3"><Rotate3D className="h-6 w-6 text-[#da291c]" /><div><div className="v2-kicker">Modelo mecânico reconstruído</div><h2 className="font-industrial text-3xl uppercase text-white">Explore o MS-18X HD</h2></div></div><p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">O eixo é exibido primeiro <b>totalmente montado</b>, em uma apresentação didática do conjunto: a carcaça envolve o diferencial, os semieixos estão instalados e o conjunto do pinhão está conectado à carcaça. O diferencial é modelado como um conjunto mecânico real — caixa, coroa, cruzeta, satélites, planetárias e rolamentos — e não como uma esfera genérica. Só ao clicar em "Exploded view" os componentes se afastam por eixos demonstrativos de montagem, mantendo coroa e caixa soldadas juntas, com animação progressiva e reversível.</p><div className="mt-7"><Sipat3DExperience fullPage /></div></div></section>

    <section className="border-b border-white/10 bg-[#0f1218] px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="v2-kicker">Pontos principais do MS-18X HD</div><h2 className="mt-2 font-industrial text-3xl uppercase text-white">Arquitetura e aplicação</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{highlights.map((item) => <article key={item.title} className="rounded-xl border border-white/10 bg-[#141822] p-5 transition hover:-translate-y-1 hover:border-red-500/50"><item.icon className="h-7 w-7 text-[#da291c]" /><h3 className="mt-7 font-industrial text-xl uppercase text-white">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p></article>)}</div></div></section>

    <section className="border-b border-white/10 bg-[#12151d] px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-amber-400" /><div><div className="v2-kicker">Consulta técnica</div><h2 className="font-industrial text-3xl uppercase text-white">Referências do modelo</h2></div></div><div className="mt-7 overflow-hidden rounded-xl border border-white/10"><div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead className="bg-[#1a202b] text-xs uppercase tracking-wider text-slate-300"><tr><th className="px-5 py-4">Campo</th><th className="px-5 py-4">Informação</th></tr></thead><tbody>{specs.map(([field, value], index) => <tr key={field} className={index % 2 ? "bg-[#141822]" : "bg-[#10141b]"}><th scope="row" className="w-1/3 px-5 py-3 font-semibold text-slate-300">{field}</th><td className="px-5 py-3 leading-relaxed text-slate-400">{value}</td></tr>)}</tbody></table></div></div></div></section>

    <section className="border-b border-white/10 bg-gradient-to-r from-red-950/30 via-[#151922] to-black px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2"><div className="rounded-xl border border-red-400/25 bg-red-950/20 p-6"><div className="flex items-center gap-2 text-red-200"><MapPin className="h-5 w-5" /><h2 className="font-industrial text-2xl uppercase">Contexto brasileiro</h2></div><p className="mt-4 text-sm leading-relaxed text-slate-300">A produção local do MS-18X HD em Osasco foi anunciada pela Cummins em 2024, com início previsto para janeiro de 2025. O anúncio destaca melhorias em coroa, pinhão, rolamentos, satélites e planetárias.</p><p className="mt-4 text-xs leading-relaxed text-slate-400">O anúncio não fornece os desenhos dimensionais necessários para uma reprodução exata de fabricação.</p></div><div className="rounded-xl border border-amber-400/20 bg-amber-950/10 p-6"><div className="flex items-center gap-2 text-amber-200"><Info className="h-5 w-5" /><h2 className="font-industrial text-2xl uppercase">Origem do modelo</h2></div><p className="mt-4 text-sm leading-relaxed text-slate-300">A geometria é uma reconstrução procedural inspirada na família MS-18 e na arquitetura do manual 18X / 18X HD, sem usar fotografias como textura. Os volumes, as medidas e os painéis de inspeção são aproximações didáticas. Para fabricação, continuam sendo necessários desenhos, tolerâncias e especificações oficiais do fabricante.</p></div></div></section>

    <section className="border-b border-white/10 bg-[#10131a] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="v2-kicker">Produto real / referência industrial</div>
          <h2 className="mt-2 font-industrial text-3xl uppercase text-white">Da peça física ao modelo digital</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">A imagem abaixo apresenta um eixo Cummins relacionado à produção local anunciada para Osasco. Ela complementa o modelo 3D didático, que foi reconstruído para permitir a exploração das peças e não usa fotografia como textura.</p>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">A fotografia é uma referência editorial do produto; dimensões, tolerâncias e especificações de fabricação devem sempre ser consultadas nos documentos oficiais do fabricante.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono uppercase text-slate-300">
            <span className="rounded-md border border-white/15 bg-black/40 px-3 py-1.5">Fotografia de referência</span>
            <span className="rounded-md border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-red-200">Produção local anunciada</span>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-red-500/30 bg-gradient-to-b from-[#1c222e] to-[#11151c] p-3 shadow-2xl shadow-black/80">
          <div className="overflow-hidden rounded-xl bg-[#f8f9fb]">
            <img
              src={REAL_PHOTOS.axle.src}
              alt="Eixo Cummins MS-18X HD apresentado como referência de produto relacionado à produção local em Osasco"
              className="aspect-[16/10] w-full object-contain transition duration-500 hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
            <span className="font-semibold text-slate-200">Eixo MS-18X HD • Referência de produto em Osasco</span>
            <a
              href={REAL_PHOTOS.axle.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-red-300 hover:text-white"
            >
              {REAL_PHOTOS.axle.credit} <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <section className="px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="v2-kicker">Fontes técnicas</div><h2 className="mt-2 font-industrial text-3xl uppercase text-white">Consulte as referências</h2><div className="mt-6 grid gap-3 md:grid-cols-3"><a href="https://www.cummins.com/en-na/components/products/drivetrain-systems/axles/single-rear-drive/ms-18" target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-[#141822] p-4 text-sm text-slate-300 hover:border-red-400/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400">Cummins — página oficial da família MS-18 <ArrowRight className="ml-1 inline h-4 w-4" /></a><a href="https://www.meritorbrasil.com.br/materiais/eixo-diferencial/MERITOR_MANUAL_DE_MANUTENCAO_MM_10127_P_DIFERENCIAL_SIMPLES_REDUCAO_V4.pdf" target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-[#141822] p-4 text-sm text-slate-300 hover:border-red-400/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400">Manual público 18X / 18X HD <ArrowRight className="ml-1 inline h-4 w-4" /></a><a href="https://mecanicaonline.com.br/2024/11/cummins-brasil-inicia-producao-local-do-eixo-ms-18x-hd-para-veiculos-extrapesados/" target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-[#141822] p-4 text-sm text-slate-300 hover:border-red-400/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400">Anúncio da produção local MS-18X HD <ArrowRight className="ml-1 inline h-4 w-4" /></a></div><div className="mt-8"><Link href="/jogos" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-300 hover:text-white">Voltar aos desafios <ArrowRight className="h-4 w-4" /></Link></div></div></section>
  </main></div>;
}
