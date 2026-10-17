import React from "react";
import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from "lucide-react";

export type ScoreSaveState = "idle" | "saving" | "saved" | "error" | "preview";

interface ScoreSaveStatusProps {
  state: ScoreSaveState;
}

const CONTENT: Record<Exclude<ScoreSaveState, "idle">, { title: string; description: string }> = {
  saving: {
    title: "Salvando sua pontuação…",
    description: "Estamos registrando sua partida no ranking com segurança.",
  },
  saved: {
    title: "Pontuação salva com sucesso!",
    description: "Seu resultado já está valendo no ranking do evento.",
  },
  error: {
    title: "Resultado concluído, sincronização pendente",
    description: "Sua partida terminou. Tente atualizar o ranking em instantes.",
  },
  preview: {
    title: "Modo de visualização",
    description: "Esta simulação não altera o ranking oficial.",
  },
};

export function ScoreSaveStatus({ state }: ScoreSaveStatusProps) {
  if (state === "idle") return null;

  const content = CONTENT[state];
  const isSaved = state === "saved";
  const isError = state === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      aria-busy={state === "saving"}
      className={`score-save-status ${isSaved ? "score-save-success" : ""} ${
        isError ? "score-save-error" : ""
      } flex items-center gap-3 rounded-2xl border p-4 text-left`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
          isSaved
            ? "border-emerald-300/70 bg-emerald-300/20 text-emerald-200"
            : isError
              ? "border-amber-300/60 bg-amber-300/15 text-amber-200"
              : "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
        }`}
        aria-hidden="true"
      >
        {state === "saving" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isSaved ? (
          <CheckCircle2 className="score-save-icon h-6 w-6" />
        ) : isError ? (
          <TriangleAlert className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0">
        <strong className="block text-sm font-black uppercase tracking-wide text-white">
          {content.title}
        </strong>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-200/90">
          {content.description}
        </span>
      </span>
      {isSaved && <Sparkles className="score-save-sparkle ml-auto h-5 w-5 shrink-0 text-amber-200" aria-hidden="true" />}
    </div>
  );
}
