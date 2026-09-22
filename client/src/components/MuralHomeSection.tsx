import React, { useState } from "react";
import { Link } from "wouter";
import {
  Heart,
  HeartHandshake,
  MessageSquareHeart,
  Plus,
  Quote,
  Sparkles,
  ArrowRight,
  Shield,
  Home as HomeIcon,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { MURAL_PROMPTS } from "@shared/muralData";
import { MuralSubmitModal } from "./MuralSubmitModal";
import { Reveal } from "./Reveal";

interface MuralHomeSectionProps {
  onOpenSubmit?: () => void;
}

export function MuralHomeSection({ onOpenSubmit }: MuralHomeSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>("todas");

  const listQuery = trpc.mural.listApproved.useQuery(
    { promptKey: selectedPromptKey, limit: 6 },
    { refetchInterval: 60_000 }
  );

  const featuredQuery = trpc.mural.getFeatured.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const messages = listQuery.data || [];
  const featured = featuredQuery.data;

  const handleOpenSubmit = () => {
    if (onOpenSubmit) onOpenSubmit();
    else setModalOpen(true);
  };

  return (
    <section
      id="mural-voltar-seguro"
      aria-labelledby="mural-home-title"
      className="relative border-b border-white/10 bg-gradient-to-b from-[#0b0e14] via-[#121622] to-[#0d1017] px-4 py-16 sm:px-6 lg:px-8"
    >
      {/* Luz ambiente de acolhimento e calor humano */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-red-600/10 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-10 h-72 w-72 rounded-full bg-amber-500/10 blur-[90px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1440px]">
        <Reveal>
          {/* Transição contextual suave pós Red Flag */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-950/40 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-200">
            <HeartHandshake className="h-4 w-4 text-amber-300" aria-hidden="true" />
            Depois de identificar o risco, lembre-se do motivo para se cuidar
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2
                id="mural-home-title"
                className="font-industrial text-3xl uppercase tracking-tight text-white sm:text-5xl"
              >
                Mural <span className="text-[#ff5548]">Voltar Seguro</span> para Casa
              </h2>
              <p className="mt-2 text-base font-semibold text-amber-200 sm:text-lg">
                Cada pessoa tem um motivo. Compartilhe o seu.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Segurança começa antes do trabalho e continua depois dele. Escreva uma frase para contar por quem você se cuida, qual é o seu motivo para voltar seguro para casa ou que mensagem gostaria de deixar para alguém especial.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleOpenSubmit}
                size="lg"
                className="min-h-12 bg-[#da291c] px-6 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/60 hover:bg-[#b01e12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Deixar minha mensagem
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-h-12 border-white/20 bg-white/5 px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
              >
                <Link href="/mural">
                  Ver mural completo
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Motivo em destaque (Seção 9 do prompt) */}
        {featured && (
          <div className="mt-10">
            <Reveal delay={80}>
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-[#1c1815] via-[#1a1f2c] to-[#161a24] p-6 shadow-2xl sm:p-8">
                <div
                  className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-amber-400/10 blur-3xl"
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-amber-300">
                  <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <span>Motivo em destaque da fábrica</span>
                </div>

                <div className="mt-4 flex items-start gap-4">
                  <Quote className="h-10 w-10 shrink-0 text-amber-400/60 rotate-180" aria-hidden="true" />
                  <div className="space-y-3">
                    <p className="font-industrial text-xl uppercase leading-snug text-white sm:text-2xl lg:text-3xl">
                      “{featured.message}”
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-semibold text-amber-200">
                        {featured.isAnonymous ? "— Participante anônimo" : `— ${featured.publicName}`}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[10px] text-slate-400">
                        Pergunta: {featured.promptText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* Filtros por pergunta orientadora */}
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-xs text-slate-400 uppercase">
            <Filter className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> Filtrar frases:
          </span>
          <button
            type="button"
            onClick={() => setSelectedPromptKey("todas")}
            className={`min-h-[44px] rounded-xl px-3.5 text-xs font-bold transition ${
              selectedPromptKey === "todas"
                ? "bg-[#da291c] text-white shadow-md shadow-red-950/40"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            Todas as mensagens
          </button>
          {MURAL_PROMPTS.slice(0, 4).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setSelectedPromptKey(p.key)}
              className={`min-h-[44px] rounded-xl px-3.5 text-xs font-semibold transition ${
                selectedPromptKey === p.key
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {p.question}
            </button>
          ))}
        </div>

        {/* Grade de cartões de mensagens aprovadas */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {messages.map((item, index) => (
            <article
              key={item.id}
              className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 ${
                item.isFeatured
                  ? "border-amber-400/40 bg-[#161a24] ring-1 ring-amber-400/20"
                  : "border-white/10 bg-[#121620] hover:border-red-400/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    <Heart className="h-3 w-3 text-red-400" aria-hidden="true" />
                    {item.promptText}
                  </span>
                  {item.isFeatured && (
                    <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                      Destaque
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-100 sm:text-base">
                  “{item.message}”
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  {item.isAnonymous ? "— Colaborador anônimo" : `— ${item.publicName}`}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {new Date(item.submittedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </article>
          ))}
        </div>

        {messages.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
            <MessageSquareHeart className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-300">
              As primeiras mensagens estão sendo preparadas. Deixe a sua e ajude a construir este mural.
            </p>
            <Button
              type="button"
              onClick={handleOpenSubmit}
              className="mt-4 bg-[#da291c] text-xs font-bold uppercase text-white hover:bg-[#b01e12]"
            >
              Deixar a primeira mensagem
            </Button>
          </div>
        )}

        {/* Rodapé da seção chamando para os desafios */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 p-5 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-950/60 border border-red-500/30 text-red-300">
              <HomeIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <strong className="block text-sm uppercase text-white">
                Trabalhar com segurança é uma forma de voltar para quem importa.
              </strong>
              <p className="text-xs text-slate-400">
                Agora que você lembrou do seu motivo, treine suas atitudes na Central de Jogos.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="w-full sm:w-auto bg-[#da291c] text-xs font-black uppercase text-white hover:bg-[#b01e12]"
          >
            <a href="#central-jogos">
              Ir para os jogos
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      <MuralSubmitModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmitted={() => {
          listQuery.refetch();
          featuredQuery.refetch();
        }}
      />
    </section>
  );
}
