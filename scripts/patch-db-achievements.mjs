import fs from "node:fs";

const file = "server/db.ts";
let content = fs.readFileSync(file, "utf8");

const oldCalculation = `  const totalScore = bestSecurity + bestEnvironment + bestSpot + bestOrganize;

  let highestDiffLabel = "Fácil";
  if (difficultiesSeen.has("dificil")) highestDiffLabel = "Difícil";
  else if (difficultiesSeen.has("medio")) highestDiffLabel = "Médio";

  await db
    .update(participants)
    .set({
      totalScore,`;

const newCalculation = `  const totalScore = bestSecurity + bestEnvironment + bestSpot + bestOrganize;
  const accumulatedScore = results.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
  const effectiveTotal = accumulatedScore > 0 ? accumulatedScore : totalScore;

  let highestDiffLabel = "Fácil";
  if (difficultiesSeen.has("dificil")) highestDiffLabel = "Difícil";
  else if (difficultiesSeen.has("medio")) highestDiffLabel = "Médio";

  await db
    .update(participants)
    .set({
      totalScore: effectiveTotal,`;

if (!content.includes(oldCalculation)) throw new Error("Trecho de calculateParticipantStats não encontrado");
content = content.replace(oldCalculation, newCalculation);

const achievementFunctions = `

export async function evaluateAndUnlockAchievements(participantId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select().from(gameResults).where(eq(gameResults.participantId, participantId));
  if (!results.length) return [];

  const existing = await db.select({ key: participantAchievements.achievementKey }).from(participantAchievements).where(eq(participantAchievements.participantId, participantId));
  const existingKeys = new Set(existing.map((row) => row.key));
  const newUnlocked: string[] = [];

  const completedGames = new Set(results.map((r) => r.gameType));
  const totalCorrect = results.reduce((acc, r) => acc + (r.correctCount || 0), 0);
  const hasQuick = results.some((r) => r.timeSpentSeconds > 0 && r.timeSpentSeconds <= 10 && r.score > 0);
  const hasFlawless = results.some((r) => r.wrongCount === 0 && r.score > 0);

  const candidates: Array<{ key: string; condition: boolean }> = [
    { key: "primeiro_desafio", condition: results.length >= 1 },
    { key: "precisao", condition: totalCorrect >= 10 },
    { key: "mestre_seguranca", condition: completedGames.has("quiz_seguranca") },
    { key: "especialista_lean", condition: completedGames.has("quiz_ergonomia") },
    { key: "olho_de_aguia", condition: completedGames.has("ache_o_erro") },
    { key: "velocidade", condition: hasQuick },
    { key: "perfeito", condition: hasFlawless },
    { key: "jogador_completo", condition: completedGames.size >= 4 },
  ];

  for (const item of candidates) {
    if (item.condition && !existingKeys.has(item.key)) {
      await db.insert(participantAchievements).values({ participantId, achievementKey: item.key }).onDuplicateKeyUpdate({ set: { achievementKey: item.key } });
      newUnlocked.push(item.key);
    }
  }

  return newUnlocked;
}

export async function getParticipantAchievements(participantId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select().from(participantAchievements).where(eq(participantAchievements.participantId, participantId));
  const unlockedMap = new Map(rows.map((row) => [row.achievementKey, row.unlockedAt]));

  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: unlockedMap.has(def.key),
    unlockedAt: unlockedMap.get(def.key) || null,
  }));
}
`;

if (!content.includes("export async function evaluateAndUnlockAchievements")) {
  content += achievementFunctions;
}

fs.writeFileSync(file, content);
console.log("server/db.ts atualizado com pontuação acumulada e funções de conquistas.");
