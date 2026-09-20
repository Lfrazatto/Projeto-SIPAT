import React from "react";
import { Link } from "wouter";
import { ArrowRight, Building2, Factory, Gauge, History, ShieldCheck, Wrench, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { IndustrialScene } from "@/components/IndustrialScene";

const milestones = [
  { year: "1944", title: "Origem industrial", text: "A história está associada à Cobrasma, criada para atender à expansão das ferrovias no Brasil e que mais tarde direcionou parte de sua estrutura ao setor automotivo." },
  { year: "1956", title: "A origem dos eixos", text: "Em 16 de julho, nasceu a Oficina de Peças para Automóveis, precursora da atual operação de eixos da Cummins em Osasco." },
  { year: "1957", title: "Cobrasma Rockwell Eixos", text: "A operação recebeu o nome Cresa e se consolidou na fabricação de componentes, incluindo eixos dianteiros e traseiros para a indústria automobilística." },
  { year: "Décadas seguintes", title: "Rockwell, Meritor e evolução", text: "A trajetória passou por Braseixos, Rockwell, ArvinMeritor e Meritor, mantendo a especialização em eixos e sistemas para veículos comerciais." },
  { year: "2022", title: "Integração à Cummins", text: "A Cummins concluiu a aquisição global da Meritor em agosto de 2022, incorporando pessoas, produtos e capacidades de eixos, freios, mobilidade e powertrain elétrico." },
  { year: "2026", title: "70 anos de operação", text: "A operação de eixos em Osasco completa 70 anos e entra em uma nova etapa, conectada à rede global de tecnologia e desenvolvimento da Cummins." },
];

const products = [
  { icon: Gauge, title: "Eixos", text: "Soluções de eixos para aplicações de veículos comerciais, industriais e fora de estrada." },
  { icon: Wrench, title: "Freios e componentes", text: "Componentes de mobilidade e frenagem para aplicações que exigem confiabilidade." },
  { icon: Zap, title: "Drivetrain", text: "Sistemas de transmissão que levam a potência do motor até os eixos e permitem o movimento do veículo." },
  { icon: Factory, title: "Tecnologia e manufatura", text: "Uma operação industrial conectada à engenharia, qualidade e inovação da Cummins." },
];

export default function Sobre() {
  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#161a24] to-[#0d0f13] px-4 py-14 sm:px-6 lg:px-8">
          <div className="absolute inset-0 industrial-grid-bg opacity-20" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_.9fr]">
            <div>
              <div className="v2-kicker inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-[#da291c]" /> CDBS / OSASCO / SÃO PAULO</div>
              <h1 className="mt-4 font-industrial text-5xl uppercase leading-none text-white sm:text-7xl">Conheça a<br /><span className="text-[#da291c]">CDBS.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">CDBS significa <strong className="text-white">Cummins Drivetrain and Braking Systems</strong>. É a divisão da Cummins que reúne soluções de eixos, freios, suspensões, linhas de transmissão e peças para aplicações de veículos comerciais e industriais.</p>
              <div className="mt-6 flex flex-wrap gap-3"><Button asChild className="bg-[#da291c] font-bold uppercase"><Link href="/jogos">Participar da SIPATMA <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline" className="border-white/20 text-slate-200"><a href="https://www.cummins.com/pt-br/components/drivetrain-systems" target="_blank" rel="noreferrer">Ver referência oficial</a></Button></div>
            </div>
            <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-white/10"><IndustrialScene variant="operations" label="Ilustração da operação industrial CDBS em Osasco" className="absolute inset-0 h-full w-full" /><div className="absolute inset-0 bg-gradient-to-t from-[#0d0f13] via-transparent to-transparent" /><div className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-widest text-amber-300">Operação CDBS / Osasco</div></div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#12151d] px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-8 flex items-center gap-3"><History className="h-6 w-6 text-[#da291c]" /><div><div className="v2-kicker">Nossa história</div><h2 className="font-industrial text-3xl uppercase text-white">História + tecnologia + pessoas</h2></div></div><p className="mb-8 max-w-3xl text-sm leading-relaxed text-slate-300">Em uma operação industrial com décadas de história, evolução também significa aprender continuamente e buscar formas cada vez melhores de trabalhar com segurança.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{milestones.map((item) => <article key={item.year} className="relative rounded-xl border border-white/10 bg-[#141822] p-5"><div className="font-industrial text-3xl text-[#da291c]">{item.year}</div><h3 className="mt-4 font-industrial text-lg uppercase text-white">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{item.text}</p></article>)}</div><div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-100">A sequência histórica é apresentada de forma resumida com base em fontes públicas: Cobrasma, Cresa/Braseixos, Rockwell, ArvinMeritor/Meritor e, desde 2022, Cummins.</div></div></section>

        <section className="border-b border-white/10 bg-[#0f1218] px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="grid items-center gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><div className="v2-kicker">A Cummins no Brasil</div><h2 className="mt-2 font-industrial text-3xl uppercase text-white">Uma presença conectada à operação de Osasco</h2><p className="mt-4 text-sm leading-relaxed text-slate-300">A Cummins está presente no Brasil desde o início da década de 1970 e reúne operações industriais e soluções de energia, motores, componentes e serviços. Em Osasco, a CDBS concentra a operação relacionada a eixos, cardans e componentes para veículos comerciais e aplicações fora de estrada.</p><a href="https://www.cummins.com/en-na/br/quem-somos/nossa-historia" target="_blank" rel="noreferrer" className="mt-5 inline-flex text-xs font-bold uppercase tracking-wider text-[#da291c] hover:text-white">Conhecer a história da Cummins Brasil <ArrowRight className="ml-2 h-4 w-4" /></a></div><div className="overflow-hidden rounded-2xl border border-white/10"><IndustrialScene variant="assembly" label="Ilustração da manufatura de eixos na operação CDBS" className="h-64 w-full" /></div></div></div></section>

        <section className="border-b border-white/10 bg-[#12151d] px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="v2-kicker">De Meritor para Cummins</div><h2 className="mt-2 font-industrial text-3xl uppercase text-white">Uma integração de competências</h2><p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300">A história da operação de Osasco também está diretamente relacionada à trajetória da Meritor. Em 2022, a Cummins concluiu a aquisição global da Meritor, reunindo competências e tecnologias complementares em componentes, drivetrain, sistemas de frenagem e soluções para veículos comerciais.</p><div className="mt-8 grid gap-3 md:grid-cols-4">{["Meritor", "Aquisição pela Cummins", "CDBS", "Tecnologia + Engenharia + Produção"].map((label, index) => <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4"><span className="font-mono text-sm text-[#da291c]">0{index + 1}</span><span className="font-industrial text-sm uppercase text-white">{label}</span></div>)}</div></div></section>

        <section className="border-b border-white/10 bg-[#0f1218] px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="v2-kicker">O que a divisão entrega</div><h2 className="mt-2 font-industrial text-3xl uppercase text-white">Soluções que conectam potência e movimento</h2><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((item) => <article key={item.title} className="rounded-xl border border-white/10 bg-black/30 p-5 transition hover:border-[#da291c]/60"><item.icon className="h-7 w-7 text-[#da291c]" /><h3 className="mt-8 font-industrial text-xl uppercase text-white">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{item.text}</p></article>)}</div></div></section>

        <section className="border-b border-white/10 bg-gradient-to-r from-red-950/40 via-[#151922] to-black px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2"><div><div className="v2-kicker">Tecnologia aplicada à segurança</div><h2 className="mt-2 font-industrial text-4xl uppercase text-white">A unidade muda.<br /><span className="text-[#da291c]">O cuidado permanece.</span></h2><p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300">A SIPATMA conecta a história da operação, a evolução tecnológica e as atitudes de quem trabalha na CDBS. Segurança aparece na circulação, na manutenção, na montagem, na logística e em cada decisão do turno.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="overflow-hidden rounded-xl border border-white/10"><IndustrialScene variant="safety" label="Ilustração de cuidado ativo em uma linha industrial" className="h-44 w-full" /></div><div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#141822] p-5 text-center"><div><ShieldCheck className="mx-auto h-8 w-8 text-emerald-400" /><div className="mt-3 font-industrial text-lg uppercase text-white">Cuidado ativo</div><div className="mt-1 text-xs text-slate-400">Tecnologia, pessoas e prevenção.</div></div></div></div></div></section>
        <section className="px-4 py-8 text-center sm:px-6 lg:px-8"><p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Fontes de referência: Cummins Drivetrain and Braking Systems; Cummins, conclusão da aquisição da Meritor (03 ago. 2022); Canal Diesel e AutoData, operação de eixos aos 70 anos (28 ago. 2026).</p></section>
      </main>
    </div>
  );
}
