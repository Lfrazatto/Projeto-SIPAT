import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import {
  GameResult,
  GameSetting,
  InsertGameResult,
  InsertParticipant,
  InsertQuizQuestion,
  InsertUser,
  Participant,
  QuizQuestion,
  gameResults as mysqlGameResults,
  gameSettings as mysqlGameSettings,
  participants as mysqlParticipants,
  quizQuestions as mysqlQuizQuestions,
  scenarioImages as mysqlScenarioImages,
  spotErrorHotspots as mysqlSpotErrorHotspots,
  muralMessages as mysqlMuralMessages,
  MuralMessage,
  InsertMuralMessage,
  users as mysqlUsers,
  participantAchievements as mysqlParticipantAchievements,
  ParticipantAchievement,
} from "../drizzle/schema";
import * as d1Schema from "../drizzle/d1Schema";

import { ACHIEVEMENT_DEFINITIONS } from "../shared/achievements";
import { ENV } from "./_core/env";
import { getCached, invalidateCachePrefix } from "./readCache";
import {
  INITIAL_CDBS_SPOT_ERROR_HOTSPOTS,
  V4_CDBS_SPOT_ERROR_HOTSPOTS,
  CDBS_EVENT_QUESTIONS,
  INITIAL_GAME_SETTINGS,
  INITIAL_SECURITY_QUESTIONS,
  CDBS_SPOT_ERROR_SCENARIOS,
} from "./seedData";

let _db: ReturnType<typeof drizzle> | null = null;
let workerDatabaseConfig: {
  databaseUrl?: string;
  hyperdrive?: { host: string; user: string; password: string; database: string; port: number };
  d1?: unknown;
} | null = null;
let configuredDatabaseMode: "d1" | "mysql" | null = null;

// O Worker usa o schema SQLite real do D1. O fallback MySQL continua disponível
// para o servidor local, mas não deve ser passado ao driver D1.
let users: typeof mysqlUsers = mysqlUsers;
let participants: typeof mysqlParticipants = mysqlParticipants;
let gameResults: typeof mysqlGameResults = mysqlGameResults;
let gameSettings: typeof mysqlGameSettings = mysqlGameSettings;
let quizQuestions: typeof mysqlQuizQuestions = mysqlQuizQuestions;
let scenarioImages: typeof mysqlScenarioImages = mysqlScenarioImages;
let spotErrorHotspots: typeof mysqlSpotErrorHotspots = mysqlSpotErrorHotspots;
let muralMessages: typeof mysqlMuralMessages = mysqlMuralMessages;
let participantAchievements: typeof mysqlParticipantAchievements = mysqlParticipantAchievements;

function dbTimestamp() {
  return (workerDatabaseConfig?.d1 ? new Date().toISOString() : new Date()) as any;
}

function dbDate(value: Date | null) {
  return (workerDatabaseConfig?.d1 ? (value ? value.toISOString() : null) : value) as any;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function configureWorkerDatabase(runtime: {
  DATABASE_URL?: string;
  HYPERDRIVE?: { host: string; user: string; password: string; database: string; port: number };
  DB?: unknown;
}) {
  const nextMode = runtime.DB ? "d1" : "mysql";
  if (configuredDatabaseMode !== nextMode) {
    _db = null;
    configuredDatabaseMode = nextMode;
  }
  workerDatabaseConfig = {
    databaseUrl: runtime.DATABASE_URL,
    hyperdrive: runtime.HYPERDRIVE,
    d1: runtime.DB,
  };
  const schema = nextMode === "d1" ? d1Schema : null;
  users = (schema?.users ?? mysqlUsers) as typeof mysqlUsers;
  participants = (schema?.participants ?? mysqlParticipants) as typeof mysqlParticipants;
  gameResults = (schema?.gameResults ?? mysqlGameResults) as typeof mysqlGameResults;
  gameSettings = (schema?.gameSettings ?? mysqlGameSettings) as typeof mysqlGameSettings;
  quizQuestions = (schema?.quizQuestions ?? mysqlQuizQuestions) as typeof mysqlQuizQuestions;
  scenarioImages = (schema?.scenarioImages ?? mysqlScenarioImages) as typeof mysqlScenarioImages;
  spotErrorHotspots = (schema?.spotErrorHotspots ?? mysqlSpotErrorHotspots) as typeof mysqlSpotErrorHotspots;
  muralMessages = (schema?.muralMessages ?? mysqlMuralMessages) as typeof mysqlMuralMessages;
  participantAchievements = (schema?.participantAchievements ?? mysqlParticipantAchievements) as typeof mysqlParticipantAchievements;
}

export async function getDb() {
  if (!_db && workerDatabaseConfig?.d1) {
    try {
      _db = drizzleD1(workerDatabaseConfig.d1 as any) as any;
    } catch (error) {
      console.warn("[Database] Failed to initialize D1:", error);
      _db = null;
    }
  }
  const databaseUrl = workerDatabaseConfig?.databaseUrl ?? process.env.DATABASE_URL;
  const hyperdrive = workerDatabaseConfig?.hyperdrive;
  if (!_db && (databaseUrl || hyperdrive)) {
    try {
      const configuredLimit = Number(process.env.DB_CONNECTION_LIMIT ?? 20);
      const connectionLimit = Number.isFinite(configuredLimit) ? Math.min(50, Math.max(5, Math.floor(configuredLimit))) : 20;
      _db = drizzle({
        connection: hyperdrive
          ? { ...hyperdrive, connectionLimit }
          : { uri: databaseUrl, connectionLimit, waitForConnections: true, queueLimit: 0 },
      });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = {
    openId: user.openId,
  };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = dbTimestamp();
  }
  if (Object.keys(updateSet).length === 0) {
    updateSet.lastSignedIn = dbTimestamp();
  }

  if (workerDatabaseConfig?.d1) {
    const insert = db.insert(users).values(values) as any;
    await insert.onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } else {
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function ensureInitialSeeds(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existingSettings = await db.select().from(gameSettings);
  const settingsByKey = new Map(existingSettings.map((setting) => [setting.gameKey, setting]));
  for (const setting of INITIAL_GAME_SETTINGS) {
    if (settingsByKey.has(setting.gameKey)) {
      await db.update(gameSettings).set({ title: setting.title, description: setting.description, updatedAt: dbTimestamp() }).where(eq(gameSettings.gameKey, setting.gameKey));
    } else {
      await db.insert(gameSettings).values(setting);
    }
  }

  const existingQuestions = await db.select({ count: sql<number>`count(*)` }).from(quizQuestions);
  if (Number(existingQuestions[0]?.count ?? 0) < 36) {
    const { OFFICIAL_QUIZ_QUESTIONS } = await import("./quizQuestionsCatalog");
    for (let sortOrder = 0; sortOrder < OFFICIAL_QUIZ_QUESTIONS.length; sortOrder += 1) {
      const question = OFFICIAL_QUIZ_QUESTIONS[sortOrder];
      const [found] = await db
        .select({ id: quizQuestions.id })
        .from(quizQuestions)
        .where(and(eq(quizQuestions.gameType, question.gameType), eq(quizQuestions.question, question.question)))
        .limit(1);
      if (!found) {
        await db.insert(quizQuestions).values({
          gameType: question.gameType,
          difficulty: question.difficulty,
          theme: question.theme,
          question: question.question,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctOption: question.correctOption,
          explanation: question.explanation,
          active: true,
          sortOrder,
        });
      }
    }
  }

  const existingHotspots = await db
    .select({ scenarioKey: spotErrorHotspots.scenarioKey, title: spotErrorHotspots.title })
    .from(spotErrorHotspots);
  const knownHotspots = new Set(existingHotspots.map((row) => `${row.scenarioKey}::${row.title}`));
  const allInitialHotspots = [...INITIAL_CDBS_SPOT_ERROR_HOTSPOTS, ...V4_CDBS_SPOT_ERROR_HOTSPOTS];
  const missingHotspots = allInitialHotspots.filter(
    (hotspot) => !knownHotspots.has(`${hotspot.scenarioKey}::${hotspot.title}`),
  );
  if (missingHotspots.length) await db.insert(spotErrorHotspots).values([...missingHotspots]);
  const existingImages = await db.select({ scenarioKey: scenarioImages.scenarioKey }).from(scenarioImages);
  const existingImageKeys = new Set(existingImages.map((row) => row.scenarioKey));
  for (const scenario of CDBS_SPOT_ERROR_SCENARIOS) {
    const imageData = { label: scenario.label, imageUrl: scenario.image, safeImageUrl: scenario.safeImage, description: "Par correspondente da mesma cena: imagem segura e imagem com condições inseguras. Ilustração criada com IA para treinamento SIPAT CDBS; não é fotografia real da fábrica.", updatedAt: dbTimestamp() };
    if (existingImageKeys.has(scenario.key)) await db.update(scenarioImages).set(imageData).where(eq(scenarioImages.scenarioKey, scenario.key));
    else await db.insert(scenarioImages).values({ scenarioKey: scenario.key, ...imageData });
  }

}

export async function listScenarioImages(activeOnly = true) {
  return getCached(`scenario-images:${activeOnly ? "active" : "all"}`, 60_000, async () => {
    const db = await getDb();
    if (!db) return [];
    const query = db.select().from(scenarioImages);
    return activeOnly ? query.where(eq(scenarioImages.active, true)).orderBy(desc(scenarioImages.id)) : query.orderBy(desc(scenarioImages.id));
  });
}

export type ScenarioImageData = {
  scenarioKey: string;
  label: string;
  imageUrl: string;
  safeImageUrl?: string;
  sourceUrl?: string;
  description?: string;
  difficulty?: "facil" | "medio" | "dificil" | "muito_dificil";
  timeSeconds?: number;
  hintCount?: number;
  hintCost?: number;
  wrongClickPenalty?: number;
  phaseMode?: "livres" | "sequenciais";
  active?: boolean;
};

export async function createScenarioImage(data: ScenarioImageData) {
  const db = await getDb();
  if (!db) return;
  await db.insert(scenarioImages).values(data);
  invalidateCachePrefix("scenario-images:");
}

export async function updateScenarioImage(scenarioKey: string, data: Omit<ScenarioImageData, "scenarioKey">) {
  const db = await getDb();
  if (!db) return;
  await db.update(scenarioImages).set({ ...data, updatedAt: dbTimestamp() }).where(eq(scenarioImages.scenarioKey, scenarioKey));
  invalidateCachePrefix("scenario-images:");
}

export async function deleteScenarioImage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(scenarioImages).where(eq(scenarioImages.id, id));
  invalidateCachePrefix("scenario-images:");
}

export async function deleteScenario(scenarioKey: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(spotErrorHotspots).where(eq(spotErrorHotspots.scenarioKey, scenarioKey));
  await db.delete(scenarioImages).where(eq(scenarioImages.scenarioKey, scenarioKey));
  invalidateCachePrefix("spot-hotspots:");
  invalidateCachePrefix("scenario-images:");
}

export async function listSpotErrorHotspots(activeOnly = true, scenarioKey?: string) {
  return getCached(`spot-hotspots:${activeOnly ? "active" : "all"}:${scenarioKey ?? "all"}`, 60_000, async () => {
    const db = await getDb();
    if (!db) return [];
    const filters = [];
    if (activeOnly) filters.push(eq(spotErrorHotspots.active, true));
    if (scenarioKey) filters.push(eq(spotErrorHotspots.scenarioKey, scenarioKey));
    const query = db.select().from(spotErrorHotspots);
    return filters.length ? query.where(and(...filters)).orderBy(desc(spotErrorHotspots.id)) : query.orderBy(desc(spotErrorHotspots.id));
  });
}

export async function createSpotErrorHotspot(data: { scenarioKey: string; title: string; description: string; hint?: string; category: string; x: number; y: number; width?: number; height?: number; tolerance?: number; shape?: "retangulo" | "circulo" | "poligono"; points?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(spotErrorHotspots).values({
    ...data,
    x: Number(Math.min(100, Math.max(0, data.x)).toFixed(3)),
    y: Number(Math.min(100, Math.max(0, data.y)).toFixed(3)),
    width: Number(Math.min(100, Math.max(0.1, data.width ?? 14)).toFixed(3)),
    height: Number(Math.min(100, Math.max(0.1, data.height ?? 13)).toFixed(3)),
    tolerance: Number(Math.min(2, Math.max(0, data.tolerance ?? 1)).toFixed(3)),
  });
  invalidateCachePrefix("spot-hotspots:");
}

export async function updateSpotErrorHotspot(id: number, data: Partial<{ scenarioKey: string; title: string; description: string; hint: string; category: string; x: number; y: number; width: number; height: number; tolerance: number; shape: "retangulo" | "circulo" | "poligono"; points: string; active: boolean }>) {
  const db = await getDb();
  if (!db) return;
  const normalized = { ...data };
  if (normalized.x !== undefined) normalized.x = Number(Math.min(100, Math.max(0, normalized.x)).toFixed(3));
  if (normalized.y !== undefined) normalized.y = Number(Math.min(100, Math.max(0, normalized.y)).toFixed(3));
  if (normalized.width !== undefined) normalized.width = Number(Math.min(100, Math.max(0.1, normalized.width)).toFixed(3));
  if (normalized.height !== undefined) normalized.height = Number(Math.min(100, Math.max(0.1, normalized.height)).toFixed(3));
  if (normalized.tolerance !== undefined) normalized.tolerance = Number(Math.min(2, Math.max(0, normalized.tolerance)).toFixed(3));
  await db.update(spotErrorHotspots).set({ ...normalized, updatedAt: dbTimestamp() }).where(eq(spotErrorHotspots.id, id));
  invalidateCachePrefix("spot-hotspots:");
}

export async function deleteSpotErrorHotspot(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(spotErrorHotspots).where(eq(spotErrorHotspots.id, id));
  invalidateCachePrefix("spot-hotspots:");
}

export async function findOrCreateParticipant(name: string, chapa: string, wwid: string, participantType?: "terceiro" | "cummins" | "visitante"): Promise<Participant> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const cleanChapa = chapa.trim().toUpperCase();
  const cleanWwid = wwid.trim().toUpperCase();
  const cleanName = name.trim();

  const existing = await db
    .select()
    .from(participants)
    .where(or(eq(participants.wwid, cleanWwid), eq(participants.chapa, cleanChapa)))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    if (cleanName !== current.name || cleanChapa !== current.chapa || cleanWwid !== current.wwid || (participantType && current.participantType !== participantType)) {
      await db
        .update(participants)
        .set({ name: cleanName || current.name, ...(participantType ? { participantType } : {}), chapa: cleanChapa, wwid: cleanWwid, updatedAt: dbTimestamp() })
        .where(eq(participants.id, current.id));
      invalidateCachePrefix("ranking:");
      return { ...current, name: cleanName || current.name, participantType: participantType || current.participantType, chapa: cleanChapa, wwid: cleanWwid };
    }
    return existing[0];
  }

  const newRecord: InsertParticipant = {
    name: cleanName,
    participantType: participantType || "terceiro",
    chapa: cleanChapa,
    wwid: cleanWwid,
    totalScore: 0,
    completedGamesCount: 0,
    bestSecurityScore: 0,
    bestEnvironmentScore: 0,
    bestSpotErrorScore: 0,
    bestOrganizeScore: 0,
    totalCorrectAnswers: 0,
    totalWrongAnswers: 0,
    highestDifficulty: "Fácil",
  };

  await db.insert(participants).values(newRecord);
  invalidateCachePrefix("ranking:");

  const created = await db
    .select()
    .from(participants)
    .where(eq(participants.wwid, cleanWwid))
    .limit(1);

  return created[0];
}

export async function getParticipantById(id: number): Promise<Participant | undefined> {
  const dbConn = await getDb();
  if (!dbConn) return undefined;
  const rows = await dbConn.select().from(participants).where(eq(participants.id, id)).limit(1);
  return rows[0];
}

export async function getParticipantByWwid(wwid: string): Promise<Participant | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const cleanWwid = wwid.trim().toUpperCase();
  const rows = await db.select().from(participants).where(eq(participants.wwid, cleanWwid)).limit(1);
  return rows[0];
}

export async function getParticipantByChapa(chapa: string): Promise<Participant | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const cleanChapa = chapa.trim().toUpperCase();
  const rows = await db.select().from(participants).where(eq(participants.chapa, cleanChapa)).limit(1);
  return rows[0];
}

export async function getDailyAttemptsCount(participantId: number, gameType: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(gameResults)
    .where(
      and(
        eq(gameResults.participantId, participantId),
        eq(gameResults.gameType, gameType as any),
        sql`${gameResults.createdAt} >= ${dbDate(startOfDay)}`
      )
    );
  return Number(rows[0]?.count ?? 0);
}

export async function calculateParticipantStats(participantId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const results = await db
    .select()
    .from(gameResults)
    .where(eq(gameResults.participantId, participantId));

  let bestSecurity = 0;
  let bestEnvironment = 0;
  let bestSpot = 0;
  let bestOrganize = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  const difficultiesSeen = new Set<string>();

  for (const r of results) {
    totalCorrect += r.correctCount;
    totalWrong += r.wrongCount;
    difficultiesSeen.add(r.difficulty);

    if (r.gameType === "quiz_seguranca" && r.score > bestSecurity) bestSecurity = r.score;
    if (r.gameType === "quiz_ergonomia" && r.score > bestEnvironment) bestEnvironment = r.score;
    if (r.gameType === "ache_o_erro" && r.score > bestSpot) bestSpot = r.score;
    if (r.gameType === "organize_a_fabrica" && r.score > bestOrganize) bestOrganize = r.score;
  }

  const completedCount =
    (bestSecurity > 0 ? 1 : 0) +
    (bestEnvironment > 0 ? 1 : 0) +
    (bestSpot > 0 ? 1 : 0) +
    (bestOrganize > 0 ? 1 : 0);

  const totalScore = bestSecurity + bestEnvironment + bestSpot + bestOrganize;
  const accumulatedScore = results.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
  const effectiveTotal = accumulatedScore > 0 ? accumulatedScore : totalScore;

  let highestDiffLabel = "Fácil";
  if (difficultiesSeen.has("dificil")) highestDiffLabel = "Difícil";
  else if (difficultiesSeen.has("medio")) highestDiffLabel = "Médio";

  await db
    .update(participants)
    .set({
      totalScore: effectiveTotal,
      completedGamesCount: completedCount,
      bestSecurityScore: bestSecurity,
      bestEnvironmentScore: bestEnvironment,
      bestSpotErrorScore: bestSpot,
      bestOrganizeScore: bestOrganize,
      totalCorrectAnswers: totalCorrect,
      totalWrongAnswers: totalWrong,
      highestDifficulty: highestDiffLabel,
      updatedAt: dbTimestamp(),
    })
    .where(eq(participants.id, participantId));
}

export async function recordGameResult(data: {
  participantChapa: string;
  participantName: string;
  participantWwid: string;
  scenarioKey?: string;
  gameType: "quiz_seguranca" | "quiz_ergonomia" | "ache_o_erro" | "organize_a_fabrica";
  difficulty: "facil" | "medio" | "dificil" | "muito_dificil";
  score: number;
  correctCount: number;
  wrongCount: number;
  hintsUsed?: number;
  timeSpentSeconds: number;
}): Promise<{
  result: GameResult;
  participant: Participant;
  isNewBest: boolean;
  totalScore: number;
  rank: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const participant = await findOrCreateParticipant(data.participantName, data.participantChapa, data.participantWwid);

  let currentBestForGame = 0;
  if (data.gameType === "quiz_seguranca") currentBestForGame = participant.bestSecurityScore;
  if (data.gameType === "quiz_ergonomia") currentBestForGame = participant.bestEnvironmentScore;
  if (data.gameType === "ache_o_erro") currentBestForGame = participant.bestSpotErrorScore;
  if (data.gameType === "organize_a_fabrica") currentBestForGame = participant.bestOrganizeScore;

  const isNewBest = data.score > currentBestForGame;

  const insertData: InsertGameResult = {
    participantId: participant.id,
    scenarioKey: data.scenarioKey || "unknown",
    participantChapa: participant.chapa,
    participantWwid: participant.wwid,
    participantName: participant.name,
    gameType: data.gameType,
    difficulty: data.difficulty,
    score: data.score,
    correctCount: data.correctCount,
    wrongCount: data.wrongCount,
    hintsUsed: data.hintsUsed || 0,
    timeSpentSeconds: data.timeSpentSeconds,
    isBestScore: isNewBest,
  };

  await db.insert(gameResults).values(insertData);

  await calculateParticipantStats(participant.id);
  invalidateCachePrefix("ranking:");
  const updatedParticipant = (await getParticipantByWwid(participant.wwid))!;

  const higherRanks = await db
    .select({ count: sql<number>`count(*)` })
    .from(participants)
    .where(sql`${participants.totalScore} > ${updatedParticipant.totalScore}`);

  const rank = Number(higherRanks[0]?.count ?? 0) + 1;

  const lastInserted = await db
    .select()
    .from(gameResults)
    .where(eq(gameResults.participantId, participant.id))
    .orderBy(desc(gameResults.id))
    .limit(1);

  return {
    result: lastInserted[0],
    participant: updatedParticipant,
    isNewBest,
    totalScore: updatedParticipant.totalScore,
    rank,
  };
}

export async function getRankingList(filterGame?: string, sortBy: "highest" | "lowest" | "recent" = "highest", participantType?: "todos" | "cummins" | "terceiro" | "visitante") {
  return getCached(`ranking:${filterGame ?? "geral"}:${sortBy}:${participantType ?? "todos"}`, 5_000, async () => {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(participants);

  let all = await query;

  if (participantType && participantType !== "todos") {
    all = all.filter((participant) => participant.participantType === participantType);
  }

  if (filterGame && filterGame !== "geral") {
    all = all.filter((p) => {
      if (filterGame === "quiz_seguranca") return p.bestSecurityScore > 0;
      if (filterGame === "quiz_ergonomia") return p.bestEnvironmentScore > 0;
      if (filterGame === "ache_o_erro") return p.bestSpotErrorScore > 0;
      if (filterGame === "organize_a_fabrica") return p.bestOrganizeScore > 0;
      return true;
    });
  }

  all.sort((a, b) => {
    let scoreA = a.totalScore;
    let scoreB = b.totalScore;

    if (filterGame === "quiz_seguranca") {
      scoreA = a.bestSecurityScore;
      scoreB = b.bestSecurityScore;
    } else if (filterGame === "quiz_ergonomia") {
      scoreA = a.bestEnvironmentScore;
      scoreB = b.bestEnvironmentScore;
    } else if (filterGame === "ache_o_erro") {
      scoreA = a.bestSpotErrorScore;
      scoreB = b.bestSpotErrorScore;
    } else if (filterGame === "organize_a_fabrica") {
      scoreA = a.bestOrganizeScore;
      scoreB = b.bestOrganizeScore;
    }

    if (sortBy === "lowest") return scoreA - scoreB;
    if (sortBy === "recent") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return scoreB - scoreA;
  });

  return all.map((p, index) => {
    let specificScore = p.totalScore;
    if (filterGame === "quiz_seguranca") specificScore = p.bestSecurityScore;
    else if (filterGame === "quiz_ergonomia") specificScore = p.bestEnvironmentScore;
    else if (filterGame === "ache_o_erro") specificScore = p.bestSpotErrorScore;
    else if (filterGame === "organize_a_fabrica") specificScore = p.bestOrganizeScore;

    return {
      rank: index + 1,
      id: p.id,
      name: p.name,
      participantType: p.participantType,
      chapa: p.chapa,
      wwid: p.wwid,
      totalScore: p.totalScore,
      specificScore,
      completedGamesCount: p.completedGamesCount,
      bestSecurityScore: p.bestSecurityScore,
      bestEnvironmentScore: p.bestEnvironmentScore,
      bestSpotErrorScore: p.bestSpotErrorScore,
      bestOrganizeScore: p.bestOrganizeScore,
      updatedAt: p.updatedAt,
    };
  });
  });
}

export async function searchRankingUser(term: string) {
  const ranking = await getRankingList();
  const clean = term.trim().toLowerCase();
  if (!clean) return undefined;

  const found = ranking.find(
    (item) => item.wwid.toLowerCase() === clean || item.chapa.toLowerCase() === clean || item.name.toLowerCase().includes(clean)
  );

  return found;
}

export async function getQuizQuestions(gameType: "quiz_seguranca" | "quiz_ergonomia") {
  return getCached(`quiz-questions:${gameType}`, 60_000, async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(quizQuestions)
      .where(and(eq(quizQuestions.gameType, gameType), eq(quizQuestions.active, true)))
      .orderBy(asc(quizQuestions.sortOrder), asc(quizQuestions.id));
  });
}

export async function getGameSettings() {
  return getCached("game-settings", 15_000, async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(gameSettings);
    return rows.map((setting) => ({
      ...setting,
      accessStartAt: toDateOrNull(setting.accessStartAt),
      accessEndAt: toDateOrNull(setting.accessEndAt),
      updatedAt: toDateOrNull(setting.updatedAt) ?? new Date(0),
    }));
  });
}

export async function updateGameStatus(gameKey: string, active: boolean) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(gameSettings)
    .set({ active, updatedAt: dbTimestamp() })
    .where(eq(gameSettings.gameKey, gameKey));
  invalidateCachePrefix("game-settings");
}

export async function updateGameAccess(gameKey: string, data: { active: boolean; accessStartAt: Date | null; accessEndAt: Date | null }) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(gameSettings)
    .set({ ...data, accessStartAt: dbDate(data.accessStartAt), accessEndAt: dbDate(data.accessEndAt), updatedAt: dbTimestamp() })
    .where(eq(gameSettings.gameKey, gameKey));
  invalidateCachePrefix("game-settings");
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalParticipants: 0,
      totalMatches: 0,
      totalQuizzes: 0,
      totalInteractiveGames: 0,
      highestScore: 0,
      leader: null,
      totalCompletedAll: 0,
    };
  }

  const [partRow] = await db.select({ count: sql<number>`count(*)` }).from(participants);
  const [matchRow] = await db.select({ count: sql<number>`count(*)` }).from(gameResults);
  const [quizRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(gameResults)
    .where(or(eq(gameResults.gameType, "quiz_seguranca"), eq(gameResults.gameType, "quiz_ergonomia")));
  const [gameRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(gameResults)
    .where(or(eq(gameResults.gameType, "ache_o_erro"), eq(gameResults.gameType, "organize_a_fabrica")));
  const [completedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(participants)
    .where(eq(participants.completedGamesCount, 4));

  const [leader] = await db
    .select()
    .from(participants)
    .orderBy(desc(participants.totalScore))
    .limit(1);

  return {
    totalParticipants: Number(partRow?.count ?? 0),
    totalMatches: Number(matchRow?.count ?? 0),
    totalQuizzes: Number(quizRow?.count ?? 0),
    totalInteractiveGames: Number(gameRow?.count ?? 0),
    highestScore: leader ? leader.totalScore : 0,
    leader: leader ? { name: leader.name, wwid: leader.wwid, score: leader.totalScore } : null,
    totalCompletedAll: Number(completedRow?.count ?? 0),
  };
}

export async function deleteParticipant(participantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(gameResults).where(eq(gameResults.participantId, participantId));
  await db.delete(participants).where(eq(participants.id, participantId));
}

export async function updateParticipantData(
  participantId: number,
  data: { name?: string; chapa?: string; wwid?: string; totalScore?: number }
) {
  const db = await getDb();
  if (!db) return;
  const updateObj: Record<string, unknown> = { updatedAt: dbTimestamp() };
  if (data.name) updateObj.name = data.name.trim();
  if (data.chapa) updateObj.chapa = data.chapa.trim().toUpperCase();
  if (data.wwid) updateObj.wwid = data.wwid.trim().toUpperCase();
  if (data.totalScore !== undefined) updateObj.totalScore = data.totalScore;

  await db.update(participants).set(updateObj).where(eq(participants.id, participantId));
}

export async function deleteGameResult(resultId: number) {
  const db = await getDb();
  if (!db) return;

  const row = await db.select().from(gameResults).where(eq(gameResults.id, resultId)).limit(1);
  if (row.length === 0) return;

  const participantId = row[0].participantId;
  await db.delete(gameResults).where(eq(gameResults.id, resultId));
  await calculateParticipantStats(participantId);
}

export async function clearParticipantResults(participantId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(gameResults).where(eq(gameResults.participantId, participantId));
  await calculateParticipantStats(participantId);
}

export async function createQuizQuestion(data: InsertQuizQuestion) {
  const db = await getDb();
  if (!db) return;
  const sameGameQuestions = await db
    .select({ sortOrder: quizQuestions.sortOrder })
    .from(quizQuestions)
    .where(eq(quizQuestions.gameType, data.gameType));
  const nextSortOrder = sameGameQuestions.reduce((max, row) => Math.max(max, Number(row.sortOrder) || 0), -1) + 1;
  await db.insert(quizQuestions).values({ ...data, sortOrder: data.sortOrder ?? nextSortOrder });
  invalidateCachePrefix("quiz-questions:");
}

export async function updateQuizQuestion(id: number, data: Partial<InsertQuizQuestion>) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(quizQuestions)
    .set({ ...data, updatedAt: dbTimestamp() })
    .where(eq(quizQuestions.id, id));
  invalidateCachePrefix("quiz-questions:");
}

export async function reorderQuizQuestion(id: number, direction: "up" | "down") {
  const db = await getDb();
  if (!db) return false;

  const [question] = await db.select().from(quizQuestions).where(eq(quizQuestions.id, id)).limit(1);
  if (!question) return false;

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.gameType, question.gameType))
    .orderBy(asc(quizQuestions.sortOrder), asc(quizQuestions.id));
  const currentIndex = questions.findIndex((item) => item.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= questions.length) return false;

  const reordered = [...questions];
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, moved);
  for (let index = 0; index < reordered.length; index += 1) {
    await db
      .update(quizQuestions)
      .set({ sortOrder: index, updatedAt: dbTimestamp() })
      .where(eq(quizQuestions.id, reordered[index].id));
  }
  invalidateCachePrefix("quiz-questions:");
  return true;
}

export async function deleteQuizQuestion(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
  invalidateCachePrefix("quiz-questions:");
}

export async function listAllQuestions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizQuestions).orderBy(asc(quizQuestions.gameType), asc(quizQuestions.sortOrder), asc(quizQuestions.id));
}

export async function listAllParticipants(search?: string, participantType?: "terceiro" | "cummins" | "visitante") {
  const db = await getDb();
  if (!db) return [];

  const typeFilter = participantType ? eq(participants.participantType, participantType) : undefined;
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select()
      .from(participants)
      .where(and(or(like(participants.name, term), like(participants.chapa, term), like(participants.wwid, term)), ...(typeFilter ? [typeFilter] : [])))
      .orderBy(desc(participants.totalScore));
  }

  return db.select().from(participants).where(typeFilter).orderBy(desc(participants.totalScore));
}

export async function listAllGameResults(search?: string) {
  const db = await getDb();
  if (!db) return [];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select()
      .from(gameResults)
      .where(or(like(gameResults.participantName, term), like(gameResults.participantChapa, term), like(gameResults.participantWwid, term)))
      .orderBy(desc(gameResults.createdAt));
  }

  return db.select().from(gameResults).orderBy(desc(gameResults.createdAt)).limit(100);
}

export async function listApprovedMuralMessages(promptKey?: string, limit = 60) {
  return getCached(`mural-approved:${promptKey ?? "all"}:${Math.min(limit, 60)}`, 10_000, async () => {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(muralMessages.status, "aprovada")];
  if (promptKey && promptKey !== "todas") {
    conditions.push(eq(muralMessages.promptKey, promptKey));
  }

  return db
    .select({
      id: muralMessages.id,
      promptKey: muralMessages.promptKey,
      promptText: muralMessages.promptText,
      message: muralMessages.message,
      publicName: muralMessages.publicName,
      isAnonymous: muralMessages.isAnonymous,
      isFeatured: muralMessages.isFeatured,
      submittedAt: muralMessages.submittedAt,
    })
    .from(muralMessages)
    .where(and(...conditions))
    .orderBy(desc(muralMessages.isFeatured), desc(muralMessages.submittedAt))
    .limit(Math.min(limit, 60));
  });
}

export async function getFeaturedMuralMessage() {
  return getCached("mural-featured", 10_000, async () => {
  const db = await getDb();
  if (!db) return null;
  const [featured] = await db
    .select({
      id: muralMessages.id,
      promptKey: muralMessages.promptKey,
      promptText: muralMessages.promptText,
      message: muralMessages.message,
      publicName: muralMessages.publicName,
      isAnonymous: muralMessages.isAnonymous,
      isFeatured: muralMessages.isFeatured,
      submittedAt: muralMessages.submittedAt,
    })
    .from(muralMessages)
    .where(and(eq(muralMessages.status, "aprovada"), eq(muralMessages.isFeatured, true)))
    .orderBy(desc(muralMessages.submittedAt))
    .limit(1);

  return featured || null;
  });
}

export async function createMuralSubmission(data: {
  promptKey: string;
  promptText: string;
  message: string;
  publicName?: string | null;
  isAnonymous: boolean;
  consent: boolean;
  participantId?: number | null;
  flagged: boolean;
  flagReasons?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const [inserted] = await db.insert(muralMessages).values({
    promptKey: data.promptKey,
    promptText: data.promptText,
    message: data.message,
    publicName: data.publicName || null,
    isAnonymous: data.isAnonymous,
    consent: data.consent,
    participantId: data.participantId || null,
    status: "pendente",
    isFeatured: false,
    flagged: data.flagged,
    flagReasons: data.flagReasons || null,
  });

  invalidateCachePrefix("mural-");
  return inserted;
}

export async function listAllMuralMessagesAdmin(statusFilter?: "todos" | "pendente" | "aprovada" | "rejeitada" | "arquivada", search?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (statusFilter && statusFilter !== "todos") {
    conditions.push(eq(muralMessages.status, statusFilter));
  }
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(like(muralMessages.message, term), like(muralMessages.publicName, term), like(muralMessages.promptText, term)));
  }

  return db
    .select()
    .from(muralMessages)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(muralMessages.submittedAt));
}

export async function moderateMuralMessage(id: number, action: "aprovar" | "rejeitar" | "arquivar" | "destacar" | "remover_destaque", moderator: string, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");

  const updateObj: Record<string, unknown> = {
    moderatedAt: dbTimestamp(),
    moderatedBy: moderator,
    updatedAt: dbTimestamp(),
  };
  if (note !== undefined) updateObj.moderationNote = note;

  if (action === "aprovar") {
    updateObj.status = "aprovada";
  } else if (action === "rejeitar") {
    updateObj.status = "rejeitada";
    updateObj.isFeatured = false;
  } else if (action === "arquivar") {
    updateObj.status = "arquivada";
    updateObj.isFeatured = false;
  } else if (action === "destacar") {
    await db.update(muralMessages).set({ isFeatured: false }).where(eq(muralMessages.isFeatured, true));
    updateObj.status = "aprovada";
    updateObj.isFeatured = true;
  } else if (action === "remover_destaque") {
    updateObj.isFeatured = false;
  }

  await db.update(muralMessages).set(updateObj).where(eq(muralMessages.id, id));
  invalidateCachePrefix("mural-");
}

export async function updateMuralMessageText(id: number, message: string, moderator: string) {
  const db = await getDb();
  if (!db) throw new Error("Database offline");
  await db
    .update(muralMessages)
    .set({
      message: message.trim(),
      moderatedBy: moderator,
      updatedAt: dbTimestamp(),
    })
    .where(eq(muralMessages.id, id));
  invalidateCachePrefix("mural-");
}

export async function deleteMuralMessage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(muralMessages).where(eq(muralMessages.id, id));
  invalidateCachePrefix("mural-");
}


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
      if (workerDatabaseConfig?.d1) {
        const insert = db.insert(participantAchievements).values({ participantId, achievementKey: item.key }) as any;
        await insert.onConflictDoNothing();
      } else {
        await db.insert(participantAchievements).values({ participantId, achievementKey: item.key }).onDuplicateKeyUpdate({ set: { achievementKey: item.key } });
      }
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
