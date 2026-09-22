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
  Filter,
  Users,
  Search,
  Home as HomeIcon,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { MURAL_PROMPTS } from "@shared/muralData";
import { MuralSubmitModal } from "@/components/MuralSubmitModal";
import { Reveal } from "@/components/Reveal";

export default function Mural() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayLimit, setDisplayLimit] = useState(24);

  const listQuery = trpc.mural.listApproved.useQuery(
    { promptKey: selectedPromptKey, limit: 100 },
    { refetchInterval: 60_000 }
  );

  const featuredQuery = trpc.mural.getFeatured.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const allApproved = listQuery.data || [];
  const featured = featuredQuery.data;

  // Filtragem local por busca rápida de palavras-chave
  const filteredMessages = allApproved.filter((msg) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      msg.message.toLowerCase().includes(term) ||
      (msg.publicName && msg.publicName.toLowerCase().includes(term)) ||
      msg.promptText.toLowerCase().includes(term)
    );
  });

  const visibleMessages = filteredMessages.slice(0, displayLimit);
  const hasMore = filteredMessages.length > displayLimit;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Topo Institucional / Emocional */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#191e2b] via-[#11151f] to-[#0b0e14] px-4 py-14 sm:px-6 lg:px-8">
          <div
            className="pointer-events-none absolute top-0 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-[1440px]">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-950/40 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-amber-200">
                <HeartHandshake className="h-4 w-4 text-amber-300" aria-hidden="true" />
                Espaço Colaborativo • SIPAT Cummins Osasco
              </div>

              <h1 className="mt-4 font-industrial text-4xl uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">
                Mural <span className="text-[#ff5548]">Voltar Seguro</span> para Casa
              </h1>

              <p className="mt-4 max-w-3xl font-industrial text-xl uppercase tracking-wide text-amber-200 sm:text-2xl">
                Cada pessoa tem um motivo. Compartilhe o seu.
              </p>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Segurança não é apenas um procedimento técnico ou um indicador da fábrica. Ela está relacionada às pessoas, aos sonhos, às famílias e a quem espera por cada um no final do turno. Leia as mensagens dos colegas ou deixe a sua.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  size="lg"
                  className="min-h-14 bg-[#da291c] px-7 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-red-950/60 hover:bg-[#b01e12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
                  Deixar minha mensagem
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-h-14 border-white/20 bg-white/5 px-6 text-xs font-bold uppercase text-white hover:bg-white/10"
                >
                  <Link href="/jogos">
                    Ir para os desafios
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Motivo em destaque */}
        {featured && (
          <section className="border-b border-white/10 bg-[#0d1017] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1440px]">
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-[#1c1815] via-[#161a24] to-[#12151e] p-6 shadow-xl sm:p-8">
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-amber-300">
                  <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <span>Motivo em destaque</span>
                </div>
                <div className="mt-4 flex items-start gap-4">
                  <Quote className="h-10 w-10 shrink-0 text-amber-400/50 rotate-180" aria-hidden="true" />
                  <div>
                    <p className="font-industrial text-xl uppercase leading-snug text-white sm:text-2xl lg:text-3xl">
                      “{featured.message}”
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-semibold text-amber-200">
                        {featured.isAnonymous ? "— Colaborador anônimo" : `— ${featured.publicName}`}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[10px] text-slate-400">
                        Tema: {featured.promptText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filtros e Busca */}
        <section className="border-b border-white/10 bg-[#10141d] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px] space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Barra de busca */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input
                  type="search"
                  placeholder="Pesquisar frases ou palavras-chave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/40 border-white/15 text-white text-xs h-11 rounded-xl"
                />
              </div>

              {/* Contador */}
              <div className="text-xs font-mono text-slate-400 text-right">
                Exibindo <strong className="text-white">{visibleMessages.length}</strong> de{" "}
                <strong className="text-amber-300">{filteredMessages.length}</strong> mensagens aprovadas
              </div>
            </div>

            {/* Pílulas de filtro por pergunta */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPromptKey("todas")}
                className={`min-h-[44px] rounded-xl px-4 text-xs font-bold transition ${
                  selectedPromptKey === "todas"
                    ? "bg-[#da291c] text-white shadow-md shadow-red-950/40"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Todas ({allApproved.length})
              </button>
              {MURAL_PROMPTS.map((p) => {
                const count = allApproved.filter((m) => m.promptKey === p.key).length;
                return (
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
                    {p.question} {count > 0 ? `(${count})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Grade principal de mensagens */}
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            {visibleMessages.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleMessages.map((item) => (
                  <article
                    key={item.id}
                    className={`flex flex-col justify-between rounded-2xl border p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 ${
                      item.isFeatured
                        ? "border-amber-400/50 bg-[#161a25] ring-1 ring-amber-400/20"
                        : "border-white/10 bg-[#121622] hover:border-red-400/40"
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

                      <p className="mt-4 text-base font-medium leading-relaxed text-slate-100">
                        “{item.message}”
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-400">
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
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-12 text-center max-w-xl mx-auto">
                <MessageSquareHeart className="mx-auto h-10 w-10 text-slate-500" aria-hidden="true" />
                <h3 className="mt-4 font-industrial text-xl uppercase text-white">
                  Nenhuma mensagem encontrada
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {searchTerm
                    ? "Tente buscar com outro termo ou limpar os filtros para ver todas as frases."
                    : "As primeiras mensagens deste tema estão sendo preparadas. Deixe a sua e inspire seus colegas!"}
                </p>
                <Button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-6 bg-[#da291c] hover:bg-[#b01e12] text-white text-xs font-bold uppercase min-h-11 px-6"
                >
                  Deixar minha mensagem
                </Button>
              </div>
            )}

            {/* Botão Carregar Mais se houver mais mensagens */}
            {hasMore && (
              <div className="mt-10 text-center">
                <Button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 24)}
                  variant="outline"
                  className="min-h-12 border-white/20 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 px-8"
                >
                  Carregar mais frases ({filteredMessages.length - visibleMessages.length} restantes)
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <MuralSubmitModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmitted={() => {
          listQuery.refetch();
          featuredQuery.refetch();
        }}
      />
    </div>
  );
}
