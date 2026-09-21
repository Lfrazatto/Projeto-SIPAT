import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { 
  Trophy, 
  Search, 
  Filter, 
  Medal, 
  CheckCircle2, 
  ArrowUpDown, 
  Sparkles,
  ShieldAlert,
  Leaf,
  Eye,
  SlidersHorizontal,
  Flame,
  UserCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParticipant } from "@/contexts/ParticipantContext";
import { AnimatedNumber } from "@/components/AnimatedNumber";

export default function Ranking() {
  const { participant } = useParticipant();
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState<"geral" | "quiz_seguranca" | "quiz_ergonomia" | "ache_o_erro" | "organize_a_fabrica">("geral");
  const [sortBy, setSortBy] = useState<"highest" | "lowest" | "recent">("highest");
  const [participantType, setParticipantType] = useState<"todos" | "cummins" | "terceiro" | "visitante">("todos");

  const rankingQuery = trpc.ranking.list.useQuery({
    gameFilter,
    sortBy,
    participantType,
  });

  const participantProgressQuery = trpc.participant.getProgress.useQuery(
    { wwid: participant?.wwid || "" },
    { enabled: Boolean(participant?.wwid), refetchInterval: 30_000 }
  );

  const searchQuery = trpc.ranking.search.useQuery(
    { term: searchTerm },
    { enabled: searchTerm.trim().length >= 2 }
  );

  const list = rankingQuery.data || [];
  const top1 = list[0];
  const top2 = list[1];
  const top3 = list[2];

  const searchResult = searchQuery.data;
  const participantProgress = participantProgressQuery.data;
  const participantRank = participantProgress?.rank || 0;
  const nextRow = participantRank > 1 ? list.find((row) => row.rank === participantRank - 1) : undefined;
  const pointsToNext = nextRow && participantProgress?.participant ? Math.max(0, nextRow.totalScore - (participantProgress.participant.totalScore || 0)) : null;

  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
      <Navbar />

      {/* Header section */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#161a24] to-[#0f1218] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="v2-kicker inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/80 px-3 py-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>V3.0 • CLASSIFICAÇÃO PÚBLICA OFICIAL</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-industrial uppercase tracking-tight text-white">
            RANKING <span className="text-[#da291c]">GERAL</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Acompanhe a evolução da comunidade Cummins. O total considera a melhor pontuação obtida em cada um dos quatro desafios.
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] font-mono text-slate-400">
            <span>Atualização: {rankingQuery.dataUpdatedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(rankingQuery.dataUpdatedAt)) : "carregando"}</span>
            <span className="text-slate-500">•</span>
            <span>Ranking geral = melhor resultado de cada desafio, sem somar tentativas repetidas.</span>
          </div>
          {participant ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-400/35 bg-amber-950/25 p-4 sm:flex-row sm:items-center sm:justify-between" role="status" aria-live="polite">
              <div className="flex items-center gap-3"><Medal className="h-6 w-6 text-amber-300" aria-hidden="true" /><div><strong className="block text-sm text-white">{participantRank ? `Você está em ${participantRank}º lugar.` : "Participe dos desafios para aparecer no ranking."}</strong><span className="text-xs text-slate-300">{participantRank === 1 ? "Você está na liderança. Continue cuidando da sua pontuação." : pointsToNext !== null ? `Faltam ${pointsToNext} pontos para alcançar a próxima posição.` : "Complete os desafios para acompanhar sua evolução."}</span></div></div>
              <Link href="/meu-progresso" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 text-xs font-black uppercase text-slate-950 hover:bg-amber-300">Ver meu progresso <ArrowUpDown className="h-4 w-4 rotate-90" aria-hidden="true" /></Link>
            </div>
          ) : <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-slate-300"><strong className="text-white">Participe dos desafios para aparecer no ranking.</strong> Identifique-se e conclua os jogos para acompanhar sua posição.</div>}
        </div>
      </section>

      {/* SECTION 22: TOP 3 PODIUM DISPLAY */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-[#12151e]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black font-industrial uppercase text-white flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              TOP 3 SIPAT
            </h2>
            <p className="text-xs text-slate-400">Líderes de Segurança e Prevenção</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
            {/* 2º LUGAR */}
            <div className="ranking-podium ranking-podium-second p-5 rounded-2xl bg-[#151822] border border-slate-400/30 flex flex-col items-center text-center order-2 md:order-1 relative overflow-hidden shadow-xl md:h-64 justify-between">
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center text-slate-200 text-xl font-black font-industrial">
                <Medal className="h-6 w-6 text-slate-200" />
              </div>
              <div className="space-y-1 my-2">
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase">2º LUGAR</span>
                <h3 className="font-bold text-base text-white truncate max-w-[180px]">
                  {top2 ? top2.name : "Aguardando"}
                </h3>
                <div className="text-[11px] text-slate-400 font-mono">
                  {top2 ? `Identificador: ${top2.identifier}` : "—"}
                </div>
              </div>
              <div className="w-full py-2 rounded bg-black/40 border border-white/10 font-black font-industrial text-xl text-slate-200">
                <AnimatedNumber value={top2?.totalScore || 0} suffix=" pts" />
              </div>
            </div>

            {/* 1º LUGAR (CENTRAL, HIGHER) */}
            <div className="ranking-podium ranking-podium-first p-6 rounded-2xl bg-gradient-to-b from-amber-500/20 via-[#161a26] to-[#11131a] border-2 border-amber-400/80 flex flex-col items-center text-center order-1 md:order-2 relative overflow-hidden shadow-2xl md:h-76 justify-between scale-105 z-10">
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-400" />
              <div className="w-16 h-16 rounded-full bg-amber-500/30 border-2 border-amber-300 flex items-center justify-center text-amber-300 text-3xl font-black font-industrial shadow-lg">
                <Medal className="h-8 w-8 text-amber-300" />
              </div>
              <div className="space-y-1 my-2">
                <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 1º LUGAR • LÍDER
                </span>
                <h3 className="font-black text-lg text-white truncate max-w-[220px]">
                  {top1 ? top1.name : "Aguardando"}
                </h3>
                <div className="text-xs text-amber-200 font-mono">
                  {top1 ? `Identificador: ${top1.identifier}` : "—"}
                </div>
              </div>
              <div className="w-full py-3 rounded-xl bg-amber-950/60 border border-amber-500/50 font-black font-industrial text-2xl text-amber-300 shadow">
                <AnimatedNumber value={top1?.totalScore || 0} suffix=" pts" />
              </div>
            </div>

            {/* 3º LUGAR */}
            <div className="ranking-podium ranking-podium-third p-5 rounded-2xl bg-[#151822] border border-amber-800/30 flex flex-col items-center text-center order-3 md:order-3 relative overflow-hidden shadow-xl md:h-60 justify-between">
              <div className="w-12 h-12 rounded-full bg-amber-950/60 border-2 border-amber-700 flex items-center justify-center text-amber-600 text-xl font-black font-industrial">
                <Medal className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-1 my-2">
                <span className="text-[11px] font-mono font-bold text-amber-600 uppercase">3º LUGAR</span>
                <h3 className="font-bold text-base text-white truncate max-w-[180px]">
                  {top3 ? top3.name : "Aguardando"}
                </h3>
                <div className="text-[11px] text-slate-400 font-mono">
                  {top3 ? `Identificador: ${top3.identifier}` : "—"}
                </div>
              </div>
              <div className="w-full py-2 rounded bg-black/40 border border-white/10 font-black font-industrial text-xl text-amber-600">
                <AnimatedNumber value={top3?.totalScore || 0} suffix=" pts" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH AND FILTERS (PROMPT SECTIONS 20 & 21) */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Search bar */}
        <div className="p-4 rounded-xl bg-[#141822] border border-white/10 space-y-3">
          <label htmlFor="ranking-search" className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
            <Search className="w-4 h-4 text-[#da291c]" />
            “Digite seu nome ou WWID”
          </label>
          <div className="flex gap-2">
            <Input
              id="ranking-search"
              placeholder="Pesquisar por Nome Completo, parte do nome ou WWID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/50 border-white/15 text-white placeholder:text-slate-600 text-sm focus:border-[#da291c]"
            />
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 border-white/15"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Highlighted Participant Search Result Banner */}
          {searchResult && (
            <div className="p-4 rounded-xl bg-amber-950/40 border-2 border-amber-500/60 text-white animate-fadeIn space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <span className="font-black font-industrial text-base sm:text-lg text-amber-300">
                    Você está em {searchResult.rank}º lugar!
                  </span>
                </div>
                <div className="text-xs font-mono bg-black/40 px-3 py-1 rounded border border-white/10">
                  Identificador: <strong className="text-amber-400">{searchResult.identifier}</strong>
                </div>
              </div>

              <div className="text-sm font-bold text-white">
                {searchResult.name} — <span className="text-[#da291c] font-black">{searchResult.totalScore} pontos</span>
              </div>

              {/* Per-game breakdown as required by section 20 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
                <div className="p-2 rounded bg-black/40 border border-white/10">
                  <div className="text-[10px] text-slate-400">Quiz Segurança</div>
                  <div className="font-bold text-white">{searchResult.bestSecurityScore} pts</div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/10">
                  <div className="text-[10px] text-slate-400">Quiz de Ergonomia</div>
                  <div className="font-bold text-white">{searchResult.bestEnvironmentScore} pts</div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/10">
                  <div className="text-[10px] text-slate-400">Ache o Erro</div>
                  <div className="font-bold text-white">{searchResult.bestSpotErrorScore} pts</div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-white/10">
                  <div className="text-[10px] text-slate-400">Organize a Fábrica</div>
                  <div className="font-bold text-white">{searchResult.bestOrganizeScore} pts</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter and Sorting Tabs */}
        <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Game filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "geral", label: "Ranking Geral" },
              { id: "quiz_seguranca", label: "Quiz Segurança" },
              { id: "quiz_ergonomia", label: "Quiz de Ergonomia" },
              { id: "ache_o_erro", label: "Ache o Erro" },
              { id: "organize_a_fabrica", label: "Organize a Fábrica" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={gameFilter === f.id}
                onClick={() => setGameFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  gameFilter === f.id
                    ? "bg-[#da291c] text-white shadow-md shadow-red-950/60"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#da291c]" /> Ordenar:
            </span>
            <select
              aria-label="Ordenar ranking"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/50 border border-white/15 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#da291c]"
            >
              <option value="highest">Maior pontuação</option>
              <option value="lowest">Menor pontuação</option>
              <option value="recent">Mais recentes</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtrar ranking por perfil">
          <span className="text-xs font-mono uppercase text-slate-400">Participantes:</span>
          <button type="button" aria-pressed={participantType === "todos"} onClick={() => setParticipantType("todos")} className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-bold transition ${participantType === "todos" ? "border-amber-400/60 bg-amber-500/20 text-amber-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>Todos</button>
          <button type="button" aria-pressed={participantType === "cummins"} onClick={() => setParticipantType("cummins")} className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-bold transition ${participantType === "cummins" ? "border-amber-400/60 bg-amber-500/20 text-amber-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>Funcionários Cummins</button>
          <button type="button" aria-pressed={participantType === "terceiro"} onClick={() => setParticipantType("terceiro")} className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-bold transition ${participantType === "terceiro" ? "border-amber-400/60 bg-amber-500/20 text-amber-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>Terceiros</button>
          <button type="button" aria-pressed={participantType === "visitante"} onClick={() => setParticipantType("visitante")} className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-bold transition ${participantType === "visitante" ? "border-amber-400/60 bg-amber-500/20 text-amber-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>Visitantes</button>
        </div>
        </div>

        {/* Ranking List: Cards on Mobile + Table on Desktop (Prompt Section 19) */}
        <div className="rounded-2xl bg-[#141822] border border-white/10 overflow-hidden shadow-2xl">
          {rankingQuery.isLoading ? (
            <div className="py-16 text-center text-slate-400 font-mono text-sm animate-pulse">
              Carregando pontuações e classificações oficiais...
            </div>
          ) : list.length === 0 ? (
            <div className="py-16 text-center text-slate-400 p-6">
              <p className="text-base font-bold text-white uppercase font-industrial">Nenhum participante encontrado neste filtro</p>
              <p className="text-xs text-slate-500 mt-1">Selecione outro filtro ou comece um desafio para registrar o primeiro resultado.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="md:hidden divide-y divide-white/10">
                {list.map((row) => (
                  <div key={row.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-amber-400">
                        {row.rank === 1 ? "🥇 1º" : row.rank === 2 ? "🥈 2º" : row.rank === 3 ? "🥉 3º" : `${row.rank}º`}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#da291c] bg-red-950/60 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                        {row.specificScore} pts
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{row.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">ID: {row.identifier}</div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Desafios:</span>
                      <span className="text-emerald-400 font-bold">{row.completedGamesCount} / 4 concluídos</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Posição</th>
                  <th className="py-3.5 px-4">Nome do Colaborador</th>
                  <th className="py-3.5 px-4">Identificador</th>
                  <th className="py-3.5 px-4 text-right">Pontuação</th>
                  <th className="py-3.5 px-4 text-center">Desafios Concluídos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {list.map((row) => {
                    const isTop1 = row.rank === 1;
                    const isTop2 = row.rank === 2;
                    const isTop3 = row.rank === 3;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-white/5 transition-colors ${
                          isTop1
                            ? "bg-amber-500/10 font-bold"
                            : isTop2
                            ? "bg-slate-300/5"
                            : isTop3
                            ? "bg-amber-800/5"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold">
                          {isTop1 ? (
                            <span className="text-amber-400 flex items-center gap-1"><Medal className="h-3.5 w-3.5" /> 1º</span>
                          ) : isTop2 ? (
                            <span className="text-slate-300 flex items-center gap-1"><Medal className="h-3.5 w-3.5" /> 2º</span>
                          ) : isTop3 ? (
                            <span className="text-amber-600 flex items-center gap-1"><Medal className="h-3.5 w-3.5" /> 3º</span>
                          ) : (
                            <span className="text-slate-400">{row.rank}º</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {row.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {row.identifier}
                        </td>
                        <td className="py-3 px-4 text-right font-black font-industrial text-base text-[#da291c]">
                          {row.specificScore} pts
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/5 border border-white/10 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {row.completedGamesCount} / 4
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
