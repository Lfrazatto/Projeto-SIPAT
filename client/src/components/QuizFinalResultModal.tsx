import React from "react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  RotateCcw, 
  ArrowRight, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  Sparkles,
  Zap
} from "lucide-react";

interface QuizFinalResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  playerWwid: string;
  gameTitle: string;
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions?: number;
  unitLabel?: string;
  totalTimeSeconds: number;
  difficulty: "facil" | "medio" | "dificil" | "muito_dificil";
  currentRank: number;
  isNewBest?: boolean;
  resultHeading?: string;
  onPlayAgain: () => void;
  onOtherChallenge: () => void;
}

export const QuizFinalResultModal: React.FC<QuizFinalResultModalProps> = ({
  open,
  onOpenChange,
  playerName,
  playerWwid,
  gameTitle,
  score,
  maxScore,
  correctCount,
  wrongCount,
  totalQuestions,
  unitLabel = "perguntas",
  totalTimeSeconds,
  difficulty,
  currentRank,
  isNewBest,
  resultHeading = "QUIZ FINALIZADO!",
  onPlayAgain,
  onOtherChallenge,
}) => {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const diffLabel = difficulty === "muito_dificil" ? "MUITO DIFÍCIL" : difficulty === "dificil" ? "DIFÍCIL" : difficulty === "medio" ? "MÉDIO" : "FÁCIL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto bg-[#151923] border border-white/15 p-4 text-slate-100 shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:p-8">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-[#da291c] to-amber-500 flex items-center justify-center shadow-lg shadow-red-900/50 mb-1 border-2 border-amber-300">
            <Trophy className="w-8 h-8 text-white" />
          </div>

          <DialogTitle className="text-2xl sm:text-3xl font-black font-industrial uppercase tracking-wide text-white">
            {resultHeading}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300">
            {gameTitle} — Parabéns pelo seu empenho e atitude de segurança!
          </DialogDescription>
        </DialogHeader>

        {isNewBest && (
          <div className="p-2.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            NOVO RECORDE PESSOAL NESTE DESAFIO!
          </div>
        )}

        {/* Participant Identification Bar */}
        <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/40 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-slate-400">Colaborador:</span>{" "}
            <span className="font-bold text-white">{playerName}</span>
          </div>
          <div>
            <span className="text-slate-400">WWID:</span>{" "}
            <span className="font-mono font-bold text-amber-400">{playerWwid}</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 py-1 text-center sm:grid-cols-4 sm:gap-3">
          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <div className="text-xs text-slate-400 uppercase font-semibold">Pontuação</div>
            <div className="text-2xl font-black font-industrial text-[#da291c]">{score}</div>
            <div className="text-[10px] text-slate-500">de {maxScore} pts</div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <div className="text-xs text-slate-400 uppercase font-semibold">Aproveitamento</div>
            <div className="text-2xl font-black font-industrial text-amber-400">{percentage}%</div>
            <div className="text-[10px] text-slate-500">Precisão global</div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <div className="text-xs text-slate-400 uppercase font-semibold">Acertos / Erros</div>
            <div className="text-xl font-bold font-industrial text-white flex items-center justify-center gap-1">
              <span className="text-emerald-400">{correctCount}</span>
              <span className="text-slate-500">/</span>
              <span className="text-red-400">{wrongCount}</span>
            </div>
            <div className="text-[10px] text-slate-500">{totalQuestions ?? correctCount + wrongCount} {unitLabel}</div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <div className="text-xs text-slate-400 uppercase font-semibold">Posição Ranking</div>
            <div className="text-2xl font-black font-industrial text-emerald-400">
              {currentRank > 0 ? `${currentRank}º` : "—"}
            </div>
            <div className="text-[10px] text-slate-500">Geral Atual</div>
          </div>
        </div>

        {/* Extra meta tags */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Tempo Total: <strong className="text-white ml-1">{totalTimeSeconds}s</strong>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Dificuldade: <strong className="text-white ml-1">{diffLabel}</strong>
          </span>
        </div>

        {/* Required Navigation Buttons */}
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-4">
          <Button
            onClick={onPlayAgain}
            variant="outline"
            size="sm"
            className="min-h-12 border-white/20 text-slate-200 hover:bg-white/10 text-xs font-bold uppercase flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Jogar Novamente
          </Button>

          <Button
            onClick={onOtherChallenge}
            size="sm"
            className="min-h-12 bg-[#da291c] hover:bg-[#b01e12] text-white text-xs font-bold uppercase flex items-center justify-center gap-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Outro Desafio
          </Button>

          <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-12 w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-bold uppercase flex items-center justify-center gap-1"
            >
              <Link href="/ranking" className="w-full"><Trophy className="w-3.5 h-3.5 text-amber-400" />Ver Ranking</Link>
            </Button>

          <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-12 w-full border-blue-500/40 text-blue-300 hover:bg-blue-500/10 text-xs font-bold uppercase flex items-center justify-center gap-1"
            >
              <Link href="/meu-progresso" className="w-full"><BarChart3 className="w-3.5 h-3.5 text-blue-400" />Meu Progresso</Link>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
