import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, Flame, ArrowRight } from "lucide-react";

export type DifficultyLevel = "facil" | "medio" | "dificil" | "muito_dificil";

interface DifficultyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameTitle: string;
  onSelectDifficulty: (level: DifficultyLevel) => void;
  showExtreme?: boolean;
}

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  open,
  onOpenChange,
  gameTitle,
  onSelectDifficulty,
  showExtreme = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#161a24] border border-white/15 text-slate-100 shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#da291c] uppercase">
            <Zap className="w-4 h-4" />
            Configuração de Desafio
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black font-industrial uppercase tracking-wide text-white">
            Nível de Dificuldade
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {gameTitle} — Selecione o nível desejado antes de iniciar.
          </DialogDescription>
        </DialogHeader>

        {/* Prompt specific quote */}
        <div className="p-3 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          “Quanto maior a dificuldade, maior será sua pontuação.”
        </div>

        <div className="grid grid-cols-1 gap-3 py-2" role="group" aria-label="Escolha do nível de dificuldade">
          {/* FÁCIL */}
          <button
            type="button"
            onClick={() => onSelectDifficulty("facil")}
            aria-label="Iniciar no nível fácil, 100 pontos por acerto"
            className="min-h-24 p-4 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500 hover:bg-emerald-950/20 transition-all text-left flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-industrial font-black text-base text-white uppercase group-hover:text-emerald-300 transition-colors">
                  FÁCIL
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100 pts / acerto
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pontuação base menor. Ideal para revisar conceitos básicos de segurança, cuidado e melhoria contínua.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* MÉDIO */}
          <button
            type="button"
            onClick={() => onSelectDifficulty("medio")}
            aria-label="Iniciar no nível médio, 200 pontos por acerto"
            className="min-h-24 p-4 rounded-xl bg-black/40 border border-white/10 hover:border-amber-500 hover:bg-amber-950/20 transition-all text-left flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="font-industrial font-black text-base text-white uppercase group-hover:text-amber-300 transition-colors">
                  MÉDIO
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  200 pts / acerto
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pontuação intermediária. Exige maior atenção aos detalhes e procedimentos fabris.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </button>

          {/* DIFÍCIL */}
          <button
            type="button"
            onClick={() => onSelectDifficulty("dificil")}
            aria-label="Iniciar no nível difícil, 300 pontos por acerto"
            className="min-h-24 p-4 rounded-xl bg-black/40 border border-white/10 hover:border-[#da291c] hover:bg-red-950/20 transition-all text-left flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#da291c]" />
                <span className="font-industrial font-black text-base text-white uppercase group-hover:text-red-400 transition-colors">
                  DIFÍCIL
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  300 pts / acerto
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pontuação máxima! Para quem quer liderar o Ranking SIPAT da Cummins.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </button>

          {showExtreme && (
            <button
              type="button"
              onClick={() => onSelectDifficulty("muito_dificil")}
              aria-label="Iniciar no nível muito difícil, inspeção avançada"
              className="min-h-24 p-4 rounded-xl bg-black/40 border border-white/10 hover:border-fuchsia-500 hover:bg-fuchsia-950/20 transition-all text-left flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400" />
                  <span className="font-industrial font-black text-base text-white uppercase group-hover:text-fuchsia-300 transition-colors">
                    MUITO DIFÍCIL
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  15 erros / 450 pts
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Inspeção avançada: erros discretos, espalhados pela cena e com tempo reduzido.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
