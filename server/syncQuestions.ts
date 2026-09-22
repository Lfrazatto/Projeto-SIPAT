import { getDb } from "./db";
import { quizQuestions } from "../drizzle/schema";
import { OFFICIAL_QUIZ_QUESTIONS } from "./quizQuestionsCatalog";
import { eq } from "drizzle-orm";

export async function syncOfficialQuestionsToDb() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  console.log("Iniciando sincronização do catálogo oficial de perguntas...");
  
  // Limpar perguntas antigas de quiz_seguranca e quiz_ergonomia para garantir distribuição exata e sem duplicatas
  await db.delete(quizQuestions).where(eq(quizQuestions.active, true));

  let inserted = 0;
  for (const q of OFFICIAL_QUIZ_QUESTIONS) {
    await db.insert(quizQuestions).values({
      gameType: q.gameType,
      difficulty: q.difficulty,
      theme: q.theme,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation,
      active: true,
    });
    inserted += 1;
  }

  console.log(`Sucesso: ${inserted} perguntas oficiais sincronizadas no banco.`);
  const summary: Record<string, number> = {};
  for (const q of OFFICIAL_QUIZ_QUESTIONS) {
    const key = `${q.gameType}:${q.difficulty}`;
    summary[key] = (summary[key] || 0) + 1;
  }
  console.log("Distribuição por nível:", summary);
}

if (process.argv[1]?.endsWith("syncQuestions.ts")) {
  syncOfficialQuestionsToDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
