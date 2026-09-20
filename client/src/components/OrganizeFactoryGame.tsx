import React, { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useParticipant } from "@/contexts/ParticipantContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Button } from "@/components/ui/button";
import { QuizFinalResultModal } from "@/components/QuizFinalResultModal";
import { 
  SlidersHorizontal, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight,
  Wrench,
  ShieldCheck,
  Trash2,
  Package,
  Layers,
  Factory,
  Info,
  Pause,
  Play
} from "lucide-react";

interface OrganizeFactoryProps {
  difficulty: "facil" | "medio" | "dificil" | "muito_dificil";
  onBackToGames: () => void;
}

interface Item5S {
  id: string;
  name: string;
  type: "FERRAMENTAS" | "EPIs" | "RESIDUOS" | "MATERIAIS" | "DESCARTE" | "PRODUCAO";
  iconName: string;
}

const DESTINATION_ZONES = [
  { key: "FERRAMENTAS" as const, label: "QUADRO DE FERRAMENTAS", desc: "Chaves, torquímetros e soquetes", color: "border-blue-500 bg-blue-950/20 text-blue-400" },
  { key: "EPIs" as const, label: "ESTAÇÃO DE EPIS", desc: "Óculos, luvas limpas e protetores", color: "border-emerald-500 bg-emerald-950/20 text-emerald-400" },
  { key: "RESIDUOS" as const, label: "MATERIAIS (ORGANIZAÇÃO 5S)", desc: "Materiais fora do lugar e itens sem identificação", color: "border-amber-500 bg-amber-950/20 text-amber-400" },
  { key: "MATERIAIS" as const, label: "ALMOXARIFADO DE MATERIAIS", desc: "Caixas de peças e juntas sobressalentes", color: "border-purple-500 bg-purple-950/20 text-purple-400" },
  { key: "DESCARTE" as const, label: "ÁREA DE DESCARTE (OBSOLETOS)", desc: "Itens danificados e sem uso (Seiri)", color: "border-red-500 bg-red-950/20 text-red-400" },
  { key: "PRODUCAO" as const, label: "LINHA DE PRODUÇÃO (LEAN)", desc: "Blocos de motor e cabeçotes em ciclo", color: "border-cyan-500 bg-cyan-950/20 text-cyan-400" },
];

const ALL_FACTORY_ITEMS: Item5S[] = [
  { id: "item1", name: "Torquímetro de precisão para bielas", type: "FERRAMENTAS", iconName: "wrench" },
  { id: "item2", name: "Óculos de segurança com proteção lateral", type: "EPIs", iconName: "shield" },
  { id: "item3", name: "Estopa embebida em óleo lubrificante", type: "RESIDUOS", iconName: "trash" },
  { id: "item4", name: "Caixa de juntas de vedação originais", type: "MATERIAIS", iconName: "box" },
  { id: "item5", name: "Palete quebrado inutilizado com pregos soltos", type: "DESCARTE", iconName: "trash" },
  { id: "item6", name: "Bloco de motor Cummins X15 em usinagem", type: "PRODUCAO", iconName: "factory" },
  { id: "item7", name: "Jogo de chaves combinadas sextavadas", type: "FERRAMENTAS", iconName: "wrench" },
  { id: "item8", name: "Protetor auditivo tipo concha higienizado", type: "EPIs", iconName: "shield" },
  { id: "item9", name: "Filtro de combustível usado para reciclagem", type: "RESIDUOS", iconName: "trash" },
  { id: "item10", name: "Lote de parafusos de biela etiquetados", type: "MATERIAIS", iconName: "box" },
  { id: "item11", name: "Mangueira de ar comprimido furada e gasta", type: "DESCARTE", iconName: "trash" },
  { id: "item12", name: "Cabeçote Euro VI pronto para montagem", type: "PRODUCAO", iconName: "factory" },
];

function shuffleItems(items: Item5S[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const OrganizeFactoryGame: React.FC<OrganizeFactoryProps> = ({
  difficulty,
  onBackToGames,
}) => {
  const { participant } = useParticipant();
  const { extendedTime } = useAccessibility();

  // Number of items to organize: Fácil = 6, Médio = 9, Difícil = 12
  const requiredItemsCount = difficulty === "dificil" ? 12 : difficulty === "medio" ? 9 : 6;
  const gameItems = ALL_FACTORY_ITEMS.slice(0, requiredItemsCount);

  const basePointsPerItem = difficulty === "dificil" ? 300 : difficulty === "medio" ? 200 : 100;
  const maxPossibleScore = requiredItemsCount * basePointsPerItem;
  const baseAllowedTime = difficulty === "dificil" ? 120 : difficulty === "medio" ? 90 : 60;
  const totalAllowedTime = baseAllowedTime * (extendedTime ? 2 : 1);

  const [remainingTime, setRemainingTime] = useState(totalAllowedTime);
  const [unorganizedItems, setUnorganizedItems] = useState<Item5S[]>(() => shuffleItems(gameItems));
  const [organizedItems, setOrganizedItems] = useState<{ [zoneKey: string]: Item5S[] }>({});
  const [draggedItem, setDraggedItem] = useState<Item5S | null>(null);
  const [selectedMobileItem, setSelectedMobileItem] = useState<Item5S | null>(null);

  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [wrongDrops, setWrongDrops] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalSubmitData, setFinalSubmitData] = useState<{ rank: number; isNewBest: boolean } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const submitMutation = trpc.games.submitResult.useMutation();

  useEffect(() => {
    if (isFinished || isPaused) return;

    timerRef.current = setInterval(() => {
      setRemainingTime((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, isPaused]);

  const handleTimeEnd = () => {
    endGame(score, requiredItemsCount - unorganizedItems.length, wrongDrops);
  };

  const handleDropIntoZone = (zoneKey: string) => {
    const itemToProcess = draggedItem || selectedMobileItem;
    if (!itemToProcess || isFinished || isPaused) return;

    const isMatch = itemToProcess.type === zoneKey;

    if (isMatch) {
      const earned = Math.round(basePointsPerItem * (remainingTime / totalAllowedTime));
      const newScore = score + Math.max(10, earned);

      setScore(newScore);
      setFeedback({ text: `CORRETO! OBJETO ORGANIZADO! +${earned} Pts`, isCorrect: true });

      // Move item to organized zone
      setOrganizedItems((prev) => ({
        ...prev,
        [zoneKey]: [...(prev[zoneKey] || []), itemToProcess],
      }));
      setUnorganizedItems((prev) => prev.filter((i) => i.id !== itemToProcess.id));

      if (unorganizedItems.length - 1 <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        endGame(newScore, requiredItemsCount, wrongDrops);
      }
    } else {
      setWrongDrops((w) => w + 1);
      setFeedback({ text: "LOCAL INCORRETO! VERIFIQUE AS REGRAS DO 5S.", isCorrect: false });
    }

    setDraggedItem(null);
    setSelectedMobileItem(null);
  };

  const endGame = (finalScore: number, organizedCount: number, wrongs: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsFinished(true);
    const timeSpent = totalAllowedTime - remainingTime;

    if (participant) {
      submitMutation.mutate(
        {
          participantChapa: participant.chapa,
          participantName: participant.name,
          participantWwid: participant.wwid,
          gameType: "organize_a_fabrica",
          difficulty,
          score: finalScore,
          correctCount: organizedCount,
          wrongCount: wrongs,
          timeSpentSeconds: Math.max(1, timeSpent),
        },
        {
          onSuccess: (data) => {
            setFinalSubmitData({ rank: data.rank, isNewBest: data.isNewBest });
          },
          onError: () => setFeedback({ text: "Resultado concluído, mas não foi possível sincronizar o ranking. Tente novamente.", isCorrect: false }),
        }
      );
    }
  };

  const resetGame = () => {
    setRemainingTime(totalAllowedTime);
    setUnorganizedItems(shuffleItems(gameItems));
    setOrganizedItems({});
    setDraggedItem(null);
    setSelectedMobileItem(null);
    setFeedback(null);
    setScore(0);
    setWrongDrops(0);
    setIsFinished(false);
    setIsPaused(false);
    submittedRef.current = false;
    setFinalSubmitData(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Bar */}
      <div className="p-4 rounded-xl bg-[#141822] border border-white/10 shadow-xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              METODOLOGIA 5S & LEAN MANUFACTURING
            </span>
            <h2 className="text-xl font-bold font-industrial uppercase text-white">
              ORGANIZE A FÁBRICA CUMMINS
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div role="timer" aria-label={`${remainingTime} segundos restantes`} className="px-4 py-2 rounded-lg bg-black/60 border border-white/15 flex items-center gap-2">
            <Clock className={`w-5 h-5 ${remainingTime <= 15 ? "text-red-500 animate-pulse" : "text-amber-400"}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-mono leading-none">TEMPO</span>
              <span className="text-2xl font-black font-industrial text-white leading-none">
                {remainingTime}s
              </span>
            </div>
          </div>

          <Button type="button" variant="outline" onClick={() => setIsPaused((current) => !current)} aria-pressed={isPaused} className="min-h-11 border-white/20 text-white">
            {isPaused ? <Play className="mr-2 h-4 w-4" aria-hidden="true" /> : <Pause className="mr-2 h-4 w-4" aria-hidden="true" />}
            {isPaused ? "Continuar" : "Pausar"}
          </Button>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono">ITENS ORGANIZADOS</span>
            <div className="text-2xl font-black font-industrial text-cyan-400">
              {requiredItemsCount - unorganizedItems.length} / {requiredItemsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      <div className="mb-4">
        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className={`p-3 rounded-lg border text-xs sm:text-sm font-bold flex items-center gap-2 animate-fadeIn ${
              feedback.isCorrect
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                : "bg-red-950/60 border-red-500/50 text-red-300"
            }`}
          >
            {feedback.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Arraste e solte (ou clique para selecionar e depois toque na área) cada objeto fabril para sua estação correta segundo o programa 5S e Lean!
            </span>
          </div>
        )}
      </div>

      {/* Unorganized Items Pool */}
      <div className="p-5 rounded-2xl bg-[#161a24] border border-white/10 mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-industrial font-bold text-sm uppercase text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            Itens Aguardando Organização (Seiri & Seiton):
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {unorganizedItems.length} restantes
          </span>
        </div>

        {unorganizedItems.length === 0 ? (
          <div className="p-8 text-center bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-emerald-300 font-bold font-industrial uppercase text-base">
            🎉 Todos os itens foram alocados com sucesso! Fábrica 100% organizada e segura.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {unorganizedItems.map((item) => {
              const isSelected = selectedMobileItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedItem(item)}
                  onClick={() => setSelectedMobileItem(item)}
                  aria-pressed={isSelected}
                  aria-label={`${item.name}. ${isSelected ? "Selecionado. Escolha uma área de destino." : "Selecionar item."}`}
                  disabled={isPaused}
                  className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none flex flex-col justify-between ${
                    isSelected
                      ? "bg-cyan-950 border-cyan-400 shadow-lg scale-105"
                      : "bg-black/40 border-white/10 hover:border-cyan-400/50 hover:bg-white/5"
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-2 leading-tight">
                    {item.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-white/10">
                    <span>Arrastar</span>
                    <span className="text-cyan-400 font-bold">5S</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6 Destination Zones (Drag & Drop Targets) */}
      <div className="space-y-3">
        <h3 className="font-industrial font-bold text-sm uppercase text-white flex items-center gap-2">
          <Factory className="w-4 h-4 text-[#da291c]" />
          Áreas de Destino Padronizadas:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {DESTINATION_ZONES.map((zone) => {
            const itemsInThisZone = organizedItems[zone.key] || [];

            return (
              <button
                key={zone.key}
                type="button"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropIntoZone(zone.key)}
                onClick={() => handleDropIntoZone(zone.key)}
                disabled={!selectedMobileItem || isPaused}
                aria-label={`${zone.label}. ${zone.desc}. ${itemsInThisZone.length} itens organizados aqui.`}
                className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col justify-between min-h-[160px] ${zone.color} hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70`}
              >
                <div>
                  <div className="font-industrial font-extrabold text-sm uppercase tracking-wide">
                    {zone.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{zone.desc}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                    <span>Organizados aqui:</span>
                    <span className="font-bold text-white">{itemsInThisZone.length}</span>
                  </div>

                  <div className="space-y-1">
                    {itemsInThisZone.map((it) => (
                      <div
                        key={it.id}
                        className="text-[10px] px-2 py-1 rounded bg-black/50 text-slate-200 border border-white/5 truncate flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{it.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isPaused && !isFinished && (
        <div role="dialog" aria-modal="true" aria-label="Jogo pausado" className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4">
          <div className="max-w-sm rounded-2xl border border-white/20 bg-[#141822] p-6 text-center shadow-2xl">
            <Pause className="mx-auto h-9 w-9 text-amber-300" aria-hidden="true" />
            <h3 className="mt-3 text-xl font-black text-white">Jogo pausado</h3>
            <p className="mt-2 text-sm text-slate-300">O cronômetro está parado. Continue quando estiver pronto.</p>
            <Button type="button" onClick={() => setIsPaused(false)} className="mt-5 min-h-11 w-full bg-[#da291c] text-white"><Play className="mr-2 h-4 w-4" aria-hidden="true" /> Continuar</Button>
          </div>
        </div>
      )}

      {/* Final Results Modal */}
      <QuizFinalResultModal
        open={isFinished}
        onOpenChange={setIsFinished}
        playerName={participant?.name || "Colaborador"}
        playerWwid={participant?.wwid || "WWID"}
        gameTitle="Organize a Fábrica (5S & Lean)"
        score={score}
        maxScore={maxPossibleScore}
        correctCount={requiredItemsCount - unorganizedItems.length}
        wrongCount={wrongDrops}
        totalTimeSeconds={totalAllowedTime - remainingTime}
        difficulty={difficulty}
        currentRank={finalSubmitData?.rank || 1}
        isNewBest={finalSubmitData?.isNewBest}
        onPlayAgain={resetGame}
        onOtherChallenge={onBackToGames}
      />
    </div>
  );
};
