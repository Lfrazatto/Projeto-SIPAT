import React, { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useParticipant } from "@/contexts/ParticipantContext";
import { trpc } from "@/lib/trpc";
import { 
  BarChart3, 
  Search, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RotateCcw, 
  ArrowRight,
  ShieldAlert,
  Leaf,
  Eye,
  SlidersHorizontal,
  Flame,
  Award
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function MeuProgresso() {
  const { participant } = useParticipant();
  const [searchWwid, setSearchWwid] = useState(participant?.wwid || "");
  const [activeWwid, setActiveWwid] = useState(participant?.wwid || "");

  const progressQuery = trpc.participant.getProgress.useQuery(
    { wwid: activeWwid },
    { enabled: !!activeWwid }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchWwid.trim()) {
      setActiveWwid(searchWwid.trim().toUpperCase());
    }
  };

  const pData = progressQuery.data?.participant;
  const currentRank = progressQuery.data?.rank || 0;
  const totalCount = progressQuery.data?.totalParticipants || 0;

  const completedCount = pData?.completedGamesCount || 0;
  const isCompletedAll = completedCount >= 4;

  const totalQuestionsDone = (pData?.totalCorrectAnswers || 0) + (pData?.totalWrongAnswers || 0);
  const accuracy = totalQuestionsDone > 0
    ? Math.round(((pData?.totalCorrectAnswers || 0) / totalQuestionsDone) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
      <Navbar />

      {/* Header section */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#161a24] to-[#0f1218] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="v2-kicker inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/80 px-3 py-1">
            <BarChart3 className="w-4 h-4 text-[#da291c]" />
            <span>V3.0 • PAINEL INDIVIDUAL DO COLABORADOR</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-industrial uppercase tracking-tight text-white">
            MEU <span className="text-[#da291c]">PROGRESSO</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Consulte sua evolução, entenda seus pontos fortes e escolha o próximo desafio para avançar no ranking.
          </p>
        </div>
      </section>

      {/* Chapa / WWID lookup section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <form onSubmit={handleSearch} className="p-4 rounded-xl bg-[#141822] border border-white/10 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="progress-identifier" className="text-[11px] font-mono text-slate-300 block mb-1">
              DIGITE SUA CHAPA OU WWID CORPORATIVO:
            </label>
            <Input
              id="progress-identifier"
              name="identifier"
              autoComplete="off"
              placeholder="Ex: 123456 ou WW12345"
              value={searchWwid}
              onChange={(e) => setSearchWwid(e.target.value.toUpperCase())}
              className="bg-black/50 border-white/15 text-white placeholder:text-slate-600 font-mono text-sm focus:border-[#da291c]"
            />
          </div>
          <Button
            type="submit"
            className="self-end bg-[#da291c] hover:bg-[#b01e12] text-white text-xs font-bold uppercase tracking-wider px-6 h-10"
          >
            Consultar Progresso
          </Button>
        </form>

        {progressQuery.isLoading && (
          <div role="status" aria-live="polite" className="py-16 text-center text-slate-300 font-mono text-sm">
            Consultando registros no banco de dados...
          </div>
        )}

        {progressQuery.isError && (
          <div role="alert" className="py-12 text-center space-y-3 p-6 bg-red-950/20 border border-red-500/30 rounded-2xl mt-6">
            <XCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="font-industrial font-bold text-white uppercase text-lg">
              Colaborador Não Encontrado
            </h3>
            <p className="text-xs text-slate-400">
              Nenhum registro com a chapa ou WWID <strong>{activeWwid}</strong> foi localizado. Cadastre-se iniciando qualquer desafio na área de jogos!
            </p>
            <Button asChild size="sm" className="bg-[#da291c] text-white text-xs font-bold uppercase"><Link href="/jogos">Ir Para os Jogos</Link></Button>
          </div>
        )}

        {!progressQuery.isLoading && !progressQuery.isError && progressQuery.data && !progressQuery.data.participant && (
          <div role="status" className="py-12 text-center space-y-3 p-6 bg-amber-950/20 border border-amber-500/30 rounded-2xl mt-6">
            <Search className="w-8 h-8 text-amber-300 mx-auto" />
            <h3 className="font-industrial font-bold text-white uppercase text-lg">
              Nenhum progresso encontrado
            </h3>
            <p className="text-xs text-slate-400">
              A chapa ou WWID informado ainda não possui um cadastro. Inicie qualquer desafio para criar seu registro.
            </p>
            <Button asChild size="sm" className="bg-[#da291c] text-white text-xs font-bold uppercase"><Link href="/jogos">Ir Para os Jogos</Link></Button>
          </div>
        )}

        {/* Detailed Participant Statistics (Sections 16 & 30) */}
        {pData && (
          <div className="mt-8 space-y-8 animate-fadeIn">
            {/* SPECIAL SECTION 30: DESAFIO COMPLETO CELEBRATION */}
            {isCompletedAll && (
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-500/20 via-red-950/40 to-emerald-950/40 border-2 border-amber-400/80 shadow-2xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/30 border-2 border-amber-300 flex items-center justify-center text-amber-300 mx-auto">
                  <Award className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black font-industrial uppercase text-white tracking-wide">
                    🏆 PARABÉNS!
                  </h2>
                  <h3 className="text-lg font-bold font-industrial text-amber-300 uppercase mt-1">
                    Você completou o CUMMINS SIPAT CHALLENGE!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto">
                    “Parabéns! Você completou todos os desafios da SIPAT.”
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs sm:text-sm italic text-amber-200">
                  “Segurança é responsabilidade de todos.”
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider"><Link href="/ranking">Ver Ranking Geral</Link></Button>
                  <Button asChild variant="outline" className="border-white/20 text-white font-bold text-xs uppercase tracking-wider"><Link href="/jogos">Jogar Novamente Para Superar Recordes</Link></Button>
                </div>
              </div>
            )}

            {/* Profile Overview Card */}
            <div className="p-6 rounded-2xl bg-[#141822] border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#da291c] uppercase tracking-widest">
                    REGISTRO DE COLABORADOR
                  </span>
                  <h2 className="text-2xl font-black font-industrial uppercase text-white">
                    {pData.name}
                  </h2>
                  <div className="text-xs font-mono text-slate-400">
                    Chapa: <strong className="text-amber-400">{pData.chapa}</strong> • WWID: <strong className="text-amber-400">{pData.wwid}</strong> • Maior Dificuldade:{" "}
                    <strong className="text-white">{pData.highestDifficulty}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">PONTUAÇÃO TOTAL</div>
                  <div className="text-3xl font-black font-industrial text-[#da291c]">
                    {pData.totalScore} pts
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Posição: <strong className="text-emerald-400">{currentRank}º</strong> de {totalCount}
                  </div>
                </div>
              </div>

              {/* Progress Bar 0/4 to 4/4 as specified in section 16 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-industrial font-bold uppercase text-white">
                    Progresso GeralSIPAT:
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {completedCount}/4 desafios concluídos ({completedCount * 25}%)
                  </span>
                </div>
                <Progress value={completedCount * 25} className="h-3 bg-slate-800" />
              </div>

              {/* General Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Acertos Totais</div>
                  <div className="text-2xl font-black font-industrial text-emerald-400">
                    {pData.totalCorrectAnswers}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Erros Totais</div>
                  <div className="text-2xl font-black font-industrial text-red-400">
                    {pData.totalWrongAnswers}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Aproveitamento</div>
                  <div className="text-2xl font-black font-industrial text-amber-400">
                    {accuracy}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Status Global</div>
                  <div className="text-sm font-black font-industrial text-white mt-1">
                    {isCompletedAll ? (
                      <span className="text-emerald-400">JORNADA COMPLETA 100%</span>
                    ) : (
                      <span className="text-amber-400">EM ANDAMENTO ({4 - completedCount} RESTANTES)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance per individual challenge */}
            <div className="space-y-4">
              <h3 className="text-lg font-black font-industrial uppercase text-white">
                Melhor Desempenho em Cada Desafio
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Quiz Segurança */}
                <div className="p-5 rounded-xl bg-[#141822] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-red-950/80 text-[#da291c]">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white uppercase font-industrial">
                        Quiz de Segurança
                      </div>
                      <div className="text-xs text-slate-400">
                        {pData.bestSecurityScore > 0 ? "Concluído" : "Pendente"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black font-industrial text-[#da291c]">
                      {pData.bestSecurityScore} pts
                    </div>
                  </div>
                </div>

                {/* 2. Quiz de Ergonomia */}
                <div className="p-5 rounded-xl bg-[#141822] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-950/80 text-emerald-400">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white uppercase font-industrial">
                        Quiz de Ergonomia
                      </div>
                      <div className="text-xs text-slate-400">
                        {pData.bestEnvironmentScore > 0 ? "Concluído" : "Pendente"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black font-industrial text-emerald-400">
                      {pData.bestEnvironmentScore} pts
                    </div>
                  </div>
                </div>

                {/* 3. Ache o Erro */}
                <div className="p-5 rounded-xl bg-[#141822] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-950/80 text-amber-400">
                      <Eye className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white uppercase font-industrial">
                        Ache o Erro
                      </div>
                      <div className="text-xs text-slate-400">
                        {pData.bestSpotErrorScore > 0 ? "Concluído" : "Pendente"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black font-industrial text-amber-400">
                      {pData.bestSpotErrorScore} pts
                    </div>
                  </div>
                </div>

                {/* 4. Organize a Fábrica */}
                <div className="p-5 rounded-xl bg-[#141822] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-950/80 text-cyan-400">
                      <SlidersHorizontal className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white uppercase font-industrial">
                        Organize a Fábrica
                      </div>
                      <div className="text-xs text-slate-400">
                        {pData.bestOrganizeScore > 0 ? "Concluído" : "Pendente"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black font-industrial text-cyan-400">
                      {pData.bestOrganizeScore} pts
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button asChild size="lg" className="bg-[#da291c] hover:bg-[#b01e12] text-white font-bold uppercase tracking-wider text-xs px-8 py-6 flex items-center gap-2"><Link href="/jogos"><RotateCcw className="w-4 h-4" /><span>Refazer Desafios Para Melhorar Pontuação</span></Link></Button>
            </div>

            {!isCompletedAll && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-slate-300 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-industrial uppercase text-sm">Dica de Especialista EHS</strong>
                  Complete todos os quatro desafios para desbloquear sua pontuação máxima e concorrer às premiações de engajamento da SIPAT 2026.
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
