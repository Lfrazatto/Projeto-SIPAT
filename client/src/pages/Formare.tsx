import { ArrowRight, BookOpen, BriefcaseBusiness, HeartHandshake, Lightbulb, Users } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const strengths = [
  { icon: BookOpen, title: "Aprendizagem", text: "Combina conhecimentos básicos, técnicos e experiências práticas relacionadas ao mundo do trabalho." },
  { icon: Users, title: "Desenvolvimento pessoal", text: "Estimula responsabilidade, comunicação, organização, colaboração e autonomia em uma jornada de crescimento." },
  { icon: BriefcaseBusiness, title: "Preparação profissional", text: "Aproxima os jovens de áreas, profissionais e rotinas de uma empresa, sem reduzir a formação a um único conteúdo técnico." },
  { icon: HeartHandshake, title: "Oportunidade", text: "Cria espaço para ampliar conhecimentos, reconhecer possibilidades e construir novas perspectivas para o futuro." },
];

const transformations = [
  "Acreditar mais no próprio potencial.",
  "Desenvolver autonomia e responsabilidade.",
  "Conhecer novas áreas profissionais.",
  "Aprender a trabalhar em equipe.",
  "Melhorar a comunicação e a organização.",
  "Ampliar objetivos pessoais e possibilidades de carreira.",
  "Construir experiências para o futuro por meio da educação.",
];

export default function Formare() {
  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100">
      <Navbar />
      <main>
        <section className="border-b border-white/10 bg-gradient-to-br from-red-950/50 via-[#151922] to-[#0d0f13] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="v2-kicker flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-amber-300" aria-hidden="true" /> Educação, formação e futuro</div>
            <h1 className="mt-4 max-w-4xl font-industrial text-5xl uppercase leading-[.95] text-white sm:text-8xl">Somos do <span className="text-[#da291c]">Formare.</span></h1>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-slate-200">Este projeto foi desenvolvido por alunos do Formare dentro da Cummins de Osasco. O Formare oferece formação profissional, desenvolvimento pessoal e preparação para o mundo do trabalho, criando oportunidades para que jovens ampliem conhecimentos, desenvolvam novas habilidades e construam novas possibilidades para o futuro.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild className="bg-[#da291c] font-bold uppercase text-white hover:bg-[#b01e12]"><Link href="/nosso-projeto">Conhecer nosso projeto <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10"><a href="https://fiochpe.org.br/formare/" target="_blank" rel="noreferrer">Conhecer o Formare</a></Button></div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#12151d] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><div className="v2-kicker">O que é o Formare</div><h2 className="mt-2 font-industrial text-4xl uppercase text-white">Formação que combina conhecimento e experiência</h2><p className="mt-5 text-sm leading-relaxed text-slate-300">Segundo a Fundação Iochpe, o Formare é um programa de qualificação profissional para jovens em situação de vulnerabilidade econômica e social. A proposta combina aprendizagem, desenvolvimento pessoal e preparação profissional, com contato com conhecimentos técnicos e experiências do ambiente de trabalho.</p><p className="mt-4 text-sm leading-relaxed text-slate-300">Na experiência vivida em Osasco, essa formação também aproxima os alunos de profissionais, áreas e rotinas de uma grande empresa. O resultado não é apenas aprender uma profissão: é exercitar responsabilidade, colaboração, comunicação e visão de futuro.</p></div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{strengths.map((item) => <article key={item.title} className="rounded-2xl border border-white/10 bg-[#141822] p-6 transition hover:-translate-y-1 hover:border-amber-300/50"><item.icon className="h-8 w-8 text-amber-300" aria-hidden="true" /><h3 className="mt-6 font-industrial text-xl uppercase text-white">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p></article>)}</div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0f1218] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><div className="v2-kicker flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-300" aria-hidden="true" /> Impacto humano</div><h2 className="mt-2 font-industrial text-4xl uppercase text-white">Uma oportunidade que transforma futuros</h2><p className="mt-5 text-sm leading-relaxed text-slate-300">O impacto de uma formação não cabe em um único número. Ele aparece quando um jovem passa a reconhecer o próprio potencial, participa de uma equipe, descobre novas áreas e enxerga caminhos que antes pareciam distantes.</p></div><div className="grid gap-3 sm:grid-cols-2">{transformations.map((item, index) => <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/25 p-4"><span className="font-mono text-xs font-bold text-[#da291c]">0{index + 1}</span><p className="text-sm leading-relaxed text-slate-200">{item}</p></div>)}</div></div>
        </section>

        <section className="border-b border-white/10 bg-[#12151d] px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl rounded-2xl border border-amber-400/30 bg-amber-950/15 p-6 sm:p-8"><h2 className="font-industrial text-2xl uppercase text-white">Conteúdo responsável</h2><p className="mt-3 text-sm leading-relaxed text-slate-300">Esta página usa informações institucionais da Fundação Iochpe e da Cummins. Duração de turmas, número de vagas, benefícios, certificações, contratação e resultados devem ser confirmados com os responsáveis oficiais antes de serem divulgados como informação atual.</p><div className="mt-5 flex flex-wrap gap-4 text-xs font-bold"><a href="https://fiochpe.org.br/formare/" target="_blank" rel="noreferrer" className="text-amber-300 hover:text-white">Fonte: Fundação Iochpe <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></a><a href="https://www.cummins.com/sites/default/files/2024-09/cummins-gender-equality-report-pt.pdf" target="_blank" rel="noreferrer" className="text-amber-300 hover:text-white">Fonte: relatório Cummins <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></a></div></div></section>
      </main>
    </div>
  );
}
