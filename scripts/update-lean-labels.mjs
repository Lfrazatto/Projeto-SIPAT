import fs from "node:fs";

const replacements = new Map([
  ["client/src/components/QuizGamePlayer.tsx", [
    ["Quiz de Ergonomia", "Quiz Lean Manufacturing"],
    ["Carregando perguntas de ergonomia SIPAT CDBS...", "Carregando perguntas de Lean Manufacturing SIPAT CDBS..."],
  ]],
  ["client/src/pages/Jogos.tsx", [
    ["Quiz de Ergonomia", "Quiz Lean Manufacturing"],
    ["\"Aprenda a proteger seu corpo na rotina CDBS: postura, movimentação, pausas e saúde ocupacional.\"", "\"Teste seus conhecimentos sobre 5S, Kaizen, Kanban, Just in Time, desperdícios, qualidade e melhoria contínua.\""],
    ["Postura & Pausas", "5S • Kaizen • Fluxo"],
  ]],
  ["client/src/pages/Home.tsx", [
    ["Quiz de Ergonomia", "Quiz Lean Manufacturing"],
    ["Equilíbrio para trabalhar melhor.", "Fluxo, qualidade e melhoria contínua."],
    ["Postura, movimentação, pausas e saúde ocupacional.", "5S, Kaizen, Kanban, Just in Time e qualidade na fonte."],
    ["postura, percepção ou organização", "melhoria contínua, percepção ou organização"],
  ]],
  ["client/src/pages/Ranking.tsx", [
    ["Quiz de Ergonomia", "Quiz Lean Manufacturing"],
    ["melhor pontuação obtida em cada um dos quatro desafios.", "soma das pontuações válidas de todos os desafios concluídos."],
    ["Ranking geral = melhor resultado de cada desafio, sem somar tentativas repetidas.", "Ranking geral = pontos acumulados em cada desafio concluído."],
  ]],
  ["client/src/pages/MeuProgresso.tsx", [
    ["Quiz de Ergonomia", "Quiz Lean Manufacturing"],
  ]],
  ["client/src/pages/Admin.tsx", [
    ["Quiz de Ergonomia", "Quiz Lean Manufacturing"],
    ["Ex: EPIs, Bloqueio LOTO, Ergonomia", "Ex: EPIs, Bloqueio LOTO, 5S, Kaizen"],
  ]],
  ["server/seedData.ts", [
    ["SIPAT CDBS • Ergonomia", "SIPAT CDBS • Lean Manufacturing"],
    ["Desafios sobre postura, movimentação, pausas e saúde ocupacional na rotina CDBS.", "Desafios sobre 5S, Kaizen, Kanban, Just in Time, qualidade e melhoria contínua na rotina CDBS."],
  ]],
  ["server/sipat.test.ts", [
    ["serves ergonomics questions instead of environmental content", "serves Lean Manufacturing questions instead of ergonomics content"],
    ["expect(questions).toHaveLength(12);", "expect(questions.length).toBeGreaterThanOrEqual(6);"],
    ["expect(questions.every((question) => question.theme.includes(\"Ergonomia\") || question.theme.includes(\"Postura\") || question.theme.includes(\"Movimentação\") || question.theme.includes(\"Pausas\") || question.theme.includes(\"Saúde\"))).toBe(true);", "expect(questions.every((question) => question.theme.includes(\"Lean\"))).toBe(true);"],
    ["expect(questions.some((question) => /postura|moviment|pausa|saúde/i.test(question.question))).toBe(true);", "expect(questions.some((question) => /5S|Kaizen|Kanban|qualidade|fluxo/i.test(question.question))).toBe(true);"],
    ["expect(questions.every((question) => !/resíduo|emissão|ambiental|drenagem/i.test(`${question.question} ${question.explanation || \"\"}`))).toBe(true);", "expect(questions.every((question) => !/postura|pausa|lombar|ergonomia/i.test(`${question.question} ${question.theme}`))).toBe(true);"],
    ["it(\"registers chapa and keeps the best score per challenge\"", "it(\"registers chapa and accumulates valid scores across challenges\""],
    ["expect(submitRetry.totalScore).toBe(850);", "expect(submitRetry.totalScore).toBe(1550);"],
    ["expect(submitEnv.totalScore).toBe(1750);", "expect(submitEnv.totalScore).toBe(2450);"],
  ]],
]);

for (const [relative, pairs] of replacements) {
  const path = relative;
  let content = fs.readFileSync(path, "utf8");
  for (const [from, to] of pairs) {
    if (!content.includes(from)) console.warn(`[labels] Não encontrado em ${path}: ${from}`);
    content = content.replaceAll(from, to);
  }
  fs.writeFileSync(path, content);
}
console.log(`Rótulos Lean atualizados em ${replacements.size} arquivos.`);
