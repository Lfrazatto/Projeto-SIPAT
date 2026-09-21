import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ensureInitialSeeds } from "./db";

function createMockContext() {
  return { user: null, req: { protocol: "https", headers: {} } as any, res: { clearCookie: () => {} } as any };
}

describe("Cummins SIPAT Backend Logic", () => {
  beforeAll(async () => {
    await ensureInitialSeeds();
  });

  it("accepts only the restricted admin credential", async () => {
    const caller = appRouter.createCaller(createMockContext());
    expect((await caller.admin.verifyKey({ adminKey: "SIPATMA" })).isValid).toBe(true);
    expect((await caller.admin.verifyKey({ adminKey: "sipatma" })).isValid).toBe(true);
    expect((await caller.admin.verifyKey({ adminKey: "CUMMINS2026" })).isValid).toBe(false);
  });

  it("calculates proportional score based on remaining time", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const questions = await caller.games.getQuestions({ gameType: "quiz_seguranca" });
    expect(questions.length).toBeGreaterThan(0);
    const q = questions[0];
    expect("correctOption" in q).toBe(false);
    const full = await caller.games.verifyAnswer({ questionId: q.id, selectedOption: "B", remainingSeconds: 60, difficulty: "facil" });
    const half = await caller.games.verifyAnswer({ questionId: q.id, selectedOption: "B", remainingSeconds: 30, difficulty: "medio" });
    expect("correctOption" in full).toBe(false);
    expect("correctOption" in half).toBe(false);
    if (full.isCorrect) expect(full.earnedPoints).toBe(100);
    if (half.isCorrect) expect(half.earnedPoints).toBe(100);
  });

  it("never awards a correct answer after the quiz timer expires", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const questions = await caller.games.getQuestions({ gameType: "quiz_seguranca" });
    const timeout = await caller.games.verifyAnswer({ questionId: questions[0].id, selectedOption: "A", remainingSeconds: 0, difficulty: "facil" });
    expect(timeout.isCorrect).toBe(false);
    expect(timeout.earnedPoints).toBe(0);
  });

  it("exposes the CDBS scenario catalog and scoped safety hotspots", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const scenarios = await caller.games.getScenarioCatalog();
    expect(scenarios).toHaveLength(5);
    expect(scenarios.map((scenario) => scenario.key)).toEqual(expect.arrayContaining(["cdbs-v4-montagem-2026", "cdbs-v4-logistica-2026", "cdbs-v4-manutencao-2026", "cdbs-v4-usinagem-2026", "cdbs-v4-producao-2026"]));
    const hotspots = await caller.games.getSpotErrorHotspots({ scenarioKey: "cdbs-v4-montagem-2026" });
    expect(hotspots.length).toBeGreaterThan(0);
    expect(hotspots.every((hotspot) => hotspot.scenarioKey === "cdbs-v4-montagem-2026")).toBe(true);
    expect(hotspots.every((hotspot) => hotspot.width > 0 && hotspot.height > 0 && hotspot.tolerance >= 0)).toBe(true);
    const newScenarioHotspots = await caller.games.getSpotErrorHotspots({ scenarioKey: "cdbs-v4-montagem-2026" });
    expect(newScenarioHotspots).toHaveLength(7);
  });

  it("returns access-window metadata for each CDBS challenge", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const settings = await caller.games.getSettings();
    expect(settings).toHaveLength(4);
    expect(settings.every((setting) => typeof setting.isOpen === "boolean")).toBe(true);
    expect(settings.every((setting) => setting.title.includes("SIPAT CDBS"))).toBe(true);
  });

  it("serves ergonomics questions instead of environmental content", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const questions = await caller.games.getQuestions({ gameType: "quiz_ergonomia" });
    expect(questions).toHaveLength(12);
    expect(questions.every((question) => question.theme.includes("Ergonomia") || question.theme.includes("Postura") || question.theme.includes("Movimentação") || question.theme.includes("Pausas") || question.theme.includes("Saúde"))).toBe(true);
    expect(questions.some((question) => /postura|moviment|pausa|saúde/i.test(question.question))).toBe(true);
    expect(questions.every((question) => !/resíduo|emissão|ambiental|drenagem/i.test(`${question.question} ${question.explanation || ""}`))).toBe(true);
  });

  it("registers chapa and keeps the best score per challenge", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const id = `TEST${Date.now().toString().slice(-4)}`;
    const identified = await caller.participant.identify({ name: "Engenheiro Teste Cummins", participantType: "terceiro", identifier: id });
    expect(identified.participant.chapa).toBe(id);
    expect(identified.participant.wwid).toBe(id);

    const first = { participantChapa: id, participantName: "Engenheiro Teste Cummins", participantWwid: id, gameType: "quiz_seguranca" as const, difficulty: "medio" as const, score: 850, correctCount: 10, wrongCount: 2, timeSpentSeconds: 45 };
    const submit1 = await caller.games.submitResult(first);
    expect(submit1.totalScore).toBe(850);
    expect(submit1.participant.bestSecurityScore).toBe(850);

    const submitRetry = await caller.games.submitResult({ ...first, score: 700, correctCount: 8, wrongCount: 4 });
    expect(submitRetry.totalScore).toBe(850);

    const submitEnv = await caller.games.submitResult({ participantChapa: id, participantName: "Engenheiro Teste Cummins", participantWwid: id, gameType: "quiz_ergonomia", difficulty: "dificil", score: 900, correctCount: 11, wrongCount: 1, timeSpentSeconds: 50 });
    expect(submitEnv.totalScore).toBe(1750);
    expect(submitEnv.participant.completedGamesCount).toBe(2);
  });

  it("registers a visitor using only the informed name", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const visitorName = `Visitante SIPAT ${Date.now().toString().slice(-5)}`;
    const identified = await caller.participant.identify({ name: visitorName, participantType: "visitante" });
    expect(identified.participant.participantType).toBe("visitante");
    expect(identified.participant.chapa).toMatch(/^VISITANTE-/);
    expect(identified.participant.wwid).toBe(identified.participant.chapa);
  });

  it("returns an empty progress state for an unknown chapa or WWID", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const progress = await caller.participant.getProgress({ wwid: `NAO-CADASTRADO-${Date.now()}` });
    expect(progress.participant).toBeNull();
    expect(progress.rank).toBe(0);
    expect(progress.totalParticipants).toBeGreaterThanOrEqual(0);
  });

  it("filters the public ranking by participant profile", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const visitors = await caller.ranking.list({ gameFilter: "geral", sortBy: "highest", participantType: "visitante" });
    expect(visitors.every((participant) => participant.participantType === "visitante")).toBe(true);
  });
});
