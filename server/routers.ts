import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { quizQuestions } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { CDBS_SPOT_ERROR_SCENARIOS } from "./seedData";
import { storagePut } from "./storage";
import { ENV } from "./_core/env";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { analyzeMuralSafety, MURAL_PROMPTS } from "../shared/muralData";


const PARTICIPANT_SESSION_COOKIE = "sipat_participant_session";
const ADMIN_SESSION_COOKIE = "sipat_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function signSessionValue(scope: string, value: string, expiresAt: number) {
  const payload = `${scope}|${value}|${expiresAt}`;
  const signature = createHmac("sha256", ENV.cookieSecret || "sipat-fallback-session-secret").update(payload).digest("base64url");
  return `${payload}|${signature}`;
}

function readSessionValue(req: { headers?: { cookie?: string } }, scope: string, cookieName: string) {
  const token = parseCookieHeader(req.headers?.cookie ?? "")[cookieName];
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 4 || parts[0] !== scope) return null;
  const expiresAt = Number(parts[2]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now()) return null;
  const expected = createHmac("sha256", ENV.cookieSecret || "sipat-fallback-session-secret").update(`${parts[0]}|${parts[1]}|${parts[2]}`).digest("base64url");
  const candidate = Buffer.from(parts[3]);
  const expectedBuffer = Buffer.from(expected);
  if (candidate.length !== expectedBuffer.length || !timingSafeEqual(candidate, expectedBuffer)) return null;
  return parts[1];
}

function setSessionCookie(ctx: { req: any; res: any }, cookieName: string, scope: string, value: string) {
  if (typeof ctx.res?.cookie !== "function") return;
  ctx.res.cookie(cookieName, signSessionValue(scope, value, Date.now() + SESSION_TTL_MS), { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_TTL_MS });
}

function isValidAdminKey(value: string) {
  const configuredKey = ENV.adminAccessKey.trim();
  if (!configuredKey || !value.trim()) return false;
  const candidate = Buffer.from(value.trim());
  const expected = Buffer.from(configuredKey);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function isValidAdminRequest(value: string | undefined, req: { headers?: { cookie?: string } }) {
  return isValidAdminKey(value ?? "") || Boolean(readSessionValue(req, "admin", ADMIN_SESSION_COOKIE));
}

function participantSessionId(req: { headers?: { cookie?: string } }) {
  const value = readSessionValue(req, "participant", PARTICIPANT_SESSION_COOKIE);
  const id = value ? Number(value) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const scenarioImageUrlSchema = z.string().refine(
  (value) => value.startsWith("/manus-storage/") || /^https?:\/\//i.test(value),
  "Informe uma URL HTTPS ou uma imagem enviada ao armazenamento seguro."
);

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const quizAttempts = new Map<number, { gameType: "quiz_seguranca" | "quiz_ergonomia"; questionIds: Set<number>; answered: Set<number>; score: number; correctCount: number; wrongCount: number }>();

function clientAddress(req: { headers?: Record<string, string | string[] | undefined> }) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || "unknown-client";
}

function enforceRateLimit(scope: string, identity: string, limit: number, windowMs: number) {
  const key = `${scope}:${identity}`;
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || now >= current.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente." });
  }
  current.count += 1;
}

function maskIdentifier(value: string) {
  const normalized = value.trim();
  if (normalized.startsWith("VISITANTE-")) return "VISITANTE";
  if (normalized.length <= 4) return "••••";
  return `${normalized.slice(0, 2)}${"•".repeat(Math.min(4, normalized.length - 4))}${normalized.slice(-2)}`;
}

// Ensure seed data on server startup
db.ensureInitialSeeds().catch((err) => {
  console.error("Failed to seed initial questions/settings:", err);
});

async function assertGameOpen(gameKey: string) {
  const setting = (await db.getGameSettings()).find((item) => item.gameKey === gameKey);
  if (!setting) return;
  const now = Date.now();
  const isOpen = setting.active && (!setting.accessStartAt || now >= setting.accessStartAt.getTime()) && (!setting.accessEndAt || now <= setting.accessEndAt.getTime());
  if (!isOpen) {
    throw new TRPCError({ code: "FORBIDDEN", message: "A SIPAT está fora da janela de acesso configurada para o evento." });
  }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  participant: router({
    identify: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2, "O nome deve ter no mínimo 2 caracteres").max(120, "O nome deve ter no máximo 120 caracteres"),
          participantType: z.enum(["terceiro", "cummins", "visitante"]),
          identifier: z.string().trim().max(64).regex(/^[A-Za-z0-9._-]*$/, "Use apenas letras, números, ponto, hífen ou sublinhado.").optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        enforceRateLimit("participant-identify", clientAddress(ctx.req), 12, 60_000);
        const cleanName = input.name.trim();
        const identifier = input.identifier?.trim().toUpperCase() || "";
        if (input.participantType !== "visitante" && !identifier) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Informe ${input.participantType === "terceiro" ? "a chapa" : "o WWID"}.` });
        }
        const visitorKey = `VISITANTE-${randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`;
        const chapa = input.participantType === "visitante" ? visitorKey : identifier;
        const wwid = input.participantType === "visitante" ? visitorKey : identifier;
        const participant = await db.findOrCreateParticipant(cleanName, chapa, wwid, input.participantType);
        setSessionCookie(ctx, PARTICIPANT_SESSION_COOKIE, "participant", String(participant.id));
        const ranking = await db.getRankingList();
        const rankIndex = ranking.findIndex((item) => item.wwid === participant.wwid);

        return {
          participant,
          rank: rankIndex >= 0 ? rankIndex + 1 : 1,
        };
      }),

    getProgress: publicProcedure
      .input(
        z.object({
          wwid: z.string().trim().min(1).max(64).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const sessionId = participantSessionId(ctx.req);
        const cleanWwid = input.wwid?.trim().toUpperCase();
        const sessionParticipant = sessionId ? await db.getParticipantById(sessionId) : undefined;
        const participant = sessionParticipant || (cleanWwid ? (await db.getParticipantByWwid(cleanWwid)) || (await db.getParticipantByChapa(cleanWwid)) : undefined);
        const ranking = await db.getRankingList();
        if (!participant) {
          return {
            participant: null,
            rank: 0,
            totalParticipants: ranking.length,
          };
        }

        if (!sessionParticipant) {
          return { participant: null, rank: 0, totalParticipants: ranking.length };
        }
        const rankIndex = ranking.findIndex((item) => item.wwid === participant.wwid);
        const achievements = await db.getParticipantAchievements(participant.id);
        const safeParticipant = { ...participant, chapa: maskIdentifier(participant.chapa), wwid: maskIdentifier(participant.wwid) };
        return {
          participant: safeParticipant,
          rank: rankIndex >= 0 ? rankIndex + 1 : 1,
          totalParticipants: ranking.length,
          achievements,
        };
      }),
  }),

  ranking: router({
    list: publicProcedure
      .input(
        z.object({
          gameFilter: z.enum(["geral", "quiz_seguranca", "quiz_ergonomia", "ache_o_erro", "organize_a_fabrica"]).default("geral"),
          sortBy: z.enum(["highest", "lowest", "recent"]).default("highest"),
          participantType: z.enum(["todos", "cummins", "terceiro", "visitante"]).default("todos"),
        })
      )
      .query(async ({ input }) => {
        const rows = await db.getRankingList(input.gameFilter, input.sortBy, input.participantType);
        return rows.map(({ chapa, wwid, ...participant }) => ({
          ...participant,
          identifier: maskIdentifier(wwid || chapa),
        }));
      }),

    search: publicProcedure
      .input(
        z.object({
          term: z.string().min(1),
        })
      )
      .query(async ({ input, ctx }) => {
        enforceRateLimit("ranking-search", clientAddress(ctx.req), 30, 60_000);
        const result = await db.searchRankingUser(input.term);
        if (!result) return undefined;
        const { chapa, wwid, ...participant } = result;
        return { ...participant, identifier: maskIdentifier(wwid || chapa) };
      }),
  }),

  games: router({
    getSettings: publicProcedure.query(async () => {
      const now = Date.now();
      return (await db.getGameSettings()).map((setting) => ({
        ...setting,
        isOpen: setting.active && (!setting.accessStartAt || now >= setting.accessStartAt.getTime()) && (!setting.accessEndAt || now <= setting.accessEndAt.getTime()),
      }));
    }),

    getScenarioCatalog: publicProcedure.query(async () => {
      const stored = await db.listScenarioImages(true);
      const phaseNumber = (label: string) => Number(label.match(/Fase\s+(\d+)/i)?.[1] ?? 999);
      const ordered = [...stored].sort((a, b) => phaseNumber(a.label) - phaseNumber(b.label) || a.label.localeCompare(b.label, "pt-BR"));
      return ordered.length ? ordered.map((scenario) => ({ key: scenario.scenarioKey, label: scenario.label, image: scenario.imageUrl, safeImage: scenario.safeImageUrl || scenario.imageUrl, difficulty: scenario.difficulty, timeSeconds: scenario.timeSeconds, hintCount: scenario.hintCount, hintCost: scenario.hintCost, wrongClickPenalty: scenario.wrongClickPenalty, phaseMode: scenario.phaseMode })) : CDBS_SPOT_ERROR_SCENARIOS.map((scenario) => ({ ...scenario, safeImage: scenario.image, difficulty: "facil" as const, timeSeconds: 180, hintCount: 2, hintCost: 5, wrongClickPenalty: 0, phaseMode: "livres" as const }));
    }),

      getSpotErrorHotspots: publicProcedure
      .input(z.object({ scenarioKey: z.string().optional(), adminKey: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input?.adminKey, ctx.req)) await assertGameOpen("ache_o_erro");
        return db.listSpotErrorHotspots(true, input?.scenarioKey);
    }),

    getQuestions: publicProcedure
      .input(
        z.object({
          gameType: z.enum(["quiz_seguranca", "quiz_ergonomia"]),
          difficulty: z.enum(["facil", "medio", "dificil"]).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        await assertGameOpen(input.gameType);
        const questions = await db.getQuizQuestions(input.gameType);
        // Se uma dificuldade específica for solicitada, prioriza ou filtra as perguntas daquele nível
        let filtered = questions;
        if (input.difficulty) {
          const exact = questions.filter((q) => q.difficulty === input.difficulty);
          if (exact.length >= 6) {
            filtered = exact;
          }
        }
        // Embaralha e seleciona até 12 perguntas estruturadas para a partida
        const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 12);
        const sessionId = participantSessionId(ctx.req);
        if (sessionId) {
          quizAttempts.set(sessionId, { gameType: input.gameType, questionIds: new Set(shuffled.map((q) => q.id)), answered: new Set(), score: 0, correctCount: 0, wrongCount: 0 });
        }
        return shuffled.map((q) => ({
          id: q.id,
          gameType: q.gameType,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          theme: q.theme,
          difficulty: q.difficulty,
        }));
      }),

    getDailyAttempts: publicProcedure
      .input(
        z.object({
          participantWwid: z.string().trim().min(1).optional(),
          gameType: z.enum(["quiz_seguranca", "quiz_ergonomia", "ache_o_erro", "organize_a_fabrica"]),
        })
      )
      .query(async ({ input, ctx }) => {
        const sessionId = participantSessionId(ctx.req);
        const participant = sessionId ? await db.getParticipantById(sessionId) : undefined;
        if (!participant) return { attemptsToday: 0, maxDailyAttempts: 5, remainingToday: 5 };
        const count = await db.getDailyAttemptsCount(participant.id, input.gameType);
        const maxDaily = 5;
        return {
          attemptsToday: count,
          maxDailyAttempts: maxDaily,
          remainingToday: Math.max(0, maxDaily - count),
        };
      }),

    verifyAnswer: publicProcedure
      .input(
        z.object({
          questionId: z.number(),
          selectedOption: z.enum(["A", "B", "C", "D"]),
          remainingSeconds: z.number().min(0).max(60),
          difficulty: z.enum(["facil", "medio", "dificil"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        enforceRateLimit("quiz-answer", clientAddress(ctx.req), 120, 60_000);
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database offline" });

        const [question] = await dbConn
          .select()
          .from(quizQuestions)
          .where(eq(quizQuestions.id, input.questionId))
          .limit(1);

        if (!question) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pergunta não encontrada" });
        }

        const sessionId = participantSessionId(ctx.req);
        const attempt = sessionId ? quizAttempts.get(sessionId) : undefined;
        if (attempt) {
          if (attempt.gameType !== question.gameType || !attempt.questionIds.has(question.id) || attempt.answered.has(question.id)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Resposta fora da tentativa ativa." });
          }
          attempt.answered.add(question.id);
        }
        const isCorrect = question.correctOption === input.selectedOption;

        let basePoints = 100;
        if (input.difficulty === "medio") basePoints = 200;
        if (input.difficulty === "dificil") basePoints = 300;

        let earnedPoints = 0;
        if (isCorrect && input.remainingSeconds > 0) {
          earnedPoints = Math.round(basePoints * (input.remainingSeconds / 60));
        }
        const acceptedCorrect = isCorrect && input.remainingSeconds > 0;
        if (attempt) {
          if (acceptedCorrect) { attempt.correctCount += 1; attempt.score += earnedPoints; }
          else attempt.wrongCount += 1;
        }

        return {
          isCorrect: acceptedCorrect,
          earnedPoints,
          explanation: question.explanation,
        };
      }),

  submitResult: publicProcedure
      .input(
        z.object({
          participantChapa: z.string().min(1).max(128).optional(),
          participantName: z.string().min(1).max(120).optional(),
          participantWwid: z.string().min(1).max(128).optional(),
          scenarioKey: z.string().max(64).optional(),
          gameType: z.enum(["quiz_seguranca", "quiz_ergonomia", "ache_o_erro", "organize_a_fabrica"]),
          difficulty: z.enum(["facil", "medio", "dificil", "muito_dificil"]),
          score: z.number().int().min(0).max(10000),
          correctCount: z.number().int().min(0).max(50),
          wrongCount: z.number().int().min(0).max(100),
          hintsUsed: z.number().int().min(0).max(20).optional(),
          timeSpentSeconds: z.number().int().min(0).max(7200),
        })
      )
      .mutation(async ({ input, ctx }) => {
        enforceRateLimit("game-submit", clientAddress(ctx.req), 20, 60_000);
        const settings = await db.getGameSettings();
        const thisGameSetting = settings.find((s) => s.gameKey === input.gameType);
        const now = Date.now();
        const isOpen = thisGameSetting && thisGameSetting.active && (!thisGameSetting.accessStartAt || now >= thisGameSetting.accessStartAt.getTime()) && (!thisGameSetting.accessEndAt || now <= thisGameSetting.accessEndAt.getTime());
        if (thisGameSetting && !isOpen) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Este desafio está fora da janela de acesso configurada para o evento.",
          });
        }

        const sessionId = participantSessionId(ctx.req);
        const sessionParticipant = sessionId ? await db.getParticipantById(sessionId) : undefined;
        const participant = sessionParticipant || await db.findOrCreateParticipant(input.participantName || "Colaborador", input.participantChapa || "SEM-CHAPA", input.participantWwid || "SEM-WWID");
        const authoritativeAttempt = sessionParticipant && (input.gameType === "quiz_seguranca" || input.gameType === "quiz_ergonomia") ? quizAttempts.get(sessionParticipant.id) : undefined;
        const resultInput = authoritativeAttempt ? { ...input, participantName: participant.name, participantChapa: participant.chapa, participantWwid: participant.wwid, score: authoritativeAttempt.score, correctCount: authoritativeAttempt.correctCount, wrongCount: authoritativeAttempt.wrongCount } : { ...input, participantName: participant.name, participantChapa: participant.chapa, participantWwid: participant.wwid };
        if (authoritativeAttempt && sessionParticipant) quizAttempts.delete(sessionParticipant.id);
        const attemptsToday = await db.getDailyAttemptsCount(participant.id, input.gameType);
        const maxAttempts = 5;
        if (attemptsToday >= maxAttempts) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Você atingiu o limite de ${maxAttempts} tentativas diárias para este desafio. Volte amanhã para pontuar novamente!`,
          });
        }

        const recorded = await db.recordGameResult(resultInput);
        const unlockedAchievements = await db.evaluateAndUnlockAchievements(recorded.participant.id);
        return {
          ...recorded,
          unlockedAchievements,
        };
      }),
  }),

  admin: router({
    verifyKey: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        enforceRateLimit("admin-login", clientAddress(ctx.req), 8, 5 * 60_000);
        const isValid = isValidAdminRequest(input.adminKey, ctx.req);
        if (isValid) setSessionCookie(ctx, ADMIN_SESSION_COOKIE, "admin", "authorized");
        return { isValid };
      }),

    dashboardStats: publicProcedure
      .input(z.object({ adminKey: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.getDashboardStats();
      }),

    listParticipants: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          search: z.string().optional(),
          participantType: z.enum(["terceiro", "cummins", "visitante"]).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.listAllParticipants(input.search, input.participantType);
      }),

    updateParticipant: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          id: z.number(),
          name: z.string().optional(),
          chapa: z.string().optional(),
          wwid: z.string().optional(),
          totalScore: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.updateParticipantData(input.id, {
          name: input.name,
          chapa: input.chapa,
          wwid: input.wwid,
          totalScore: input.totalScore,
        });
        return { success: true };
      }),

    deleteParticipant: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          id: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.deleteParticipant(input.id);
        return { success: true };
      }),

    listQuestions: publicProcedure
      .input(z.object({ adminKey: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.listAllQuestions();
      }),

    createQuestion: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          gameType: z.enum(["quiz_seguranca", "quiz_ergonomia"]),
          question: z.string().min(5),
          optionA: z.string().min(1),
          optionB: z.string().min(1),
          optionC: z.string().min(1),
          optionD: z.string().min(1),
          correctOption: z.enum(["A", "B", "C", "D"]),
          explanation: z.string().optional(),
          theme: z.string().min(2),
          difficulty: z.enum(["facil", "medio", "dificil"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        const { adminKey, ...data } = input;
        await db.createQuizQuestion(data);
        return { success: true };
      }),

    updateQuestion: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          id: z.number(),
          question: z.string().optional(),
          optionA: z.string().optional(),
          optionB: z.string().optional(),
          optionC: z.string().optional(),
          optionD: z.string().optional(),
          correctOption: z.enum(["A", "B", "C", "D"]).optional(),
          explanation: z.string().optional(),
          theme: z.string().optional(),
          difficulty: z.enum(["facil", "medio", "dificil"]).optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        const { adminKey, id, ...data } = input;
        await db.updateQuizQuestion(id, data);
        return { success: true };
      }),

    deleteQuestion: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          id: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.deleteQuizQuestion(input.id);
        return { success: true };
      }),

    listSpotErrorHotspots: publicProcedure
      .input(z.object({ adminKey: z.string().optional(), scenarioKey: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        return db.listSpotErrorHotspots(false, input.scenarioKey);
      }),

    createSpotErrorHotspot: publicProcedure
      .input(z.object({ adminKey: z.string().optional(), scenarioKey: z.string().min(2), title: z.string().min(3), description: z.string().min(3), hint: z.string().optional(), category: z.string().min(2), x: z.number().min(0).max(100), y: z.number().min(0).max(100), width: z.number().min(0.1).max(100).optional(), height: z.number().min(0.1).max(100).optional(), tolerance: z.number().min(0).max(2).optional(), shape: z.enum(["retangulo", "circulo", "poligono"]).optional(), points: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const { adminKey, ...data } = input;
        await db.createSpotErrorHotspot(data);
        return { success: true };
      }),

    updateSpotErrorHotspot: publicProcedure
      .input(z.object({ adminKey: z.string().optional(), id: z.number(), scenarioKey: z.string().min(2).optional(), title: z.string().min(3).optional(), description: z.string().min(3).optional(), hint: z.string().optional(), category: z.string().min(2).optional(), x: z.number().min(0).max(100).optional(), y: z.number().min(0).max(100).optional(), width: z.number().min(0.1).max(100).optional(), height: z.number().min(0.1).max(100).optional(), tolerance: z.number().min(0).max(2).optional(), shape: z.enum(["retangulo", "circulo", "poligono"]).optional(), points: z.string().optional(), active: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const { adminKey, id, ...data } = input;
        await db.updateSpotErrorHotspot(id, data);
        return { success: true };
      }),

    deleteSpotErrorHotspot: publicProcedure
      .input(z.object({ adminKey: z.string().optional(), id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        await db.deleteSpotErrorHotspot(input.id);
        return { success: true };
      }),

    listScenarioImages: publicProcedure
      .input(z.object({ adminKey: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        return db.listScenarioImages(false);
      }),

    createScenarioImage: publicProcedure
      .input(z.object({
        adminKey: z.string().optional(),
        scenarioKey: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/, "Use apenas letras minúsculas, números e hífens na chave."),
        label: z.string().trim().min(3).max(128),
        imageUrl: scenarioImageUrlSchema,
        safeImageUrl: scenarioImageUrlSchema,
        sourceUrl: z.string().url().optional(),
        description: z.string().max(2000).optional(),
        difficulty: z.enum(["facil", "medio", "dificil", "muito_dificil"]).optional(),
        timeSeconds: z.number().int().min(30).max(900).optional(),
        hintCount: z.number().int().min(0).max(10).optional(),
        hintCost: z.number().int().min(0).max(100).optional(),
        wrongClickPenalty: z.number().int().min(0).max(30).optional(),
        phaseMode: z.enum(["livres", "sequenciais"]).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const { adminKey, ...data } = input;
        await db.createScenarioImage(data);
        return { success: true };
      }),

    updateScenarioImage: publicProcedure
      .input(z.object({
        adminKey: z.string().optional(),
        scenarioKey: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/, "Use apenas letras minúsculas, números e hífens na chave."),
        label: z.string().trim().min(3).max(128),
        imageUrl: scenarioImageUrlSchema,
        safeImageUrl: scenarioImageUrlSchema,
        sourceUrl: z.string().url().optional(),
        description: z.string().max(2000).optional(),
        difficulty: z.enum(["facil", "medio", "dificil", "muito_dificil"]).optional(),
        timeSeconds: z.number().int().min(30).max(900).optional(),
        hintCount: z.number().int().min(0).max(10).optional(),
        hintCost: z.number().int().min(0).max(100).optional(),
        wrongClickPenalty: z.number().int().min(0).max(30).optional(),
        phaseMode: z.enum(["livres", "sequenciais"]).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const { adminKey, scenarioKey, ...data } = input;
        await db.updateScenarioImage(scenarioKey, data);
        return { success: true };
      }),

    uploadScenarioAsset: publicProcedure
      .input(z.object({ adminKey: z.string().optional(), scenarioKey: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/, "Use apenas letras minúsculas, números e hífens na chave."), kind: z.enum(["safe", "errors"]), dataUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/).max(16_000_000) }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const match = input.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
        if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Envie uma imagem PNG, JPG ou WebP válida." });
        const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
        const uploaded = await storagePut(`sipat-scenarios/${input.scenarioKey}-${input.kind}.${extension}`, Buffer.from(match[2], "base64"), match[1]);
        return { url: uploaded.url };
      }),

    deleteScenarioImage: publicProcedure
      .input(z.object({ adminKey: z.string().optional(), id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        await db.deleteScenarioImage(input.id);
        return { success: true };
      }),

    deleteScenario: publicProcedure
      .input(z.object({ adminKey: z.string().optional(), scenarioKey: z.string().min(3).max(64) }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        await db.deleteScenario(input.scenarioKey);
        return { success: true };
      }),

    listResults: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.listAllGameResults(input.search);
      }),

    deleteResult: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          id: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.deleteGameResult(input.id);
        return { success: true };
      }),

    toggleGameStatus: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          gameKey: z.string(),
          active: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.updateGameStatus(input.gameKey, input.active);
        return { success: true };
      }),

    updateGameAccess: publicProcedure
      .input(z.object({ adminKey: z.string().optional(), gameKey: z.string(), active: z.boolean(), accessStartAt: z.string().nullable(), accessEndAt: z.string().nullable() }))
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const start = input.accessStartAt ? new Date(input.accessStartAt) : null;
        const end = input.accessEndAt ? new Date(input.accessEndAt) : null;
        if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime())) || (start && end && start >= end)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A janela de acesso precisa ter datas válidas e o início deve ser anterior ao fim." });
        }
        await db.updateGameAccess(input.gameKey, { active: input.active, accessStartAt: start, accessEndAt: end });
        return { success: true };
      }),

    listMuralMessages: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          status: z.enum(["todos", "pendente", "aprovada", "rejeitada", "arquivada"]).optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.listAllMuralMessagesAdmin(input.status, input.search);
      }),

    moderateMuralMessage: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          id: z.number(),
          action: z.enum(["aprovar", "rejeitar", "arquivar", "destacar", "remover_destaque"]),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.moderateMuralMessage(input.id, input.action, "Gestor EHS", input.note);
        return { success: true };
      }),

    editMuralMessageText: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          id: z.number(),
          message: z.string().min(5).max(280),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.updateMuralMessageText(input.id, input.message, "Gestor EHS");
        return { success: true };
      }),

    deleteMuralMessage: publicProcedure
      .input(
        z.object({
          adminKey: z.string().optional(),
          id: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isValidAdminRequest(input.adminKey, ctx.req)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.deleteMuralMessage(input.id);
        return { success: true };
      }),
  }),

  mural: router({
    listApproved: publicProcedure
      .input(
        z.object({
          promptKey: z.string().optional(),
          limit: z.number().int().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.listApprovedMuralMessages(input?.promptKey, input?.limit ?? 60);
      }),

    getFeatured: publicProcedure.query(async () => {
      return db.getFeaturedMuralMessage();
    }),

    getPrompts: publicProcedure.query(async () => {
      return MURAL_PROMPTS;
    }),

    submitMessage: publicProcedure
      .input(
        z.object({
          promptKey: z.string().min(1, "Selecione uma pergunta orientadora."),
          message: z.string().trim().min(5, "A frase deve ter no mínimo 5 caracteres.").max(280, "A frase deve ter no máximo 280 caracteres."),
          publicName: z.string().trim().max(80, "O nome pode ter no máximo 80 caracteres.").optional(),
          isAnonymous: z.boolean().default(true),
          consent: z.literal(true),
          participantId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        enforceRateLimit("mural-submit", clientAddress(ctx.req), 5, 60_000);

        // Sanitização básica contra HTML / scripts
        const sanitizedMessage = input.message.replace(/<[^>]*>?/gm, "").trim();
        const sanitizedName = (input.publicName || "").replace(/<[^>]*>?/gm, "").trim();

        if (sanitizedMessage.length < 5) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A frase não pode ser vazia ou conter apenas caracteres inválidos." });
        }

        const promptMeta = MURAL_PROMPTS.find((p) => p.key === input.promptKey) || {
          key: input.promptKey,
          question: "Meu motivo para voltar seguro",
        };

        const safety = analyzeMuralSafety(sanitizedMessage, sanitizedName);

        await db.createMuralSubmission({
          promptKey: promptMeta.key,
          promptText: promptMeta.question,
          message: sanitizedMessage,
          publicName: input.isAnonymous ? null : (sanitizedName || "Colaborador Cummins"),
          isAnonymous: input.isAnonymous,
          consent: true,
          participantId: input.participantId ?? null,
          flagged: safety.flagged,
          flagReasons: safety.reasons.length ? safety.reasons.join("; ") : null,
        });

        return {
          success: true,
          status: "pendente" as const,
          message: "Obrigado por compartilhar seu motivo. Sua mensagem será revisada pela moderação antes de aparecer no mural.",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
