/* ==========================================================================
 * SpotErrorGame.tsx — "Ache o Erro"
 * Cummins SIPAT Challenge · Unidade CDBS Osasco
 * --------------------------------------------------------------------------
 * Jogo de comparação visual: duas fotos da mesma cena (uma segura, outra com
 * condições inseguras). O jogador clica nos riscos da cena com erros.
 *
 * Este arquivo substitui integralmente a versão anterior. As correções estão
 * comentadas ao longo do código com o marcador [FIX].
 *
 * Autocontido: não exige nenhuma dependência nova além das que o projeto já
 * usa (react, lucide-react, trpc, ParticipantContext).
 * ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crosshair,
  Eye,
  Flame,
  ImageOff,
  Lightbulb,
  ListChecks,
  Loader2,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useParticipant } from "@/contexts/ParticipantContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";

/* ==========================================================================
 * 1. TIPOS
 * ========================================================================== */

export type Difficulty = "facil" | "medio" | "dificil" | "muito_dificil";

type Shape = "retangulo" | "circulo" | "poligono";

export type Point = { x: number; y: number };

/** Risco a ser encontrado. Coordenadas sempre em % (0–100) da imagem original. */
export type Hazard = {
  id: string;
  name: string;
  desc: string;
  hint: string | null;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tolerance: number;
  shape: Shape;
  points?: Point[];
  /** true quando o risco foi desenhado à mão para esta cena (tem dica escrita). */
  curated: boolean;
};

type Feedback = {
  kind: "hit" | "miss" | "near" | "hint" | "info" | "order";
  title: string;
  text: string;
  points?: number;
};

/** Máquina de estados do jogo. Substitui os antigos booleanos soltos. */
type Phase = "briefing" | "countdown" | "playing" | "paused" | "finished";

/** Retângulo da imagem realmente pintada dentro do palco (object-contain). */
type Box = { left: number; top: number; width: number; height: number };

/** Efeito visual temporário na camada da imagem. */
type Floater = {
  id: number;
  x: number;
  y: number;
  kind: "hit" | "miss";
  label: string;
};

interface SpotErrorGameProps {
  difficulty: Difficulty;
  onBackToGames: () => void;
  initialScenarioKey?: string;
  previewOnly?: boolean;
  previewAdminKey?: string;
}

/* ==========================================================================
 * 2. CONFIGURAÇÃO — todo o balanceamento fica aqui
 * ========================================================================== */

const DIFFICULTY: Record<
  Difficulty,
  {
    label: string;
    time: number;
    multiplier: number;
    hintCount: number;
    /** Teto de riscos pedidos. O jogo nunca pede mais do que a fase tem. */
    maxErrors: number;
    /** Avisa "quase!" quando o clique cai perto de um risco ainda não achado. */
    nearMiss: boolean;
    blurb: string;
  }
> = {
  facil: {
    label: "Treino",
    time: 120,
    multiplier: 1,
    hintCount: 3,
    maxErrors: 5,
    nearMiss: true,
    blurb: "Tempo folgado e aviso quando você chega perto de um risco.",
  },
  medio: {
    label: "Padrão",
    time: 90,
    multiplier: 1.25,
    hintCount: 2,
    maxErrors: 7,
    nearMiss: true,
    blurb: "Ritmo da inspeção real: menos dicas e penalidade por clique errado.",
  },
  dificil: {
    label: "Inspetor",
    time: 75,
    multiplier: 1.6,
    hintCount: 1,
    maxErrors: 10,
    nearMiss: false,
    blurb: "Uma dica só, sem aviso de proximidade.",
  },
  muito_dificil: {
    label: "Auditoria",
    time: 60,
    multiplier: 2,
    hintCount: 0,
    maxErrors: 15,
    nearMiss: false,
    blurb: "Sem dicas, tempo curto e penalidade cheia. Pontuação dobrada.",
  },
};

/* Pontuação — ajuste livre, tudo centralizado */
const BASE_HIT_POINTS = 100;
const TIME_BONUS_DIVISOR = 3; // +1 ponto a cada 3 segundos restantes
const COMBO_STEP = 0.15; // cada acerto seguido soma 15%
const MAX_COMBO_MULTIPLIER = 1.6;
const COMPLETION_BONUS = 150;
const SPEED_BONUS_PER_SECOND = 2;

/* Interação */
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const TAP_THRESHOLD_PX = 8; // acima disso o gesto vira arraste, não clique
const NEAR_MISS_RADIUS = 11; // em % da imagem
const HINT_RING_RADIUS = 13; // em % da largura da imagem
const FEEDBACK_MS = 4200;
const COUNTDOWN_FROM = 3;

/* ==========================================================================
 * 3. UTILITÁRIOS PUROS
 * ========================================================================== */

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
};

/** Hash estável para embaralhar sempre igual dentro da mesma fase/rodada. */
function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Fisher–Yates determinístico: mesma semente, mesma ordem. */
function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swap = state % (index + 1);
    const a = result[index] as T;
    const b = result[swap] as T;
    result[index] = b;
    result[swap] = a;
  }
  return result;
}

/**
 * [FIX] Retângulo realmente ocupado pela imagem dentro do palco.
 *
 * A imagem usa object-contain, então quando a proporção do palco difere da
 * proporção natural sobram barras laterais. Esta função é a ÚNICA fonte de
 * verdade da geometria: é usada tanto para detectar o clique quanto para
 * posicionar os marcadores. Na versão anterior o clique compensava as barras
 * e os marcadores não — por isso o X aparecia deslocado do ponto clicado.
 */
function computeImageBox(stageWidth: number, stageHeight: number, ratio: number): Box {
  if (!stageWidth || !stageHeight || !Number.isFinite(ratio) || ratio <= 0) {
    return { left: 0, top: 0, width: stageWidth, height: stageHeight };
  }
  const stageRatio = stageWidth / stageHeight;
  const width = stageRatio > ratio ? stageHeight * ratio : stageWidth;
  const height = stageRatio > ratio ? stageHeight : stageWidth / ratio;
  return {
    left: (stageWidth - width) / 2,
    top: (stageHeight - height) / 2,
    width,
    height,
  };
}

/** Ray casting padrão para polígonos. */
function pointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i] as Point;
    const b = polygon[j] as Point;
    const intersects =
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y || Number.EPSILON) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  return Math.hypot(point.x - (start.x + projection * dx), point.y - (start.y + projection * dy));
}

/**
 * Teste de acerto. [FIX] Garante área mínima clicável: se o cadastro vier sem
 * largura/altura/tolerância, a versão anterior virava um ponto matemático e o
 * risco ficava impossível de acertar.
 */
export function isPointInHazard(x: number, y: number, hazard: Hazard): boolean {
  const width = Math.max(hazard.width || 0, 0.1);
  const height = Math.max(hazard.height || 0, 0.1);
  // Tolerance is a small percentage of the actual hotspot, never a global radius.
  const tolerance = Math.min(Math.max(hazard.tolerance || 0, 0), Math.min(width, height) * 0.02);

  if (hazard.shape === "poligono" && hazard.points && hazard.points.length >= 3) {
    const polygon = hazard.points;
    if (pointInPolygon(x, y, polygon)) return true;
    const click = { x, y };
    return polygon.some((point, index) => distanceToSegment(click, point, polygon[(index + 1) % polygon.length]!) <= tolerance);
  }

  const rx = width / 2 + tolerance;
  const ry = height / 2 + tolerance;

  if (hazard.shape === "circulo") {
    return ((x - hazard.x) / rx) ** 2 + ((y - hazard.y) / ry) ** 2 <= 1;
  }

  return (
    x >= hazard.x - rx && x <= hazard.x + rx && y >= hazard.y - ry && y <= hazard.y + ry
  );
}

/** Distância do clique até a borda aproximada do risco, em % da imagem. */
function distanceToHazard(x: number, y: number, hazard: Hazard): number {
  const halfWidth = Math.max(hazard.width || 0, 0.1) / 2;
  const halfHeight = Math.max(hazard.height || 0, 0.1) / 2;
  const dx = Math.max(0, Math.abs(x - hazard.x) - halfWidth);
  const dy = Math.max(0, Math.abs(y - hazard.y) - halfHeight);
  return Math.hypot(dx, dy);
}

/* ==========================================================================
 * 4. HOOKS AUXILIARES
 * ========================================================================== */

/**
 * Callback com identidade estável que sempre enxerga o estado mais recente.
 * [FIX] O cronômetro antigo era criado com deps [started, finished] e
 * congelava valores como `required` e `soundOn`; ao acabar o tempo o jogo
 * comparava acertos contra um total desatualizado e podia conceder o bônus de
 * fase completa sem o jogador ter encontrado nada.
 */
function useEvent<Args extends unknown[], Result>(
  handler: (...args: Args) => Result
): (...args: Args) => Result {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  return useCallback((...args: Args) => ref.current(...args), []);
}

/** Mede o palco e reage a redimensionamento, rotação de tela e zoom do browser. */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const rect = entry.contentRect;
      setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    setSize({ width: element.clientWidth, height: element.clientHeight });
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

type PreloadState = { status: "idle" | "loading" | "ready" | "error"; ratio: number };

/**
 * Pré-carrega as duas cenas antes de liberar o início.
 * [FIX] Antes o jogo começava com as imagens ainda baixando e, se uma URL
 * quebrasse, o jogador ficava olhando um retângulo preto sem explicação.
 */
function useScenePreload(sources: string[]): PreloadState {
  const key = sources.join("|");
  const [state, setState] = useState<PreloadState>({ status: "idle", ratio: 16 / 9 });

  useEffect(() => {
    const list = key.split("|").filter(Boolean);
    if (!list.length) {
      setState({ status: "idle", ratio: 16 / 9 });
      return;
    }

    let cancelled = false;
    setState((previous) => ({ status: "loading", ratio: previous.ratio }));

    let firstRatio = 0;
    let failed = false;
    let done = 0;

    const settle = () => {
      done += 1;
      if (cancelled || done < list.length) return;
      setState({ status: failed ? "error" : "ready", ratio: firstRatio || 16 / 9 });
    };

    list.forEach((source, index) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        /* [FIX] A proporção do palco vem sempre da cena com erros (índice 0).
         * Antes, as duas imagens gravavam no mesmo estado pelo onLoad e
         * brigavam entre si quando tinham proporções diferentes. */
        if (index === 0 && image.naturalWidth && image.naturalHeight) {
          firstRatio = image.naturalWidth / image.naturalHeight;
        }
        settle();
      };
      image.onerror = () => {
        failed = true;
        settle();
      };
      image.src = source;
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}

/**
 * Áudio do jogo.
 * [FIX] A versão anterior criava um `new AudioContext()` a cada bipe e nunca
 * fechava. O Chrome permite ~6 contextos por aba: depois disso o som morria e
 * o console enchia de erro. Aqui existe um único contexto, criado no primeiro
 * gesto do usuário e reaproveitado.
 */
function useGameAudio(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!contextRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      try {
        contextRef.current = new Ctor();
      } catch {
        return null;
      }
    }
    if (contextRef.current.state === "suspended") void contextRef.current.resume();
    return contextRef.current;
  }, []);

  useEffect(
    () => () => {
      void contextRef.current?.close();
      contextRef.current = null;
    },
    []
  );

  const play = useEvent(
    (
      notes: { freq: number; at: number; dur: number; gain?: number }[],
      type: OscillatorType = "sine"
    ) => {
      if (!enabled) return;
      const context = getContext();
      if (!context) return;
      const now = context.currentTime;
      notes.forEach((note) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + note.at;
        const peak = note.gain ?? 0.05;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(note.freq, start);
        // Envelope curto evita o "clique" seco do corte abrupto.
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + note.dur + 0.02);
      });
    }
  );

  return useMemo(
    () => ({
      hit: (combo: number) =>
        play([
          { freq: 660 + Math.min(combo, 5) * 60, at: 0, dur: 0.1 },
          { freq: 990 + Math.min(combo, 5) * 60, at: 0.06, dur: 0.14 },
        ]),
      miss: () => play([{ freq: 180, at: 0, dur: 0.16, gain: 0.04 }], "triangle"),
      hint: () =>
        play([
          { freq: 520, at: 0, dur: 0.1 },
          { freq: 700, at: 0.07, dur: 0.1 },
        ]),
      tick: () => play([{ freq: 880, at: 0, dur: 0.05, gain: 0.03 }]),
      start: () =>
        play([
          { freq: 440, at: 0, dur: 0.1 },
          { freq: 660, at: 0.1, dur: 0.16 },
        ]),
      win: () =>
        play([
          { freq: 660, at: 0, dur: 0.14 },
          { freq: 880, at: 0.12, dur: 0.14 },
          { freq: 1175, at: 0.24, dur: 0.26 },
        ]),
      lose: () =>
        play(
          [
            { freq: 300, at: 0, dur: 0.2 },
            { freq: 200, at: 0.16, dur: 0.3 },
          ],
          "triangle"
        ),
    }),
    [play]
  );
}

/* ==========================================================================
 * 5. ANIMAÇÕES (injetadas uma única vez, sem dependência externa)
 * ========================================================================== */

const STYLE_ID = "spot-error-game-styles";

const GAME_CSS = `
@keyframes seg-stamp {
  0%   { transform: translate(-50%,-50%) scale(2.4); opacity: 0; }
  55%  { transform: translate(-50%,-50%) scale(.88); opacity: 1; }
  100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
}
@keyframes seg-ripple {
  0%   { transform: translate(-50%,-50%) scale(.35); opacity: .85; }
  100% { transform: translate(-50%,-50%) scale(2.6); opacity: 0; }
}
@keyframes seg-float {
  0%   { transform: translate(-50%,-50%); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translate(-50%,-190%); opacity: 0; }
}
@keyframes seg-shake {
  0%,100% { transform: translate(-50%,-50%) rotate(0deg); }
  25%     { transform: translate(-62%,-50%) rotate(-6deg); }
  75%     { transform: translate(-38%,-50%) rotate(6deg); }
}
@keyframes seg-hint {
  0%,100% { transform: translate(-50%,-50%) scale(1);    opacity: .95; }
  50%     { transform: translate(-50%,-50%) scale(1.14); opacity: .45; }
}
@keyframes seg-pop {
  0%   { transform: scale(.92); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}
@keyframes seg-slide {
  0%   { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0);    opacity: 1; }
}
@keyframes seg-count {
  0%   { transform: scale(.4);  opacity: 0; }
  30%  { transform: scale(1);   opacity: 1; }
  100% { transform: scale(1.7); opacity: 0; }
}
.seg-stamp  { animation: seg-stamp .34s cubic-bezier(.2,1.4,.4,1) both; }
.seg-ripple { animation: seg-ripple .7s ease-out both; }
.seg-float  { animation: seg-float 1.1s cubic-bezier(.2,.8,.3,1) both; }
.seg-shake  { animation: seg-shake .34s ease-in-out both; }
.seg-hint   { animation: seg-hint 1.15s ease-in-out infinite; }
.seg-pop    { animation: seg-pop .22s ease-out both; }
.seg-slide  { animation: seg-slide .26s ease-out both; }
.seg-count  { animation: seg-count .9s ease-out both; }
.seg-focus:focus-visible { outline: 2px solid #ffc72c; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .seg-stamp, .seg-ripple, .seg-float, .seg-shake, .seg-hint,
  .seg-pop, .seg-slide, .seg-count {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`;

function useGameStyles() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = GAME_CSS;
    document.head.appendChild(style);
  }, []);
}

/* ==========================================================================
 * 6. SUBCOMPONENTES DE APOIO
 * ========================================================================== */

function StatTile({
  label,
  value,
  tone = "default",
  alert = false,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "red" | "amber" | "emerald" | "cyan";
  alert?: boolean;
}) {
  const toneClass: Record<string, string> = {
    default: "text-white",
    red: "text-red-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
  };

  return (
    <div
      className={`rounded-xl border px-3 py-2 transition-colors ${
        alert ? "border-red-500/60 bg-red-950/40" : "border-white/10 bg-black/30"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <strong
        className={`font-industrial text-xl leading-tight tabular-nums ${toneClass[tone]}`}
      >
        {value}
      </strong>
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="seg-focus rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/* ==========================================================================
 * 7. O PALCO — onde mora toda a geometria
 * ========================================================================== */

type StageProps = {
  image: string;
  alt: string;
  caption: string;
  interactive: boolean;
  ratio: number;
  zoom: number;
  pan: Point;
  blurred: boolean;
  markers?: React.ReactNode;
  onGeometry?: (stage: { width: number; height: number }) => void;
  onTap?: (percentX: number, percentY: number) => void;
  onPanChange?: (pan: Point) => void;
  onZoomAt?: (nextZoom: number, clientX: number, clientY: number) => void;
};

function Stage({
  image,
  alt,
  caption,
  interactive,
  ratio,
  zoom,
  pan,
  blurred,
  markers,
  onGeometry,
  onTap,
  onPanChange,
  onZoomAt,
}: StageProps) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const [broken, setBroken] = useState(false);

  const box = useMemo(
    () => computeImageBox(size.width, size.height, ratio),
    [size.width, size.height, ratio]
  );

  useEffect(() => {
    setBroken(false);
  }, [image]);

  useEffect(() => {
    onGeometry?.(size);
  }, [size, onGeometry]);

  /* --- Gestos: um único fluxo de pointer events para mouse, caneta e toque ---
   * [FIX] A versão anterior misturava onClick com pointer events e usava um
   * "ignoreClickRef" para descartar o clique depois do arraste. Aqui o gesto é
   * decidido no pointerup: andou menos que o limiar, é clique; andou mais, foi
   * arraste. Sem estado fantasma e com suporte a pinça de dois dedos. */
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    originPan: { x: 0, y: 0 } as Point,
    pinchDistance: 0,
    pinchZoom: 1,
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointers.current.size === 1) {
      gesture.current.dragging = true;
      gesture.current.moved = false;
      gesture.current.startX = event.clientX;
      gesture.current.startY = event.clientY;
      gesture.current.originPan = { x: pan.x, y: pan.y };
    } else if (pointers.current.size === 2) {
      const values = Array.from(pointers.current.values());
      const a = values[0];
      const b = values[1];
      if (a && b) {
        gesture.current.pinchDistance = Math.hypot(b.x - a.x, b.y - a.y);
        gesture.current.pinchZoom = zoom;
        gesture.current.moved = true;
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    // Pinça de dois dedos
    if (pointers.current.size === 2) {
      const values = Array.from(pointers.current.values());
      const a = values[0];
      const b = values[1];
      if (!a || !b || !gesture.current.pinchDistance) return;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const next = clamp(
        (gesture.current.pinchZoom * distance) / gesture.current.pinchDistance,
        MIN_ZOOM,
        MAX_ZOOM
      );
      onZoomAt?.(next, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }

    if (!gesture.current.dragging) return;
    const deltaX = event.clientX - gesture.current.startX;
    const deltaY = event.clientY - gesture.current.startY;
    if (Math.hypot(deltaX, deltaY) > TAP_THRESHOLD_PX) gesture.current.moved = true;
    if (zoom <= 1 || !gesture.current.moved) return;

    onPanChange?.({
      x: gesture.current.originPan.x + deltaX,
      y: gesture.current.originPan.y + deltaY,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const hadPointer = pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (pointers.current.size > 0) return;

    const wasDrag = gesture.current.moved;
    gesture.current.dragging = false;
    gesture.current.pinchDistance = 0;
    if (!hadPointer || wasDrag || !onTap) return;

    /* Conversão ponteiro → % da imagem:
     * 1) desfaz a transformação visual (escala + deslocamento);
     * 2) desconta as barras do object-contain com o MESMO cálculo do render. */
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const localX =
      (event.clientX - rect.left - rect.width / 2 - pan.x) / zoom + rect.width / 2;
    const localY =
      (event.clientY - rect.top - rect.height / 2 - pan.y) / zoom + rect.height / 2;

    const liveBox = computeImageBox(rect.width, rect.height, ratio);
    if (!liveBox.width || !liveBox.height) return;

    const percentX = ((localX - liveBox.left) / liveBox.width) * 100;
    const percentY = ((localY - liveBox.top) / liveBox.height) * 100;
    if (percentX < 0 || percentX > 100 || percentY < 0 || percentY > 100) return;

    onTap(percentX, percentY);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!interactive || !onZoomAt) return;
    const direction = event.deltaY > 0 ? -1 : 1;
    onZoomAt(
      clamp(zoom + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM),
      event.clientX,
      event.clientY
    );
  };

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full touch-none overflow-hidden bg-black"
      style={{
        aspectRatio: String(ratio),
        maxHeight: "70vh",
        cursor: interactive ? (zoom > 1 ? "grab" : "crosshair") : "default",
      }}
    >
      <div
        className="absolute inset-0 origin-center will-change-transform"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transition: "transform .16s cubic-bezier(.2,.8,.3,1)",
        }}
      >
        {broken ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#15171d] text-slate-500">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs">Imagem indisponível</span>
          </div>
        ) : (
          <img
            src={image}
            alt={alt}
            draggable={false}
            onError={() => setBroken(true)}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
            style={{ filter: blurred ? "blur(14px) brightness(.5)" : "none" }}
          />
        )}

        {/* Camada de marcadores: exatamente sobre a imagem pintada. */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
          }}
        >
          {markers}
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/75 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {caption}
      </div>
    </div>
  );
}

/* ==========================================================================
 * 8. COMPONENTE PRINCIPAL
 * ========================================================================== */

export const SpotErrorGame: React.FC<SpotErrorGameProps> = ({
  difficulty,
  onBackToGames,
  initialScenarioKey,
  previewOnly = false,
  previewAdminKey,
}) => {
  useGameStyles();

  const { participant } = useParticipant();
  const { extendedTime } = useAccessibility();
  const config = DIFFICULTY[difficulty];

  /* --- Dados do servidor --- */
  const catalogQuery = trpc.games.getScenarioCatalog.useQuery();
  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);

  const [scenarioKey, setScenarioKey] = useState(initialScenarioKey ?? "");
  const [round, setRound] = useState(0);

  /* [FIX] A chave inicial era um literal fixo ("cdbs-v4-montagem-2026"). Se o
   * banco não tivesse exatamente essa fase, o select ficava vazio e a consulta
   * de hotspots voltava sem nada — jogo impossível e sem mensagem de erro.
   * Agora a primeira fase do catálogo é adotada automaticamente. */
  useEffect(() => {
    if (!catalog.length) return;
    const exists = catalog.some((item) => item.key === scenarioKey);
    if (!exists) setScenarioKey(catalog[0]!.key);
  }, [catalog, scenarioKey]);

  const scenario = catalog.find((item) => item.key === scenarioKey);

  const hotspotsQuery = trpc.games.getSpotErrorHotspots.useQuery(
    { scenarioKey, adminKey: previewOnly ? previewAdminKey : undefined },
    { enabled: Boolean(scenarioKey) }
  );
  const submit = trpc.games.submitResult.useMutation();

  /* --- Parâmetros da fase --- */
  const baseStageTime = clamp(
    Number.isFinite(Number(scenario?.timeSeconds)) ? Number(scenario?.timeSeconds) : config.time,
    1,
    config.time
  );
  const stageTime = baseStageTime * (extendedTime ? 2 : 1);
  const stageHints =
    difficulty === "muito_dificil"
      ? 0
      : clamp(
          Number.isFinite(Number(scenario?.hintCount))
            ? Number(scenario?.hintCount)
            : config.hintCount,
          0,
          config.hintCount
        );
  const hintCost = Math.max(0, Number(scenario?.hintCost) || 8);
  const wrongPenalty = Math.max(
    0,
    Number(scenario?.wrongClickPenalty) || (difficulty === "facil" ? 0 : 2)
  );
  const sequential = scenario?.phaseMode === "sequenciais";

  /* --- Estado de jogo --- */
  const [phase, setPhase] = useState<Phase>("briefing");
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const [remaining, setRemaining] = useState(stageTime);
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [hints, setHints] = useState(stageHints);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintRing, setHintRing] = useState<Point | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [mobileTab, setMobileTab] = useState<"safe" | "errors">("errors");
  const [submitted, setSubmitted] = useState<{ rank: number; isNewBest: boolean } | null>(
    null
  );

  const stageSizeRef = useRef({ width: 0, height: 0 });
  const floaterId = useRef(0);
  /* [FIX] Espelho do tempo e trava de encerramento. Em React 19 o StrictMode
   * executa updaters de setState duas vezes em desenvolvimento; sem esta trava
   * o resultado podia ser enviado ao ranking em duplicidade. */
  const remainingRef = useRef(stageTime);
  const finishedRef = useRef(false);
  const audio = useGameAudio(soundOn);

  /* --- Normalização dos hotspots --- */
  const hazards = useMemo<Hazard[]>(() => {
    const rows = hotspotsQuery.data ?? [];
    return rows.map((row) => {
      let points: Point[] | undefined;
      if (row.points) {
        try {
          const parsed = JSON.parse(row.points) as Point[];
          const valid = parsed.filter(
            (point) => Number.isFinite(point?.x) && Number.isFinite(point?.y)
          );
          if (valid.length >= 3) points = valid;
        } catch {
          points = undefined;
        }
      }
      const hint = typeof row.hint === "string" && row.hint.trim() ? row.hint.trim() : null;
      const shape: Shape = row.shape === "circulo" || row.shape === "poligono" ? row.shape : "retangulo";
      return {
        id: String(row.id),
        name: String(row.title ?? "Risco sem nome"),
        desc: String(row.description ?? "Condição insegura identificada."),
        hint,
        category: String(row.category ?? "Geral"),
        x: clamp(Number(row.x) || 0, 0, 100),
        y: clamp(Number(row.y) || 0, 0, 100),
        width: Math.max(0, Number(row.width) || 0),
        height: Math.max(0, Number(row.height) || 0),
        tolerance: Math.max(0, Number(row.tolerance) || 0),
        shape,
        points,
        curated: Boolean(hint),
      };
    });
  }, [hotspotsQuery.data]);

  /**
   * Seleção dos alvos da rodada.
   *
   * [FIX] A versão anterior fazia `sort((a,b) => Number(b.id) - Number(a.id))`
   * e cortava pelos primeiros: sempre os hotspots de maior id no banco. Como os
   * riscos genéricos foram inseridos depois dos riscos desenhados à mão para a
   * cena, o modo Treino acabava pedindo justamente os genéricos — alguns sem
   * diferença visível entre as duas fotos.
   *
   * Agora: riscos curados (com dica escrita) entram primeiro, o sorteio é
   * determinístico por fase+rodada, e a lista final é ordenada em leitura
   * natural (cima→baixo, esquerda→direita) para o checklist fazer sentido.
   */
  const targets = useMemo<Hazard[]>(() => {
    if (!hazards.length) return [];
    const seed = hashSeed(`${scenarioKey}::${difficulty}::${round}`);
    const curated = seededShuffle(
      hazards.filter((hazard) => hazard.curated),
      seed
    );
    const generic = seededShuffle(
      hazards.filter((hazard) => !hazard.curated),
      seed ^ 0x5bf03635
    );
    return [...curated, ...generic]
      .slice(0, config.maxErrors)
      .sort((a, b) => a.y - b.y || a.x - b.x);
  }, [hazards, scenarioKey, difficulty, round, config.maxErrors]);

  /* [FIX] `required` é o número real de riscos da fase. A tela inicial antiga
   * anunciava `config.maxErrors` (até 15) enquanto cada cena tem 7 riscos. */
  const required = targets.length;
  const progress = required ? Math.round((found.length / required) * 100) : 0;
  const nextInOrder = targets.find((hazard) => !found.includes(hazard.id));

  /* --- Pré-carregamento das cenas --- */
  const errorImage = scenario?.image ?? "";
  const safeImage = scenario?.safeImage ?? errorImage;
  const preload = useScenePreload(
    errorImage ? [errorImage, safeImage].filter(Boolean) : []
  );
  const ratio = preload.ratio;

  const loading = catalogQuery.isLoading || hotspotsQuery.isLoading;
  const hasScenario = Boolean(scenario && errorImage);
  const canPlay = hasScenario && required > 0;

  /* --- Sincronia de parâmetros ---
   * [FIX] `remaining` e `hints` eram inicializados no primeiro render, antes da
   * resposta do servidor, e nunca mais atualizados. Se o admin configurasse 60s
   * na fase, o cronômetro ainda largava com o tempo padrão da dificuldade. */
  useEffect(() => {
    if (phase !== "briefing") return;
    remainingRef.current = stageTime;
    finishedRef.current = false;
    setRemaining(stageTime);
    setHints(stageHints);
  }, [phase, stageTime, stageHints]);

  /* --- Expiração automática dos avisos --- */
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!hintRing) return;
    const timer = window.setTimeout(() => setHintRing(null), 3200);
    return () => window.clearTimeout(timer);
  }, [hintRing]);

  useEffect(() => {
    if (!pulseId) return;
    const timer = window.setTimeout(() => setPulseId(null), 900);
    return () => window.clearTimeout(timer);
  }, [pulseId]);

  const pushFloater = useCallback(
    (x: number, y: number, kind: Floater["kind"], label: string) => {
      floaterId.current += 1;
      const id = floaterId.current;
      setFloaters((current) => [...current, { id, x, y, kind, label }]);
      window.setTimeout(
        () => setFloaters((current) => current.filter((item) => item.id !== id)),
        1200
      );
    },
    []
  );

  /* --- Encerramento da fase --- */
  const finish = useEvent((finalState?: { hits?: number; score?: number }) => {
    if (finishedRef.current || phase === "finished") return;
    finishedRef.current = true;

    /* Lê o tempo pelo espelho: o state ainda não foi liberado quando finish é
     * chamado logo após um setRemaining no mesmo tick. Quando o encerramento
     * acontece no último acerto, recebe também os valores calculados nesse
     * mesmo evento para não usar o state anterior do React. */
    const secondsLeft = Math.max(0, remainingRef.current);
    const hits = finalState?.hits ?? found.length;
    const currentScore = finalState?.score ?? score;
    const perfectRun = required > 0 && hits === required;
    const completion = perfectRun ? COMPLETION_BONUS : 0;
    const speed = perfectRun ? secondsLeft * SPEED_BONUS_PER_SECOND : 0;
    const total = Math.max(0, currentScore + completion + speed);

    setScore(total);
    setPhase("finished");
    if (perfectRun) audio.win();
    else audio.lose();

    if (!previewOnly && required > 0) {
      submit.mutate(
        {
          participantChapa: participant?.chapa || "SEM-CHAPA",
          participantName: participant?.name || "Colaborador",
          participantWwid: participant?.wwid || "WWID",
          scenarioKey,
          gameType: "ache_o_erro",
          difficulty,
          score: total,
          correctCount: hits,
          wrongCount: wrong,
          hintsUsed,
          timeSpentSeconds: Math.max(1, stageTime - secondsLeft),
        },
        {
          onSuccess: (data) =>
            setSubmitted({ rank: data.rank, isNewBest: data.isNewBest }),
        }
      );
    }
  });

  /* --- Cronômetro: um único intervalo com callback estável --- */
  const tick = useEvent(() => {
    const next = Math.max(0, remainingRef.current - 1);
    remainingRef.current = next;
    setRemaining(next);
    if (next > 0 && next <= 10) audio.tick();
    if (next === 0) finish();
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase, tick]);

  /* --- Contagem regressiva de entrada --- */
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      audio.start();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 750);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, audio]);

  /* --- Pausa automática ao trocar de aba (evita estudar a cena com o relógio parado) --- */
  useEffect(() => {
    if (phase !== "playing") return;
    const onHide = () => {
      if (document.visibilityState === "hidden") setPhase("paused");
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [phase]);

  /* --- Zoom e deslocamento ---
   * [FIX] O limite de pan era `50 * (zoom - 1)` — 50 pixels fixos,
   * independentemente do tamanho do palco. Num palco de 900px com zoom 2.5x a
   * imagem transborda 675px de cada lado, então quase 90% dela ficava fora de
   * alcance: riscos nas bordas (há vários em x=91, x=95, y=91) eram
   * literalmente inacessíveis. O limite agora vem do transbordo real. */
  const clampPan = useCallback((next: Point, currentZoom: number): Point => {
    const { width, height } = stageSizeRef.current;
    const maxX = Math.max(0, (width * (currentZoom - 1)) / 2);
    const maxY = Math.max(0, (height * (currentZoom - 1)) / 2);
    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, []);

  const applyZoom = useCallback(
    (nextZoom: number) => {
      const target = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      setZoom((currentZoom) => {
        if (target === currentZoom) return currentZoom;
        if (target === MIN_ZOOM) {
          setPan({ x: 0, y: 0 });
          return target;
        }
        const ratioChange = target / currentZoom;
        setPan((currentPan) =>
          clampPan(
            { x: currentPan.x * ratioChange, y: currentPan.y * ratioChange },
            target
          )
        );
        return target;
      });
    },
    [clampPan]
  );

  const handleGeometry = useCallback((stage: { width: number; height: number }) => {
    stageSizeRef.current = stage;
  }, []);

  /* --- Interação principal --- */
  const registerHit = (hazard: Hazard) => {
    if (found.includes(hazard.id) || phase !== "playing") return;
    const nextCombo = combo + 1;
    const comboMultiplier = Math.min(
      MAX_COMBO_MULTIPLIER,
      1 + (nextCombo - 1) * COMBO_STEP
    );
    const earned = Math.round(
      (BASE_HIT_POINTS + remaining / TIME_BONUS_DIVISOR) *
        config.multiplier *
        comboMultiplier
    );

    const nextFound = [...found, hazard.id];
    const nextScore = score + earned;
    setFound(nextFound);
    setScore(nextScore);
    setCombo(nextCombo);
    setBestCombo((current) => Math.max(current, nextCombo));
    setHintRing(null);
    pushFloater(hazard.x, hazard.y, "hit", `+${earned}`);
    audio.hit(nextCombo);

    setFeedback({
      kind: "hit",
      title: `${hazard.name} — risco identificado`,
      text:
        nextCombo > 1
          ? `${hazard.desc} Sequência de ${nextCombo} acertos: bônus de ${Math.round(
              (comboMultiplier - 1) * 100
            )}%.`
          : hazard.desc,
      points: earned,
    });

    if (nextFound.length === required) {
      finish({ hits: nextFound.length, score: nextScore });
    }
  };

  const registerMiss = (x: number, y: number) => {
    setWrong((current) => current + 1);
    setCombo(0);
    audio.miss();
    pushFloater(x, y, "miss", wrongPenalty ? `-${wrongPenalty}s` : "errou");

    if (wrongPenalty) {
      const next = Math.max(0, remainingRef.current - wrongPenalty);
      remainingRef.current = next;
      setRemaining(next);
      if (next === 0) {
        finish();
        return;
      }
    }

    // Aviso de proximidade nos modos de treino: dá direção sem entregar o ponto.
    if (config.nearMiss) {
      const distances = targets
        .filter((hazard) => !found.includes(hazard.id))
        .map((hazard) => distanceToHazard(x, y, hazard))
        .sort((a, b) => a - b);
      const nearest = distances[0];
      if (nearest !== undefined && nearest <= NEAR_MISS_RADIUS) {
        setFeedback({
          kind: "near",
          title: "Quase lá",
          text: "Há um risco bem perto desse ponto. Olhe ao redor do que você acabou de clicar.",
        });
        return;
      }
    }

    setFeedback({
      kind: "miss",
      title: "Nada de errado aqui",
      text: wrongPenalty
        ? `Compare os dois lados antes de clicar. Você perdeu ${wrongPenalty}s.`
        : "Compare os dois lados antes de clicar.",
    });
  };

  const handleTap = (x: number, y: number) => {
    if (phase !== "playing") return;

    const hazard = targets.find(
      (candidate) => !found.includes(candidate.id) && isPointInHazard(x, y, candidate)
    );

    if (!hazard) {
      registerMiss(x, y);
      return;
    }

    // Modo sequencial: a fase exige encontrar os riscos na ordem definida.
    if (sequential && nextInOrder && hazard.id !== nextInOrder.id) {
      setCombo(0);
      audio.miss();
      setFeedback({
        kind: "order",
        title: "Fora de ordem",
        text: "Esta fase pede a inspeção na sequência. Resolva o risco anterior primeiro.",
      });
      return;
    }

    registerHit(hazard);
  };

  const useHint = () => {
    if (phase !== "playing" || hints <= 0) return;
    const target = sequential
      ? nextInOrder
      : targets.find((hazard) => !found.includes(hazard.id));
    if (!target) return;

    setHints((current) => current - 1);
    setHintsUsed((current) => current + 1);
    setScore((current) => Math.max(0, current - hintCost));
    setHintRing({ x: target.x, y: target.y });
    audio.hint();
    setFeedback({
      kind: "hint",
      title: `Dica usada (−${hintCost} pontos)`,
      text:
        target.hint ??
        `Procure algo relacionado a ${target.category.toLowerCase()} na região destacada.`,
    });
  };

  /* --- Ciclo de vida da partida --- */
  const resetRound = (options: { nextRound?: boolean } = {}) => {
    finishedRef.current = false;
    remainingRef.current = stageTime;
    setPhase("briefing");
    setCountdown(COUNTDOWN_FROM);
    setRemaining(stageTime);
    setFound([]);
    setWrong(0);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setHints(stageHints);
    setHintsUsed(0);
    setHintRing(null);
    setFeedback(null);
    setFloaters([]);
    setSubmitted(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setMobileTab("errors");
    if (options.nextRound) setRound((current) => current + 1);
  };

  const startRound = () => {
    if (!canPlay) return;
    setPhase("countdown");
    setCountdown(COUNTDOWN_FROM);
    setFeedback(null);
  };

  /* [FIX] "Jogar novamente" devolvia o jogador ao briefing. Agora recomeça
   * direto, sorteando um novo conjunto de riscos da mesma cena. */
  const playAgain = () => {
    resetRound({ nextRound: true });
    window.setTimeout(() => setPhase("countdown"), 0);
  };

  const changeScenario = (key: string) => {
    setScenarioKey(key);
    resetRound({ nextRound: true });
  };

  const goToNextScenario = () => {
    if (!catalog.length) return;
    const index = catalog.findIndex((item) => item.key === scenarioKey);
    const next = catalog[(index + 1) % catalog.length];
    if (next) changeScenario(next.key);
  };

  /* --- Atalhos de teclado --- */
  const handleHintShortcut = useEvent(() => useHint());
  const handleZoomShortcut = useEvent((delta: number) =>
    applyZoom(delta === 0 ? 1 : zoom + delta)
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (event.key === "Escape") {
        setPhase((current) =>
          current === "playing" ? "paused" : current === "paused" ? "playing" : current
        );
        return;
      }

      switch (event.key.toLowerCase()) {
        case "d":
          handleHintShortcut();
          break;
        case "p":
          setPhase((current) =>
            current === "playing" ? "paused" : current === "paused" ? "playing" : current
          );
          break;
        case "+":
        case "=":
          handleZoomShortcut(ZOOM_STEP);
          break;
        case "-":
          handleZoomShortcut(-ZOOM_STEP);
          break;
        case "0":
          handleZoomShortcut(0);
          break;
        case "m":
          setSoundOn((current) => !current);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleHintShortcut, handleZoomShortcut]);

  /* --- Métricas finais --- */
  const accuracy =
    found.length + wrong > 0
      ? Math.round((found.length / (found.length + wrong)) * 100)
      : 0;
  const perfect = required > 0 && found.length === required;
  const stars = perfect
    ? wrong <= 1 && remaining > stageTime * 0.4
      ? 3
      : 2
    : progress >= 60
      ? 1
      : 0;

  /* ========================================================================
   * 8.1 — Marcadores desenhados sobre a imagem
   * ====================================================================== */
  const markers = (
    <>
      {targets.map((hazard) => {
        if (!found.includes(hazard.id)) return null;
        const isPulsing = pulseId === hazard.id;
        return (
          <span
            key={hazard.id}
            aria-hidden="true"
            className={`absolute ${isPulsing ? "seg-hint" : "seg-stamp"}`}
            style={{
              left: `${hazard.x}%`,
              top: `${hazard.y}%`,
              /* Contra-escala: o marcador mantém o mesmo tamanho na tela
               * independentemente do zoom aplicado ao palco. */
              transform: `translate(-50%,-50%) scale(${1 / zoom})`,
            }}
          >
            <span className="relative flex h-9 w-9 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400/90 bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,.55)]" />
              <CheckCircle2 className="relative h-5 w-5 text-emerald-300" />
            </span>
          </span>
        );
      })}

      {hintRing && (
        <span
          aria-hidden="true"
          className="seg-hint absolute rounded-full border-2 border-dashed border-amber-300/90 bg-amber-300/10"
          style={{
            left: `${hintRing.x}%`,
            top: `${hintRing.y}%`,
            width: `${HINT_RING_RADIUS * 2}%`,
            aspectRatio: "1",
            transform: "translate(-50%,-50%)",
          }}
        />
      )}

      {floaters.map((floater) => (
        <span
          key={floater.id}
          aria-hidden="true"
          className="absolute"
          style={{ left: `${floater.x}%`, top: `${floater.y}%` }}
        >
          {floater.kind === "hit" ? (
            <>
              <span
                className="seg-ripple absolute block rounded-full border-2 border-emerald-300"
                style={{ width: 70, height: 70 }}
              />
              <span
                className="seg-float absolute whitespace-nowrap font-industrial text-lg font-black text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,.9)]"
              >
                {floater.label}
              </span>
            </>
          ) : (
            <>
              <span
                className="seg-shake absolute block rounded-full border-2 border-red-500/80 bg-red-500/10"
                style={{ width: 46, height: 46 }}
              />
              <span className="seg-float absolute whitespace-nowrap text-xs font-bold text-red-300 drop-shadow-[0_2px_4px_rgba(0,0,0,.9)]">
                {floater.label}
              </span>
            </>
          )}
        </span>
      ))}
    </>
  );

  /* ========================================================================
   * 8.2 — Estados de carregamento e erro
   * ====================================================================== */
  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        <p className="mt-4 text-sm text-slate-400">Carregando a inspeção…</p>
      </div>
    );
  }

  if (!canPlay) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 p-8 text-center">
          <AlertTriangle className="mx-auto h-9 w-9 text-amber-300" />
          <h2 className="mt-4 font-industrial text-2xl font-bold text-white">
            Esta fase ainda não está pronta
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
            {!hasScenario
              ? "Nenhum cenário ativo foi encontrado. Cadastre uma cena com imagem segura e imagem com erros no painel Admin."
              : "O cenário existe, mas não há riscos cadastrados nele. Adicione os pontos de risco no editor visual do Admin."}
          </p>
          <button
            type="button"
            onClick={onBackToGames}
            className="seg-focus mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-500"
          >
            Voltar aos jogos
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================================
   * 8.3 — Briefing
   * ====================================================================== */
  if (phase === "briefing") {
    const imagesReady = preload.status === "ready";
    const imagesFailed = preload.status === "error";

    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="seg-pop overflow-hidden rounded-3xl border border-red-500/25 bg-[#11151e] shadow-2xl">
          <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_80%_0%,rgba(218,41,28,.28),transparent_48%)] p-6 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-200">
                <Eye className="h-4 w-4" />
                Inspeção visual CDBS
              </span>
              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-slate-400">
                Modo {config.label}{extendedTime ? " · tempo 2×" : ""}
              </span>
            </div>

            <h2 className="mt-6 font-industrial text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
              Duas cenas.
              <br />
              {required} riscos escondidos.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300">
              A imagem da esquerda mostra a área em condição segura. A da direita tem{" "}
              {required} desvios introduzidos. Encontre todos antes do tempo acabar.{" "}
              {config.blurb}
            </p>
          </div>

          <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-[1fr_300px]">
            <div>
              <label
                htmlFor="seg-scenario"
                className="mb-2 block text-sm font-semibold text-slate-400"
              >
                Área da fábrica
              </label>
              <select
                id="seg-scenario"
                value={scenarioKey}
                onChange={(event) => changeScenario(event.target.value)}
                className="seg-focus h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-sm font-semibold text-white outline-none transition-colors focus:border-red-400"
              >
                {catalog.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Riscos" value={String(required).padStart(2, "0")} />
                <StatTile label="Tempo" value={formatTime(stageTime)} />
                <StatTile
                  label="Dicas"
                  value={stageHints || "—"}
                  tone={stageHints ? "amber" : "default"}
                />
                <StatTile
                  label="Erro custa"
                  value={wrongPenalty ? `${wrongPenalty}s` : "—"}
                  tone={wrongPenalty ? "red" : "default"}
                />
              </div>

              {imagesFailed && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-950/30 p-4 text-sm text-amber-100">
                  <ImageOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <span>
                    Uma das imagens desta fase não carregou. Verifique a URL no painel
                    Admin — você pode jogar, mas a comparação ficará incompleta.
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onBackToGames}
                  className="seg-focus inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setAccessibleMode((current) => !current)}
                  aria-pressed={accessibleMode}
                  className="seg-focus inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-950/30 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-900/30"
                >
                  <ListChecks className="h-4 w-4" aria-hidden="true" />
                  {accessibleMode ? "Usar comparação visual" : "Usar inspeção textual"}
                </button>
                <button
                  type="button"
                  onClick={startRound}
                  disabled={!accessibleMode && preload.status === "loading"}
                  className="seg-focus flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {!accessibleMode && preload.status === "loading" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparando as cenas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Começar inspeção
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </div>

              {imagesReady && (
                <p className="mt-3 text-xs text-slate-500">
                  Atalhos: <b className="text-slate-400">D</b> dica ·{" "}
                  <b className="text-slate-400">P</b> pausa ·{" "}
                  <b className="text-slate-400">+ −</b> zoom ·{" "}
                  <b className="text-slate-400">M</b> som
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
              <div className="mb-4 flex items-center gap-2 text-red-300">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-bold">Como jogar</span>
              </div>
              <ol className="space-y-4 text-sm leading-5 text-slate-300">
                <li className="flex gap-3">
                  <span className="font-industrial font-bold text-red-400">1</span>
                  {accessibleMode ? "Leia as pistas e regiões descritas na lista." : "Compare a cena segura com a cena com erros."}
                </li>
                <li className="flex gap-3">
                  <span className="font-industrial font-bold text-red-400">2</span>
                  {accessibleMode ? "Confirme cada condição insegura usando o botão correspondente." : "Clique sobre o risco na imagem da direita."}
                </li>
                <li className="flex gap-3">
                  <span className="font-industrial font-bold text-red-400">3</span>
                  Acertos seguidos aumentam o multiplicador.
                </li>
                <li className="flex gap-3">
                  <span className="font-industrial font-bold text-red-400">4</span>
                  Use a roda do mouse ou dois dedos para aproximar.
                </li>
              </ol>
              <p className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">
                Material de treinamento · CDBS Osasco
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================
   * 8.4 — Partida
   * ====================================================================== */
  const timeCritical = remaining <= 15;
  const comboMultiplierLabel = Math.min(
    MAX_COMBO_MULTIPLIER,
    1 + Math.max(0, combo - 1) * COMBO_STEP
  ).toFixed(2);

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
      {/* ---------- Barra de status ---------- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#141822] p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-2 text-red-300">
            <Crosshair className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">
              {scenario?.label ?? "Inspeção CDBS"}
            </div>
            <div className="text-xs text-slate-400">
              {sequential
                ? "Esta fase exige encontrar os riscos em ordem"
                : "Clique nos riscos da cena da direita"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatTile
            label="Tempo"
            value={formatTime(remaining)}
            tone={timeCritical ? "red" : "default"}
            alert={timeCritical}
          />
          <StatTile label="Pontos" value={score} tone="amber" />
          {combo > 1 && (
            <div className="seg-pop rounded-xl border border-orange-400/50 bg-orange-950/40 px-3 py-2">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-orange-300">
                <Flame className="h-3 w-3" />
                Sequência
              </div>
              <strong className="font-industrial text-xl leading-tight text-orange-200">
                {combo}× <span className="text-sm">({comboMultiplierLabel})</span>
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Progresso ---------- */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#141822] p-3 sm:p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-slate-300">
              <Target className="h-4 w-4 text-red-300" />
              <span className="text-sm font-semibold">Riscos identificados</span>
            </div>
            <div className="mt-1 font-industrial text-3xl font-black tabular-nums text-white">
              {found.length}
              <span className="text-slate-500"> / {required}</span>
            </div>
          </div>
          <div className="min-w-[180px] flex-1">
            <div className="mb-2 text-right text-xs font-semibold text-slate-500">
              {progress}% concluído
            </div>
            <div
              className="flex gap-1.5"
              role="progressbar"
              aria-valuenow={found.length}
              aria-valuemin={0}
              aria-valuemax={required}
            >
              {targets.map((hazard, index) => (
                <div
                  key={hazard.id}
                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                    index < found.length ? "bg-emerald-500" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Controles ---------- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useHint}
            disabled={hints <= 0 || phase !== "playing"}
            className="seg-focus inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-950/40 px-3 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-900/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Lightbulb className="h-4 w-4" />
            Dica {hints > 0 ? `(${hints})` : "esgotada"}
          </button>

          <button
            type="button"
            onClick={() =>
              setPhase((current) => (current === "playing" ? "paused" : "playing"))
            }
            disabled={phase === "finished"}
            className="seg-focus inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-40"
          >
            {phase === "paused" ? (
              <>
                <Play className="h-4 w-4" /> Continuar
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" /> Pausar
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSoundOn((current) => !current)}
            aria-pressed={soundOn}
            className="seg-focus inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Som
          </button>
          <button
            type="button"
            onClick={() => setAccessibleMode((current) => !current)}
            aria-pressed={accessibleMode}
            className="seg-focus inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-950/30 px-3 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-900/40"
          >
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            {accessibleMode ? "Modo visual" : "Modo textual"}
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
          <IconButton
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            title="Afastar"
          >
            <Minus className="h-4 w-4" />
          </IconButton>
          <span className="min-w-14 text-center text-sm font-bold tabular-nums text-white">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            title="Aproximar"
          >
            <Plus className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={() => applyZoom(1)} disabled={zoom === 1} title="Enquadrar">
            <Maximize2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {!accessibleMode && <>
      {/* ---------- Alternância mobile ---------- */}
      <div className="mb-3 flex rounded-xl border border-white/10 bg-[#141822] p-1 md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("safe")}
          className={`seg-focus flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            mobileTab === "safe" ? "bg-white/15 text-white" : "text-slate-500"
          }`}
        >
          Cena segura
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("errors")}
          className={`seg-focus flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            mobileTab === "errors" ? "bg-red-600 text-white" : "text-slate-500"
          }`}
        >
          Cena com erros
        </button>
      </div>
      </>}

      {/* ---------- Palcos ---------- */}
      {accessibleMode ? (
        <section aria-labelledby="text-inspection-title" className="rounded-2xl border border-cyan-400/30 bg-[#101b23] p-4 sm:p-6">
          <h3 id="text-inspection-title" className="flex items-center gap-2 font-industrial text-xl font-black text-white"><ListChecks className="h-5 w-5 text-cyan-300" aria-hidden="true" /> Inspeção textual equivalente</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">Use as pistas e a região aproximada para revisar as condições da área. Cada botão confirmado registra o mesmo tipo de acerto da comparação visual.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {targets.map((hazard, index) => {
              const isFound = found.includes(hazard.id);
              const blockedByOrder = sequential && nextInOrder?.id !== hazard.id;
              const horizontal = hazard.x < 34 ? "esquerda" : hazard.x > 66 ? "direita" : "centro";
              const vertical = hazard.y < 34 ? "superior" : hazard.y > 66 ? "inferior" : "central";
              return (
                <button key={hazard.id} type="button" disabled={isFound || phase !== "playing" || blockedByOrder} onClick={() => registerHit(hazard)} className={`seg-focus min-h-28 rounded-xl border p-4 text-left transition-colors ${isFound ? "border-emerald-400/40 bg-emerald-950/40 text-emerald-100" : blockedByOrder ? "border-white/10 bg-black/20 text-slate-500" : "border-cyan-400/30 bg-black/30 text-slate-100 hover:bg-cyan-950/50"}`}>
                  <span className="flex items-start gap-3">
                    {isFound ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" /> : <Target className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />}
                    <span><strong className="block">{isFound ? hazard.name : `Risco ${index + 1} · ${hazard.category}`}</strong><span className="mt-1 block text-xs leading-relaxed">{isFound ? hazard.desc : `${hazard.hint ?? "Verifique se a condição está de acordo com o procedimento seguro."} Região ${vertical}, à ${horizontal}.`}</span>{!isFound && !blockedByOrder && <span className="mt-2 block text-xs font-bold text-cyan-200">Confirmar condição insegura</span>}{blockedByOrder && <span className="mt-2 block text-xs">Conclua o risco anterior primeiro.</span>}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
      <div className="relative grid gap-3 md:grid-cols-2">
        <div
          className={`${
            mobileTab === "errors" ? "hidden md:block" : "block"
          } overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl`}
        >
          <div className="border-b border-white/10 bg-[#141822] px-4 py-3">
            <span className="text-sm font-semibold text-slate-300">
              Referência · condição segura
            </span>
          </div>
          <Stage
            image={safeImage}
            alt="Área da fábrica em condição segura"
            caption="Referência"
            interactive={false}
            ratio={ratio}
            zoom={zoom}
            pan={pan}
            blurred={phase === "paused"}
          />
        </div>

        <div
          className={`${
            mobileTab === "safe" ? "hidden md:block" : "block"
          } overflow-hidden rounded-2xl border border-red-500/35 bg-black shadow-2xl`}
        >
          <div className="flex items-center justify-between border-b border-red-500/20 bg-[#24151a] px-4 py-3">
            <span className="text-sm font-semibold text-red-200">
              Inspeção · clique nos riscos
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              {found.length}/{required}
            </span>
          </div>
          <Stage
            image={errorImage}
            alt="Área da fábrica com condições inseguras a identificar"
            caption="Inspeção"
            interactive={phase === "playing"}
            ratio={ratio}
            zoom={zoom}
            pan={pan}
            blurred={phase === "paused"}
            markers={markers}
            onGeometry={handleGeometry}
            onTap={handleTap}
            onPanChange={(next) => setPan(clampPan(next, zoom))}
            onZoomAt={(nextZoom) => applyZoom(nextZoom)}
          />
        </div>

        {/* Contagem regressiva */}
        {phase === "countdown" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/75 backdrop-blur-sm">
            <span
              key={countdown}
              className="seg-count font-industrial text-8xl font-black text-white"
            >
              {countdown > 0 ? countdown : "Vai!"}
            </span>
          </div>
        )}

        {/* Pausa */}
        {phase === "paused" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/80 backdrop-blur-sm">
            <Pause className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-300">Inspeção pausada</p>
            <button
              type="button"
              onClick={() => setPhase("playing")}
              className="seg-focus rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-500"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
      )}

      {/* ---------- Feedback ---------- */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`seg-slide mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm ${
            feedback.kind === "hit"
              ? "border-emerald-400/40 bg-emerald-950/50 text-emerald-100"
              : feedback.kind === "hint"
                ? "border-amber-400/40 bg-amber-950/50 text-amber-100"
                : feedback.kind === "near"
                  ? "border-cyan-400/40 bg-cyan-950/40 text-cyan-100"
                  : "border-white/15 bg-black/30 text-slate-300"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {feedback.kind === "hit" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            ) : feedback.kind === "hint" ? (
              <Lightbulb className="h-5 w-5 text-amber-300" />
            ) : feedback.kind === "near" ? (
              <Target className="h-5 w-5 text-cyan-300" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <strong className="block font-bold">
              {feedback.title}
              {feedback.points ? (
                <span className="ml-2 text-emerald-300">+{feedback.points}</span>
              ) : null}
            </strong>
            <span className="text-xs leading-5 opacity-90">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Fechar aviso"
            className="seg-focus ml-auto shrink-0 rounded p-1 text-white/50 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ---------- Checklist ---------- */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
        <div className="rounded-xl border border-white/10 bg-[#141822] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300">Checklist da inspeção</h3>
            <span className="text-xs text-slate-500">
              {wrong} {wrong === 1 ? "clique fora" : "cliques fora"}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {targets.map((hazard, index) => {
              const isFound = found.includes(hazard.id);
              return (
                <button
                  key={hazard.id}
                  type="button"
                  disabled={!isFound}
                  onClick={() => setPulseId(hazard.id)}
                  className={`seg-focus rounded-lg border p-3 text-left text-xs transition-colors ${
                    isFound
                      ? "border-emerald-400/30 bg-emerald-950/30 text-emerald-100 hover:bg-emerald-900/30"
                      : "cursor-default border-white/5 bg-black/20 text-slate-500"
                  }`}
                >
                  {isFound ? (
                    <span className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>
                        <b className="block">{hazard.name}</b>
                        <span className="opacity-70">{hazard.category}</span>
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-slate-600" />
                      Risco {index + 1} · não localizado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-red-400/20 bg-red-950/20 p-4">
          <div className="text-sm font-bold text-red-300">Regras da fase</div>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300">
            <li>As áreas de risco nunca são exibidas antes do acerto.</li>
            <li>
              Clique fora de um risco{" "}
              {wrongPenalty ? `custa ${wrongPenalty}s` : "não tira tempo"} e zera a
              sequência.
            </li>
            <li>Cada dica custa {hintCost} pontos.</li>
            {sequential && <li>Esta fase exige a inspeção na ordem do checklist.</li>}
          </ul>
        </div>
      </div>

      {/* ---------- Resultado ---------- */}
      {phase === "finished" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm"
        >
          <div className="seg-pop w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#141822] shadow-2xl">
            <div
              className={`px-6 py-8 text-center sm:px-10 ${
                perfect
                  ? "bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,.28),transparent_60%)]"
                  : "bg-[radial-gradient(circle_at_50%_0%,rgba(218,41,28,.24),transparent_60%)]"
              }`}
            >
              {perfect ? (
                <Trophy className="mx-auto h-11 w-11 text-amber-300" />
              ) : (
                <Clock3 className="mx-auto h-11 w-11 text-slate-400" />
              )}

              <h2 className="mt-4 font-industrial text-3xl font-black text-white sm:text-4xl">
                {perfect ? "Inspeção completa" : "Tempo esgotado"}
              </h2>

              <div className="mt-3 flex justify-center gap-1.5">
                {[0, 1, 2].map((index) => (
                  <Award
                    key={index}
                    className={`h-6 w-6 ${
                      index < stars ? "text-amber-300" : "text-white/15"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-4 text-sm text-slate-300">
                {found.length} de {required} riscos identificados em{" "}
                {formatTime(stageTime - remaining)}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-6 sm:grid-cols-4 sm:px-10">
              <StatTile label="Pontuação" value={score} tone="amber" />
              <StatTile label="Precisão" value={`${accuracy}%`} tone="emerald" />
              <StatTile label="Melhor sequência" value={`${bestCombo}×`} tone="cyan" />
              <StatTile
                label="Posição"
                value={previewOnly ? "—" : submitted ? `${submitted.rank}º` : "…"}
              />
            </div>

            <div className="px-6 py-5 sm:px-10">
              <p className="text-center text-sm text-slate-400">
                {previewOnly
                  ? "Modo de teste do Admin: este resultado não entra no ranking."
                  : submitted?.isNewBest
                    ? "Novo recorde pessoal registrado."
                    : submitted
                      ? "Resultado registrado no ranking do evento."
                      : "Registrando seu resultado…"}
              </p>

              {!perfect && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs font-semibold text-slate-400">
                    Riscos que passaram despercebidos
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-400">
                    {targets
                      .filter((hazard) => !found.includes(hazard.id))
                      .slice(0, 5)
                      .map((hazard) => (
                        <li key={hazard.id}>
                          <b className="text-slate-300">{hazard.name}</b> — {hazard.desc}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={playAgain}
                  className="seg-focus inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Repetir
                </button>
                <button
                  type="button"
                  onClick={goToNextScenario}
                  className="seg-focus inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-950/30 px-3 py-2.5 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-900/30"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
                <a
                  href="/ranking"
                  className="seg-focus inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-900/30"
                >
                  <Trophy className="h-4 w-4 text-amber-300" />
                  Ranking
                </a>
                <button
                  type="button"
                  onClick={onBackToGames}
                  className="seg-focus inline-flex items-center justify-center rounded-xl bg-red-600 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-500"
                >
                  Voltar aos jogos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotErrorGame;
