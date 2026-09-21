import React from "react";
import { ArrowRight, Code2, ExternalLink, Gamepad2, GraduationCap, Linkedin, Mail, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const pillars = [
  { icon: Gamepad2, title: "Jogos e desafios", text: "Desafios transformam conceitos de segurança, ergonomia e prevenção em decisões práticas e interativas." },
  { icon: GraduationCap, title: "Aprendizado", text: "Quizzes, explicações e feedback ajudam a fixar o conteúdo e conectar conhecimento com atitudes no dia a dia." },
  { icon: ShieldCheck, title: "Segurança e ergonomia", text: "A experiência aborda situações de trabalho seguro, percepção de riscos, ergonomia e melhoria contínua." },
  { icon: Code2, title: "Ranking e progresso", text: "Cada participante acompanha sua evolução, pontuação e desempenho nos desafios da SIPAT." },
];

const creators = [
  { name: "Ryan Neiva", email: "ryanneiva80@gmail.com", linkedin: "https://www.linkedin.com/in/ryan-neiva" },
  { name: "Leonardo Frazatto", email: "lmpfrazatto@gmail.com", linkedin: "https://www.linkedin.com/in/leonardo-machado-pereira-fraza" },
  { name: "Matheus Felipe", email: "matheusfelipedasferreira@gmail.com" },
];

export default function NossoProjeto() {
  return <div className="min-h-screen bg-[#0d0f13] text-slate-100">
    <Navbar />
    <main>
      <section className="border-b border-white/10 bg-gradient-to-b from-[#161a24] to-[#0d0f13] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="v2-kicker">SIPAT CUMMINS CDBS / PROJETO DIGITAL</div>
          <h1 className="mt-3 font-industrial text-6xl uppercase leading-none text-white sm:text-8xl">Nosso<br /><span className="text-[#da291c]">projeto.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">Esta plataforma foi desenvolvida para tornar a SIPAT da Cummins CDBS Osasco mais interativa, conectando tecnologia, gamificação, quizzes, desafios, aprendizado, participação e segurança.</p>
          <div className="mt-7"><Button asChild className="bg-[#da291c] font-bold uppercase"><Link href="/jogos">Conhecer os desafios <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#12151d] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-amber-400" /><div><div className="v2-kicker">Sobre o projeto</div><h2 className="font-industrial text-3xl uppercase text-white">Do conhecimento à atitude</h2></div></div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300">A SIPAT é um momento de conscientização, troca e aprendizado sobre segurança e saúde no trabalho. Aqui, a proposta ganha uma experiência digital que convida os colaboradores a participar, testar conhecimentos e reconhecer situações importantes para uma rotina mais segura.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{pillars.map((item) => <article key={item.title} className="rounded-xl border border-white/10 bg-[#141822] p-6 transition hover:-translate-y-1 hover:border-red-500/50"><item.icon className="h-7 w-7 text-[#da291c]" /><h3 className="mt-10 font-industrial text-xl uppercase text-white">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p></article>)}</div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-gradient-to-r from-red-950/30 via-[#151922] to-black px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2"><div><div className="v2-kicker">Desenvolvido para a realidade CDBS</div><h2 className="mt-2 font-industrial text-4xl uppercase text-white">Tecnologia que aproxima.<br /><span className="text-[#da291c]">Segurança que permanece.</span></h2><p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300">O projeto valoriza a operação de Osasco com conteúdos educativos, interface responsiva e desafios que estimulam a observação, a reflexão e a participação.</p></div><div className="rounded-xl border border-white/10 bg-[#141822] p-6"><ShieldCheck className="h-8 w-8 text-emerald-400" /><h3 className="mt-4 font-industrial text-2xl uppercase text-white">Uma jornada completa</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">Explore os jogos, responda aos quizzes, acompanhe seu ranking e veja seu progresso na plataforma.</p><Link href="/jogos" className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-300 hover:text-white">Começar jornada <ArrowRight className="h-4 w-4" /></Link></div></div></section>

      <section id="turma-do-projeto" className="scroll-mt-20 border-b border-white/10 bg-[#10131a] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div><div className="v2-kicker flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Turma do projeto / comunidade</div><h2 className="mt-3 font-industrial text-5xl uppercase leading-[.95] text-white sm:text-7xl">Quem criou<br /><span className="text-[#da291c]">esta ideia.</span></h2><p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300">Este projeto foi criado com o objetivo de tornar a SIPAT da Cummins Osasco mais interativa, educativa e conectada à realidade dos colaboradores.</p></div>
            <figure className="overflow-hidden rounded-2xl border border-white/15 bg-black/30 shadow-2xl shadow-black/40"><img src="/manus-storage/equipe-projeto-sipat_40beafdf.jpg" alt="Equipe do projeto SIPAT reunida em uma sala, com os integrantes do grupo lado a lado diante da lousa" className="aspect-video w-full object-cover object-center" loading="lazy" /><figcaption className="border-t border-white/10 bg-[#141822] px-4 py-3 text-xs leading-relaxed text-slate-400">Equipe do projeto reunida: uma construção coletiva de aprendizado, tecnologia e segurança.</figcaption></figure>
          </div>

          <div className="mt-14"><div className="v2-kicker">Principais criadores</div><p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">Leonardo Frazatto, Matheus Felipe e Ryan Neiva foram os principais criadores do projeto, responsáveis pela idealização, organização e desenvolvimento da proposta.</p><div className="mt-7 grid gap-4 md:grid-cols-3">{creators.map((creator, index) => <article key={creator.name} className="relative overflow-hidden rounded-xl border border-white/10 bg-[#171b24] p-6 transition hover:-translate-y-1 hover:border-red-500/50"><span className="absolute right-4 top-4 font-mono text-xs text-red-400/70">0{index + 1}</span><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-950/50 text-[#da291c]"><Users className="h-5 w-5" /></div><h3 className="mt-8 font-industrial text-2xl uppercase text-white">{creator.name}</h3><p className="mt-2 text-xs uppercase tracking-widest text-slate-500">Criador do projeto</p><div className="mt-6 flex flex-wrap gap-2"><a href={`mailto:${creator.email}`} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs text-slate-300 transition hover:border-red-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"><Mail className="h-3.5 w-3.5 text-red-400" /> E-mail</a>{creator.linkedin && <a href={creator.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs text-slate-300 transition hover:border-[#0a66c2] hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"><Linkedin className="h-3.5 w-3.5 text-[#6fa8dc]" /> LinkedIn <ExternalLink className="h-3 w-3" /></a>}</div></article>)}</div></div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><div className="v2-kicker">Colaboradores e apoiadores</div><h3 className="mt-2 font-industrial text-3xl uppercase text-white">Uma construção coletiva</h3></div><div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-6"><p className="text-base leading-relaxed text-slate-300">Os demais integrantes da turma contribuíram como colaboradores e apoiadores, trazendo ideias, sugestões e melhorias que ajudaram a fortalecer o projeto.</p></div></div>

          <div className="mt-10 rounded-2xl border border-[#da291c]/40 bg-gradient-to-br from-red-950/40 to-[#171b24] p-8 text-center sm:p-10"><ShieldCheck className="mx-auto h-7 w-7 text-red-300" /><h3 className="mt-4 font-industrial text-3xl uppercase text-white">Agradecimento final</h3><p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300">Cada contribuição foi importante para transformar esta ideia em uma experiência de aprendizado, segurança e trabalho em equipe.</p></div>

          <div className="mt-14"><div className="v2-kicker">Contato dos criadores</div><h3 className="mt-2 font-industrial text-3xl uppercase text-white">Conecte-se com a equipe</h3><div className="mt-7 grid gap-4 md:grid-cols-3">{creators.map((creator) => <article key={`${creator.name}-contact`} className="rounded-xl border border-white/10 bg-[#171b24] p-5"><h4 className="font-industrial text-xl uppercase text-white">{creator.name}</h4><div className="mt-5 flex flex-wrap gap-2"><a href={`mailto:${creator.email}`} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs text-slate-300 hover:border-red-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"><Mail className="h-3.5 w-3.5 text-red-400" /> E-mail</a>{creator.linkedin && <a href={creator.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs text-slate-300 hover:border-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"><Linkedin className="h-3.5 w-3.5 text-blue-300" /> LinkedIn <ExternalLink className="h-3 w-3" /></a>}</div></article>)}</div></div>
        </div>
      </section>

      <section className="px-4 py-10 text-center sm:px-6 lg:px-8"><p className="text-xs leading-relaxed text-slate-500">Uma experiência educativa construída para aproximar pessoas, conhecimento e segurança na SIPAT Cummins CDBS Osasco.</p></section>
    </main>
  </div>;
}
