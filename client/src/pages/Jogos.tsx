import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { IdentifyModal } from "@/components/IdentifyModal";
import { DifficultyModal, DifficultyLevel } from "@/components/DifficultyModal";
import { QuizGamePlayer } from "@/components/QuizGamePlayer";
import { SpotErrorGame } from "@/components/SpotErrorGame";
import { OrganizeFactoryGame } from "@/components/OrganizeFactoryGame";
import { useParticipant } from "@/contexts/ParticipantContext";
import { trpc } from "@/lib/trpc";
import { 
  ShieldAlert, 
  HeartPulse,
  Eye, 
  SlidersHorizontal, 
  Play, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ActiveGameMode = null | "quiz_seguranca" | "quiz_ergonomia" | "ache_o_erro" | "organize_a_fabrica";

export default function Jogos() {
  const { participant } = useParticipant();
  const [identifyModalOpen, setIdentifyModalOpen] = useState(false);
  const [difficultyModalOpen, setDifficultyModalOpen] = useState(false);
  const [selectedGameForLaunch, setSelectedGameForLaunch] = useState<ActiveGameMode>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("facil");
  const [activeRunningGame, setActiveRunningGame] = useState<ActiveGameMode>(null);
  const gameSettingsQuery = trpc.games.getSettings.useQuery();

  // Fetch participant progress if identified to show badges
  const progressQuery = trpc.participant.getProgress.useQuery(
    { wwid: participant?.wwid || "" },
    { enabled: !!participant?.wwid }
  );

  const pData = progressQuery.data?.participant;

  const handleLaunchGameClick = (gameKey: ActiveGameMode) => {
    const setting = gameSettingsQuery.data?.find((game) => game.gameKey === gameKey);
    if (setting && !setting.isOpen) {
      toast.error(`${setting.title} está fora da janela de acesso do evento.`);
      return;
    }
    setSelectedGameForLaunch(gameKey);
    if (!participant) {
      setIdentifyModalOpen(true);
    } else {
      setDifficultyModalOpen(true);
    }
  };

  const handleConfirmDifficulty = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    setDifficultyModalOpen(false);
    setActiveRunningGame(selectedGameForLaunch);
  };

  const getGameTitle = (mode: ActiveGameMode) => {
    switch (mode) {
      case "quiz_seguranca":
        return "Quiz de Segurança";
      case "quiz_ergonomia":
        return "Quiz de Ergonomia";
      case "ache_o_erro":
        return "Ache o Erro";
      case "organize_a_fabrica":
        return "Organize a Fábrica";
      default:
        return "";
    }
  };

  // If a game is actively running, render its interactive player
  if (activeRunningGame === "quiz_seguranca" || activeRunningGame === "quiz_ergonomia") {
    return (
      <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
        <Navbar />
        <QuizGamePlayer
          gameType={activeRunningGame}
          difficulty={selectedDifficulty}
          onBackToGames={() => setActiveRunningGame(null)}
        />
      </div>
    );
  }

  if (activeRunningGame === "ache_o_erro") {
    return (
      <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
        <Navbar />
        <SpotErrorGame
          difficulty={selectedDifficulty}
          onBackToGames={() => setActiveRunningGame(null)}
        />
      </div>
    );
  }

  if (activeRunningGame === "organize_a_fabrica") {
    return (
      <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
        <Navbar />
        <OrganizeFactoryGame
          difficulty={selectedDifficulty}
          onBackToGames={() => setActiveRunningGame(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col selection:bg-[#da291c] selection:text-white">
      <Navbar />

      {/* Header section */}
      <section className="game-center-hero relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#161a24] to-[#0f1218] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="v2-kicker inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/80 px-3 py-1">
                <ShieldAlert className="w-4 h-4 text-[#da291c]" />
                <span>V4.0 • CENTRAL DE DESAFIOS • 4 EXPERIÊNCIAS</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-industrial uppercase tracking-tight text-white mt-2">
                ESCOLHA SEU <span className="text-[#da291c]">DESAFIO</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
                Seu próximo desafio está esperando. Jogue no seu ritmo, acompanhe seus recordes e leve o aprendizado para a rotina.
              </p>
            </div>

            {/* Active player summary pill */}
            {participant ? (
              <div className="p-3 rounded-xl bg-black/40 border border-white/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#da291c]/20 border border-[#da291c]/40 flex items-center justify-center font-bold text-white font-industrial">
                  {participant.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{participant.name}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">● Conectado</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    WWID: <strong className="text-amber-400">{participant.wwid}</strong> •{" "}
                    Total: <strong className="text-white">{pData?.totalScore || 0} pts</strong>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIdentifyModalOpen(true)}
                className="bg-[#da291c] hover:bg-[#b01e12] text-white text-xs font-bold uppercase tracking-wider"
              >
                Identificar-se para Jogar
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Exactly 4 main games cards grid as required */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* JOGO 1: QUIZ DE SEGURANÇA */}
          <div className="game-card p-6 sm:p-8 rounded-2xl bg-[#141822] border border-white/10 hover:border-[#da291c]/70 transition-all duration-200 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-[#da291c] group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase">JOGO 1</span>
                  {pData && pData.bestSecurityScore > 0 && (
                    <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recorde: {pData.bestSecurityScore} pts
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black font-industrial text-white uppercase tracking-wide">
                  QUIZ DE SEGURANÇA
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  “Teste seus conhecimentos sobre segurança no ambiente industrial, prevenção de acidentes e utilização correta de EPIs.”
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">12 Perguntas</span>
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">60s / Questão</span>
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">Red Flag & LOTO</span>
              </div>
            </div>

            <div className="pt-6">
              <Button
                onClick={() => handleLaunchGameClick("quiz_seguranca")}
                className="w-full bg-[#da291c] hover:bg-[#b01e12] text-white font-extrabold uppercase tracking-wider text-sm py-6 rounded-xl shadow-lg shadow-red-950/60 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>JOGAR AGORA</span>
              </Button>
            </div>
          </div>

          {/* JOGO 2: QUIZ DE ERGONOMIA */}
          <div className="game-card p-6 sm:p-8 rounded-2xl bg-[#141822] border border-white/10 hover:border-cyan-500/70 transition-all duration-200 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 group-hover:scale-110 transition-transform">
                  <HeartPulse className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">JOGO 2</span>
                  {pData && pData.bestEnvironmentScore > 0 && (
                    <div className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recorde: {pData.bestEnvironmentScore} pts
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black font-industrial text-white uppercase tracking-wide">
                  QUIZ DE ERGONOMIA
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  “Aprenda a proteger seu corpo na rotina CDBS: postura, movimentação, pausas e saúde ocupacional.”
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">12 Perguntas</span>
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">60s / Questão</span>
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">Postura & Pausas</span>
              </div>
            </div>

            <div className="pt-6">
              <Button
                onClick={() => handleLaunchGameClick("quiz_ergonomia")}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold uppercase tracking-wider text-sm py-6 rounded-xl shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>JOGAR AGORA</span>
              </Button>
            </div>
          </div>

          {/* JOGO 3: ACHE O ERRO */}
          <div className="game-card p-6 sm:p-8 rounded-2xl bg-[#141822] border border-white/10 hover:border-amber-500/70 transition-all duration-200 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 group-hover:scale-110 transition-transform">
                  <Eye className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">JOGO 3</span>
                  {pData && pData.bestSpotErrorScore > 0 && (
                    <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recorde: {pData.bestSpotErrorScore} pts
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black font-industrial text-white uppercase tracking-wide">
                  ACHE O ERRO
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  “Compare duas imagens da mesma cena, encontre os atos inseguros e identifique os riscos antes que aconteça um acidente.”
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">5 a 15 Erros</span>
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">Comparação Visual</span>
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">CDBS Osasco</span>
              </div>
            </div>

            <div className="pt-6">
              <Button
                onClick={() => handleLaunchGameClick("ache_o_erro")}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold uppercase tracking-wider text-sm py-6 rounded-xl shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>JOGAR AGORA</span>
              </Button>
            </div>
          </div>

          {/* JOGO 4: ORGANIZE A FÁBRICA */}
          <div className="game-card p-6 sm:p-8 rounded-2xl bg-[#141822] border border-white/10 hover:border-cyan-500/70 transition-all duration-200 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 group-hover:scale-110 transition-transform">
                  <SlidersHorizontal className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">JOGO 4</span>
                  {pData && pData.bestOrganizeScore > 0 && (
                    <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Recorde: {pData.bestOrganizeScore} pts
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black font-industrial text-white uppercase tracking-wide">
                  ORGANIZE A FÁBRICA
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  “Use seus conhecimentos de organização, 5S e Lean Manufacturing para deixar a fábrica mais segura e eficiente.”
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">6 a 12 Encaixes</span>
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">Toque, arraste ou teclado</span>
                <span className="px-2.5 py-1 rounded bg-black/40 border border-white/10">Sequência 5S / Lean</span>
              </div>
            </div>

            <div className="pt-6">
              <Button
                onClick={() => handleLaunchGameClick("organize_a_fabrica")}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold uppercase tracking-wider text-sm py-6 rounded-xl shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>JOGAR AGORA</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Identification Modal */}
      <IdentifyModal
        open={identifyModalOpen}
        onOpenChange={setIdentifyModalOpen}
        onSuccess={() => setDifficultyModalOpen(true)}
      />

      {/* Difficulty Modal */}
      <DifficultyModal
        open={difficultyModalOpen}
        onOpenChange={setDifficultyModalOpen}
        gameTitle={getGameTitle(selectedGameForLaunch)}
        onSelectDifficulty={handleConfirmDifficulty}
        showExtreme={selectedGameForLaunch === "ache_o_erro"}
      />
    </div>
  );
}
