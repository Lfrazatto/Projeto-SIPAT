import fs from "node:fs";

const root = process.cwd();
const replacements = new Map([
  ["client/src/pages/Home.tsx", [["Quiz Lean Manufacturing", "Desafio Fábrica Eficiente"]]],
  ["client/src/pages/Jogos.tsx", [["Quiz Lean Manufacturing", "Desafio Fábrica Eficiente"], ["Lean Manufacturing para deixar", "melhoria contínua para deixar"]]],
  ["client/src/pages/Ranking.tsx", [["Quiz Lean Manufacturing", "Desafio Fábrica Eficiente"]]],
  ["client/src/pages/MeuProgresso.tsx", [["Quiz Lean Manufacturing", "Desafio Fábrica Eficiente"]]],
  ["client/src/components/QuizGamePlayer.tsx", [["Quiz Lean Manufacturing", "Desafio Fábrica Eficiente"], ["perguntas de Lean Manufacturing SIPAT CDBS", "perguntas do Desafio Fábrica Eficiente SIPAT CDBS"]]],
  ["client/src/pages/Admin.tsx", [["Segurança + Lean Manufacturing", "Segurança + Fábrica Eficiente"], ["Lean Manufacturing", "Fábrica Eficiente"]]],
  ["client/src/components/DifficultyModal.tsx", [["conceitos básicos de segurança e ergonomia", "conceitos básicos de segurança, cuidado e melhoria contínua"]]],
  ["server/seedData.ts", [["SIPAT CDBS • Lean Manufacturing", "SIPAT CDBS • Desafio Fábrica Eficiente"]]],
]);

for (const [relative, pairs] of replacements) {
  const filename = `${root}/${relative}`;
  let source = fs.readFileSync(filename, "utf8");
  for (const [from, to] of pairs) {
    source = source.split(from).join(to);
  }
  fs.writeFileSync(filename, source);
}
console.log("Nome visível atualizado para Desafio Fábrica Eficiente.");
