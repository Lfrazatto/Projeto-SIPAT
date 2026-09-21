import React, { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useParticipant } from "@/contexts/ParticipantContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Button } from "@/components/ui/button";
import { QuizFinalResultModal } from "@/components/QuizFinalResultModal";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Clock,
  Factory,
  GripVertical,
  Info,
  Layers,
  Package,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";

interface OrganizeFactoryProps {
  difficulty: "facil" | "medio" | "dificil" | "muito_dificil";
  onBackToGames: () => void;
}

type ItemIconName = "wrench" | "shield" | "trash" | "box" | "factory" | "layers";

type StationKey = "FERRAMENTAS" | "EPIS" | "RESIDUOS" | "MATERIAIS" | "DESCARTE" | "PRODUCAO";

interface WorkstationSlot {
  id: string;
  station: StationKey;
  stationLabel: string;
  label: string;
  hint: string;
  color: string;
}

interface Item5S {
  id: string;
  name: string;
  slotId: string;
  station: StationKey;
  iconName: ItemIconName;
}

interface LeanStep {
  id: string;
  order: number;
  title: string;
  description: string;
  icon: ItemIconName;
}

const WORKSTATION_SLOTS: WorkstationSlot[] = [
  { id: "tool-torque", station: "FERRAMENTAS", stationLabel: "BANCADA DE FERRAMENTAS", label: "Ferramenta de torque", hint: "Instrumentos de precisão", color: "blue" },
  { id: "tool-hand", station: "FERRAMENTAS", stationLabel: "BANCADA DE FERRAMENTAS", label: "Ferramentas manuais", hint: "Chaves e soquetes", color: "blue" },
  { id: "epi-eye", station: "EPIS", stationLabel: "ESTAÇÃO DE EPIs", label: "Proteção dos olhos", hint: "EPI limpo e pronto para uso", color: "emerald" },
  { id: "epi-hearing", station: "EPIS", stationLabel: "ESTAÇÃO DE EPIs", label: "Proteção auditiva", hint: "EPI higienizado", color: "emerald" },
  { id: "residue-oily", station: "RESIDUOS", stationLabel: "PONTO DE RESÍDUOS", label: "Resíduo contaminado", hint: "Separar antes do descarte", color: "amber" },
  { id: "residue-filter", station: "RESIDUOS", stationLabel: "PONTO DE RESÍDUOS", label: "Filtro usado", hint: "Encaminhar para reciclagem", color: "amber" },
  { id: "material-gaskets", station: "MATERIAIS", stationLabel: "ALMOXARIFADO", label: "Juntas de vedação", hint: "Material sobressalente identificado", color: "purple" },
  { id: "material-bolts", station: "MATERIAIS", stationLabel: "ALMOXARIFADO", label: "Parafusos etiquetados", hint: "Peças pequenas organizadas", color: "purple" },
  { id: "discard-pallet", station: "DESCARTE", stationLabel: "ÁREA DE DESCARTE", label: "Palete inutilizado", hint: "Remover risco de acidente", color: "red" },
  { id: "discard-hose", station: "DESCARTE", stationLabel: "ÁREA DE DESCARTE", label: "Mangueira danificada", hint: "Material sem condição de uso", color: "red" },
  { id: "production-block", station: "PRODUCAO", stationLabel: "LINHA DE PRODUÇÃO", label: "Bloco em usinagem", hint: "Componente em processo", color: "cyan" },
  { id: "production-head", station: "PRODUCAO", stationLabel: "LINHA DE PRODUÇÃO", label: "Cabeçote pronto", hint: "Componente para montagem", color: "cyan" },
];

const ALL_FACTORY_ITEMS: Item5S[] = [
  { id: "item1", name: "Torquímetro de precisão para bielas", slotId: "tool-torque", station: "FERRAMENTAS", iconName: "wrench" },
  { id: "item2", name: "Óculos de segurança com proteção lateral", slotId: "epi-eye", station: "EPIS", iconName: "shield" },
  { id: "item3", name: "Estopa embebida em óleo lubrificante", slotId: "residue-oily", station: "RESIDUOS", iconName: "trash" },
  { id: "item4", name: "Caixa de juntas de vedação originais", slotId: "material-gaskets", station: "MATERIAIS", iconName: "box" },
  { id: "item5", name: "Palete quebrado inutilizado com pregos soltos", slotId: "discard-pallet", station: "DESCARTE", iconName: "trash" },
  { id: "item6", name: "Bloco de motor Cummins X15 em usinagem", slotId: "production-block", station: "PRODUCAO", iconName: "factory" },
  { id: "item7", name: "Jogo de chaves combinadas sextavadas", slotId: "tool-hand", station: "FERRAMENTAS", iconName: "wrench" },
  { id: "item8", name: "Protetor auditivo tipo concha higienizado", slotId: "epi-hearing", station: "EPIS", iconName: "shield" },
  { id: "item9", name: "Filtro de combustível usado para reciclagem", slotId: "residue-filter", station: "RESIDUOS", iconName: "trash" },
  { id: "item10", name: "Lote de parafusos de biela etiquetados", slotId: "material-bolts", station: "MATERIAIS", iconName: "box" },
  { id: "item11", name: "Mangueira de ar comprimido furada e gasta", slotId: "discard-hose", station: "DESCARTE", iconName: "trash" },
  { id: "item12", name: "Cabeçote Euro VI pronto para montagem", slotId: "production-head", station: "PRODUCAO", iconName: "factory" },
];

const LEAN_STEPS: LeanStep[] = [
  { id: "seiri", order: 1, title: "Separar o necessário", description: "Retire do posto o que não será usado na atividade.", icon: "box" },
  { id: "seiton", order: 2, title: "Definir os lugares", description: "Dê um lugar identificado e de fácil acesso para cada item.", icon: "layers" },
  { id: "seiso", order: 3, title: "Limpar e inspecionar", description: "Elimine resíduos e verifique condições inseguras.", icon: "shield" },
  { id: "seiketsu", order: 4, title: "Padronizar o posto", description: "Use marcações e critérios iguais para manter a organização.", icon: "wrench" },
  { id: "shitsuke", order: 5, title: "Manter o padrão", description: "Transforme o cuidado diário em hábito de segurança.", icon: "factory" },
];

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function IconForItem({ icon, className = "h-5 w-5" }: { icon: ItemIconName; className?: string }) {
  const Icon = icon === "wrench" ? Wrench : icon === "shield" ? ShieldCheck : icon === "trash" ? Trash2 : icon === "factory" ? Factory : icon === "layers" ? Layers : Box;
  return <Icon className={className} aria-hidden="true" />;
}

const COLOR_CLASSES: Record<string, { border: string; soft: string; text: string; ring: string }> = {
  blue: { border: "border-blue-400/60", soft: "bg-blue-950/40", text: "text-blue-300", ring: "ring-blue-400/30" },
  emerald: { border: "border-emerald-400/60", soft: "bg-emerald-950/40", text: "text-emerald-300", ring: "ring-emerald-400/30" },
  amber: { border: "border-amber-400/60", soft: "bg-amber-950/40", text: "text-amber-300", ring: "ring-amber-400/30" },
  purple: { border: "border-purple-400/60", soft: "bg-purple-950/40", text: "text-purple-300", ring: "ring-purple-400/30" },
  red: { border: "border-red-400/60", soft: "bg-red-950/40", text: "text-red-300", ring: "ring-red-400/30" },
  cyan: { border: "border-cyan-400/60", soft: "bg-cyan-950/40", text: "text-cyan-300", ring: "ring-cyan-400/30" },
};

export const OrganizeFactoryGame: React.FC<OrganizeFactoryProps> = ({ difficulty, onBackToGames }) => {
  const { participant } = useParticipant();
  const { extendedTime } = useAccessibility();
  const requiredItemsCount = difficulty === "dificil" ? 12 : difficulty === "medio" ? 9 : 6;
  const physicalItems = useMemo(() => ALL_FACTORY_ITEMS.slice(0, requiredItemsCount), [requiredItemsCount]);
  const activeSlotIds = useMemo(() => new Set(physicalItems.map((item) => item.slotId)), [physicalItems]);
  const sequenceSteps = LEAN_STEPS;
  const basePointsPerTask = difficulty === "dificil" ? 300 : difficulty === "medio" ? 200 : 100;
  const totalTaskCount = physicalItems.length + sequenceSteps.length;
  const maxPossibleScore = totalTaskCount * basePointsPerTask;
  const baseAllowedTime = difficulty === "dificil" ? 150 : difficulty === "medio" ? 115 : 85;
  const totalAllowedTime = baseAllowedTime * (extendedTime ? 2 : 1);

  const [remainingTime, setRemainingTime] = useState(totalAllowedTime);
  const [availableItems, setAvailableItems] = useState<Item5S[]>(() => shuffleItems(physicalItems));
  const [placedSlots, setPlacedSlots] = useState<Record<string, Item5S>>({});
  const [selectedItem, setSelectedItem] = useState<Item5S | null>(null);
  const [draggedItem, setDraggedItem] = useState<Item5S | null>(null);
  const [sequencePool, setSequencePool] = useState<LeanStep[]>(() => shuffleItems(sequenceSteps));
  const [sequencePlaced, setSequencePlaced] = useState<(LeanStep | null)[]>(() => Array(sequenceSteps.length).fill(null));
  const [selectedSequenceStep, setSelectedSequenceStep] = useState<LeanStep | null>(null);
  const [draggedSequenceStep, setDraggedSequenceStep] = useState<LeanStep | null>(null);
  const [stage, setStage] = useState<"physical" | "lean">("physical");
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [wrongDrops, setWrongDrops] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalSubmitData, setFinalSubmitData] = useState<{ rank: number; isNewBest: boolean } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const remainingTimeRef = useRef(totalAllowedTime);
  const scoreRef = useRef(0);
  const wrongDropsRef = useRef(0);
  const completedTasksRef = useRef(0);
  const submitMutation = trpc.games.submitResult.useMutation();

  const physicalCompleted = Object.keys(placedSlots).length;
  const sequenceCompleted = sequencePlaced.filter(Boolean).length;
  const completedTasks = physicalCompleted + sequenceCompleted;

  useEffect(() => {
    if (isFinished || isPaused) return;
    timerRef.current = setInterval(() => {
      setRemainingTime((current) => {
        const next = current <= 1 ? 0 : current - 1;
        remainingTimeRef.current = next;
        if (next === 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          endGame(scoreRef.current, completedTasksRef.current, wrongDropsRef.current);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, isPaused]);

  const registerWrongAction = (message: string) => {
    const nextWrongDrops = wrongDropsRef.current + 1;
    wrongDropsRef.current = nextWrongDrops;
    setWrongDrops(nextWrongDrops);
    setFeedback({ text: message, isCorrect: false });
  };

  const registerCorrectAction = (message: string) => {
    const earned = Math.max(10, Math.round(basePointsPerTask * (remainingTimeRef.current / totalAllowedTime)));
    const nextScore = scoreRef.current + earned;
    scoreRef.current = nextScore;
    completedTasksRef.current += 1;
    setScore(nextScore);
    setFeedback({ text: `${message} +${earned} pontos`, isCorrect: true });
  };

  const endGame = (finalScore: number, organizedCount: number, wrongs: number) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
    const timeSpent = totalAllowedTime - remainingTimeRef.current;

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
          onSuccess: (data) => setFinalSubmitData({ rank: data.rank, isNewBest: data.isNewBest }),
          onError: () => setFeedback({ text: "Resultado concluído, mas não foi possível sincronizar o ranking.", isCorrect: false }),
        },
      );
    }
  };

  const selectedPhysicalItem = draggedItem || selectedItem;

  const handlePlaceInSlot = (slot: WorkstationSlot) => {
    if (stage !== "physical" || isFinished || isPaused) return;
    if (!selectedPhysicalItem) {
      setFeedback({ text: "Selecione um item da bancada e depois escolha o encaixe correspondente.", isCorrect: false });
      return;
    }
    if (placedSlots[slot.id]) {
      registerWrongAction("Esse encaixe já está ocupado. Escolha outro local do posto.");
      setSelectedItem(null);
      setDraggedItem(null);
      return;
    }
    if (selectedPhysicalItem.slotId !== slot.id) {
      registerWrongAction("Esse não é o encaixe correto. Observe a função e a identificação do local.");
      setSelectedItem(null);
      setDraggedItem(null);
      return;
    }

    registerCorrectAction("ENCAIXE CORRETO. ITEM ORGANIZADO!");
    setPlacedSlots((current) => ({ ...current, [slot.id]: selectedPhysicalItem }));
    setAvailableItems((current) => current.filter((item) => item.id !== selectedPhysicalItem.id));
    setSelectedItem(null);
    setDraggedItem(null);

    if (physicalCompleted + 1 === physicalItems.length) {
      setStage("lean");
      setFeedback({ text: "POSTO ORGANIZADO. Agora coloque as etapas 5S na sequência Lean correta.", isCorrect: true });
    }
  };

  const handlePlaceSequenceStep = (position: number) => {
    if (stage !== "lean" || isFinished || isPaused) return;
    const step = draggedSequenceStep || selectedSequenceStep;
    if (!step) {
      setFeedback({ text: "Selecione uma etapa Lean e depois escolha a posição na linha de fluxo.", isCorrect: false });
      return;
    }
    if (sequencePlaced[position]) {
      registerWrongAction("Essa posição já está preenchida. Escolha uma posição vazia.");
      setSelectedSequenceStep(null);
      setDraggedSequenceStep(null);
      return;
    }
    if (step.order !== position + 1) {
      registerWrongAction("Essa etapa ainda não vem agora. Reordene o fluxo seguindo o ciclo 5S.");
      setSelectedSequenceStep(null);
      setDraggedSequenceStep(null);
      return;
    }

    registerCorrectAction("ETAPA LEAN NO LUGAR CERTO!");
    setSequencePlaced((current) => {
      const next = [...current];
      next[position] = step;
      return next;
    });
    setSequencePool((current) => current.filter((item) => item.id !== step.id));
    setSelectedSequenceStep(null);
    setDraggedSequenceStep(null);

    if (sequenceCompleted + 1 === sequenceSteps.length) {
      endGame(scoreRef.current, completedTasksRef.current, wrongDropsRef.current);
    }
  };

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    remainingTimeRef.current = totalAllowedTime;
    scoreRef.current = 0;
    wrongDropsRef.current = 0;
    completedTasksRef.current = 0;
    setRemainingTime(totalAllowedTime);
    setAvailableItems(shuffleItems(physicalItems));
    setPlacedSlots({});
    setSelectedItem(null);
    setDraggedItem(null);
    setSequencePool(shuffleItems(sequenceSteps));
    setSequencePlaced(Array(sequenceSteps.length).fill(null));
    setSelectedSequenceStep(null);
    setDraggedSequenceStep(null);
    setStage("physical");
    setFeedback(null);
    setScore(0);
    setWrongDrops(0);
    setIsFinished(false);
    setIsPaused(false);
    submittedRef.current = false;
    setFinalSubmitData(null);
  };

  const groupedSlots = WORKSTATION_SLOTS.filter((slot) => activeSlotIds.has(slot.id)).reduce<Record<string, WorkstationSlot[]>>((groups, slot) => {
    (groups[slot.station] ||= []).push(slot);
    return groups;
  }, {});

  const stationOrder: StationKey[] = ["FERRAMENTAS", "EPIS", "RESIDUOS", "MATERIAIS", "DESCARTE", "PRODUCAO"];
  const stationMeta: Record<StationKey, { title: string; icon: ItemIconName; color: string }> = {
    FERRAMENTAS: { title: "Bancada de ferramentas", icon: "wrench", color: "blue" },
    EPIS: { title: "Estação de EPIs", icon: "shield", color: "emerald" },
    RESIDUOS: { title: "Ponto de resíduos", icon: "trash", color: "amber" },
    MATERIAIS: { title: "Almoxarifado", icon: "box", color: "purple" },
    DESCARTE: { title: "Área de descarte", icon: "trash", color: "red" },
    PRODUCAO: { title: "Linha de produção", icon: "factory", color: "cyan" },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#141822] p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/80 p-2.5 text-cyan-400">
            <SlidersHorizontal className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold tracking-widest text-cyan-400">5S • LEAN • ORGANIZAÇÃO VISUAL</span>
            <h2 className="font-industrial text-xl font-bold uppercase text-white">Organize a fábrica Cummins</h2>
            <p className="mt-1 text-xs text-slate-400">{stage === "physical" ? "Etapa 1: encaixe cada item no local correto do posto." : "Etapa 2: ordene o ciclo 5S para liberar o posto."}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div role="timer" aria-label={`${remainingTime} segundos restantes`} className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-4 py-2">
            <Clock className={`h-5 w-5 ${remainingTime <= 15 ? "animate-pulse text-red-500" : "text-amber-400"}`} aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] leading-none text-slate-400">TEMPO</span>
              <span className="font-industrial text-2xl font-black leading-none text-white">{remainingTime}s</span>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => setIsPaused((current) => !current)} aria-pressed={isPaused} className="min-h-11 border-white/20 text-white">
            {isPaused ? <Play className="mr-2 h-4 w-4" aria-hidden="true" /> : <Pause className="mr-2 h-4 w-4" aria-hidden="true" />}
            {isPaused ? "Continuar" : "Pausar"}
          </Button>
          <div className="text-right">
            <span className="font-mono text-[10px] text-slate-400">TAREFAS CONCLUÍDAS</span>
            <div className="font-industrial text-2xl font-black text-cyan-400">{completedTasks} / {totalTaskCount}</div>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className={`rounded-lg border p-3 ${stage === "physical" ? "border-cyan-400/60 bg-cyan-950/30" : "border-emerald-400/40 bg-emerald-950/20"}`}>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-white"><span className="font-mono text-cyan-300">01</span> Encaixe físico 5S {stage !== "physical" && <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-label="Concluído" />}</div>
          <p className="mt-1 text-[11px] text-slate-400">Organize os itens nos espaços demarcados do posto.</p>
        </div>
        <div className={`rounded-lg border p-3 ${stage === "lean" ? "border-amber-400/60 bg-amber-950/30" : "border-white/10 bg-black/20"}`}>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-white"><span className="font-mono text-amber-300">02</span> Fluxo Lean {sequenceCompleted === sequenceSteps.length && <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-label="Concluído" />}</div>
          <p className="mt-1 text-[11px] text-slate-400">Ordene o ciclo 5S antes de liberar a operação.</p>
        </div>
      </div>

      <div className="mb-4" aria-live="polite">
        {feedback ? (
          <div role="status" className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-bold sm:text-sm ${feedback.isCorrect ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300" : "border-red-500/50 bg-red-950/60 text-red-300"}`}>
            {feedback.isCorrect ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" /> : <XCircle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />}
            <span>{feedback.text}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-300">
            <Info className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
            <span>Selecione um item e escolha o encaixe correspondente. No celular, toque no item e depois no local de destino; no teclado, use Tab e Enter.</span>
          </div>
        )}
      </div>

      {stage === "physical" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#161a24] p-5 shadow-xl" aria-labelledby="items-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id="items-heading" className="flex items-center gap-2 font-industrial text-sm font-bold uppercase text-white"><Package className="h-4 w-4 text-amber-400" aria-hidden="true" /> Itens fora do lugar</h3>
              <span className="font-mono text-xs text-slate-400">{availableItems.length} restantes</span>
            </div>
            {availableItems.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-6 text-center font-industrial text-sm font-bold uppercase text-emerald-300">Posto organizado. Preparando o fluxo Lean…</div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableItems.map((item) => {
                  const selected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      draggable
                      onDragStart={() => setDraggedItem(item)}
                      onDragEnd={() => setDraggedItem(null)}
                      onClick={() => setSelectedItem((current) => current?.id === item.id ? null : item)}
                      disabled={isPaused}
                      aria-pressed={selected}
                      aria-label={`${item.name}. ${selected ? "Selecionado; escolha um encaixe." : "Selecionar item para organizar."}`}
                      className={`group min-h-[100px] rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${selected ? "scale-[1.02] border-cyan-300 bg-cyan-950/70 shadow-lg shadow-cyan-950/40" : "border-white/10 bg-black/40 hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-white/5"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 rounded-lg p-2 ${selected ? "bg-cyan-400/20 text-cyan-200" : "bg-white/5 text-slate-300"}`}><IconForItem icon={item.iconName} /></span>
                        <span className="min-w-0 flex-1 text-xs font-bold leading-tight text-white">{item.name}</span>
                        <GripVertical className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[10px] uppercase text-slate-500"><span>{selected ? "Selecionado" : "Arraste ou toque"}</span><span className="text-cyan-400">5S</span></div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="workstation-heading">
            <div className="mb-3 flex items-center gap-2"><Factory className="h-4 w-4 text-[#da291c]" aria-hidden="true" /><h3 id="workstation-heading" className="font-industrial text-sm font-bold uppercase text-white">Posto de trabalho — encaixes padronizados</h3></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stationOrder.map((station) => {
                const slots = groupedSlots[station];
                if (!slots?.length) return null;
                const meta = stationMeta[station];
                const colors = COLOR_CLASSES[meta.color];
                return (
                  <article key={station} className={`rounded-2xl border border-white/10 bg-[#141822] p-4 shadow-lg ${stage === "physical" ? "hover:border-white/20" : ""}`}>
                    <div className={`mb-3 flex items-center gap-2 border-b border-white/10 pb-3 ${colors.text}`}><IconForItem icon={meta.icon} className="h-5 w-5" /><h4 className="font-industrial text-xs font-black uppercase tracking-wide text-white">{meta.title}</h4></div>
                    <div className="space-y-2">
                      {slots.map((slot) => {
                        const placed = placedSlots[slot.id];
                        const slotColors = COLOR_CLASSES[slot.color];
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handlePlaceInSlot(slot)}
                            onClick={() => handlePlaceInSlot(slot)}
                            disabled={Boolean(placed) || isPaused}
                            aria-label={`${slot.label}. ${slot.hint}. ${placed ? `Organizado: ${placed.name}.` : "Encaixe vazio; selecione ou arraste um item para cá."}`}
                            className={`min-h-[94px] w-full rounded-xl border-2 border-dashed p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${placed ? `${slotColors.border} ${slotColors.soft} cursor-default` : `${slotColors.border} bg-black/20 hover:bg-white/10 hover:ring-2 ${slotColors.ring} disabled:opacity-50`}`}
                          >
                            {placed ? (
                              <div className="flex items-start gap-2"><span className="rounded-lg bg-emerald-400/15 p-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0"><span className="block text-[11px] font-black uppercase text-emerald-200">Encaixado</span><span className="mt-1 block truncate text-xs font-bold text-white">{placed.name}</span><span className="mt-1 block text-[10px] text-emerald-300/80">Local correto</span></span></div>
                            ) : (
                              <div className="flex items-start gap-2"><span className={`rounded-lg bg-white/5 p-2 ${slotColors.text}`}><Box className="h-4 w-4" aria-hidden="true" /></span><span><span className="block text-[11px] font-black uppercase text-white">{slot.label}</span><span className="mt-1 block text-[10px] text-slate-400">{slot.hint}</span><span className={`mt-2 block font-mono text-[9px] uppercase ${slotColors.text}`}>Solte ou selecione aqui</span></span></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <section className="space-y-6" aria-labelledby="lean-heading">
          <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/40 via-[#161a24] to-[#141822] p-5 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><div className="flex items-center gap-2 text-amber-300"><Layers className="h-5 w-5" aria-hidden="true" /><span className="font-mono text-[10px] font-black uppercase tracking-widest">Etapa 2 • Fluxo Lean</span></div><h3 id="lean-heading" className="mt-2 font-industrial text-2xl font-black uppercase text-white">Libere o posto seguindo o ciclo 5S</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">Agora organize as ações na ordem correta. Selecione uma etapa e depois escolha a posição vazia na linha de fluxo.</p></div>
              <div className="rounded-xl border border-amber-400/30 bg-black/30 px-4 py-3 text-right"><span className="block font-mono text-[10px] uppercase text-slate-400">Sequência</span><strong className="font-industrial text-2xl text-amber-300">{sequenceCompleted} / {sequenceSteps.length}</strong></div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5" aria-label="Linha de sequência 5S">
            {sequencePlaced.map((step, index) => (
              <button key={index} type="button" onClick={() => handlePlaceSequenceStep(index)} disabled={Boolean(step) || isPaused} aria-label={step ? `Posição ${index + 1}: ${step.title}` : `Posição ${index + 1} vazia; selecionar etapa Lean para encaixar`} className={`min-h-[150px] rounded-2xl border-2 border-dashed p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${step ? "border-emerald-400/70 bg-emerald-950/40" : "border-amber-400/50 bg-black/25 hover:bg-amber-950/30"}`}>
                <span className="font-mono text-[10px] font-black text-amber-300">ETAPA {index + 1}</span>
                {step ? <><span className="mt-4 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></span><strong className="mt-3 block text-xs font-black uppercase text-white">{step.title}</strong></> : <><span className="mt-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-amber-300"><ArrowRight className="h-5 w-5" aria-hidden="true" /></span><strong className="mt-3 block text-xs font-black uppercase text-amber-200">Próximo encaixe</strong><span className="mt-1 block text-[10px] text-slate-400">Selecione uma etapa</span></>}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161a24] p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-industrial text-sm font-bold uppercase text-white"><Package className="h-4 w-4 text-amber-400" aria-hidden="true" /> Etapas fora de ordem</h3><span className="font-mono text-xs text-slate-400">{sequencePool.length} restantes</span></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sequencePool.map((step) => {
                const selected = selectedSequenceStep?.id === step.id;
                return <button key={step.id} type="button" draggable onDragStart={() => setDraggedSequenceStep(step)} onDragEnd={() => setDraggedSequenceStep(null)} onClick={() => setSelectedSequenceStep((current) => current?.id === step.id ? null : step)} disabled={isPaused} aria-pressed={selected} className={`min-h-[118px] rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${selected ? "scale-[1.02] border-amber-300 bg-amber-950/60 shadow-lg" : "border-white/10 bg-black/30 hover:-translate-y-0.5 hover:border-amber-400/60"}`}><div className="flex items-start justify-between gap-3"><span className={`rounded-lg p-2 ${selected ? "bg-amber-400/20 text-amber-200" : "bg-white/5 text-slate-300"}`}><IconForItem icon={step.icon} /></span><GripVertical className="h-4 w-4 text-slate-500" aria-hidden="true" /></div><strong className="mt-3 block text-xs font-black uppercase text-white">{step.title}</strong><span className="mt-1 block text-[11px] leading-relaxed text-slate-400">{step.description}</span></button>;
              })}
            </div>
          </div>
        </section>
      )}

      {isPaused && !isFinished && (
        <div role="dialog" aria-modal="true" aria-label="Jogo pausado" className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4">
          <div className="max-w-sm rounded-2xl border border-white/20 bg-[#141822] p-6 text-center shadow-2xl"><Pause className="mx-auto h-9 w-9 text-amber-300" aria-hidden="true" /><h3 className="mt-3 text-xl font-black text-white">Jogo pausado</h3><p className="mt-2 text-sm text-slate-300">O cronômetro está parado e as áreas estão protegidas. Continue quando estiver pronto.</p><Button type="button" onClick={() => setIsPaused(false)} className="mt-5 min-h-11 w-full bg-[#da291c] text-white"><Play className="mr-2 h-4 w-4" aria-hidden="true" /> Continuar</Button></div>
        </div>
      )}

      <QuizFinalResultModal open={isFinished} onOpenChange={setIsFinished} playerName={participant?.name || "Colaborador"} playerWwid={participant?.wwid || "WWID"} gameTitle="Organize a Fábrica (5S & Lean)" score={score} maxScore={maxPossibleScore} correctCount={completedTasksRef.current} wrongCount={wrongDrops} totalQuestions={totalTaskCount} unitLabel="tarefas" resultHeading="DESAFIO CONCLUÍDO!" totalTimeSeconds={totalAllowedTime - remainingTime} difficulty={difficulty} currentRank={finalSubmitData?.rank || 1} isNewBest={finalSubmitData?.isNewBest} onPlayAgain={resetGame} onOtherChallenge={onBackToGames} />
    </div>
  );
};
