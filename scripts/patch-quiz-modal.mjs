import fs from "node:fs";

const file = "client/src/components/QuizFinalResultModal.tsx";
let content = fs.readFileSync(file, "utf8");

const oldTop = `  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const diffLabel = difficulty === "muito_dificil" ? "MUITO DIFÍCIL" : difficulty === "dificil" ? "DIFÍCIL" : difficulty === "medio" ? "MÉDIO" : "FÁCIL";

  return (`;

const newTop = `  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const diffLabel = difficulty === "muito_dificil" ? "MUITO DIFÍCIL" : difficulty === "dificil" ? "DIFÍCIL" : difficulty === "medio" ? "MÉDIO" : "FÁCIL";
  const totalItemsCount = totalQuestions ?? (correctCount + wrongCount);
  const averageTime = totalItemsCount > 0 ? (totalTimeSeconds / totalItemsCount).toFixed(1) : "0.0";

  return (`;

const oldMeta = `          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Tempo Total: <strong className="text-white ml-1">{totalTimeSeconds}s</strong>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Dificuldade: <strong className="text-white ml-1">{diffLabel}</strong>
          </span>`;

const newMeta = `          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Tempo Total: <strong className="text-white ml-1">{totalTimeSeconds}s</strong>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Tempo Médio: <strong className="text-white ml-1">{averageTime}s/{unitLabel === "perguntas" ? "questão" : "item"}</strong>
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Dificuldade: <strong className="text-white ml-1">{diffLabel}</strong>
          </span>`;

const oldRankDesc = `<div className="text-[10px] text-slate-500">Geral Atual</div>`;
const newRankDesc = `<div className="text-[10px] text-slate-500">{currentRank > 0 ? "Geral Atual" : "Identifique-se para pontuar"}</div>`;

content = content.replace(oldTop, newTop).replace(oldMeta, newMeta).replace(oldRankDesc, newRankDesc);
fs.writeFileSync(file, content);
console.log("QuizFinalResultModal.tsx atualizado com tempo médio e aviso de ranking.");
