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
import { timingSafeEqual } from "node:crypto";


function isValidAdminKey(value: string) {
  const configuredKey = ENV.adminAccessKey.trim();
  if (!configuredKey) return !ENV.isProduction && value.trim().toUpperCase() === "SIPATMA";
  const candidate = Buffer.from(value.trim());
  const expected = Buffer.from(configuredKey);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

const scenarioImageUrlSchema = z.string().refine(
  (value) => value.startsWith("/manus-storage/") || /^https?:\/\//i.test(value),
  "Informe uma URL HTTPS ou uma imagem enviada ao armazenamento seguro."
);

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
    throw new TRPCError({ code: "FORBIDDEN", message: "A SIPATMA está fora da janela de acesso configurada para o evento." });
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
      .mutation(async ({ input }) => {
        const cleanName = input.name.trim();
        const identifier = input.identifier?.trim().toUpperCase() || "";
        if (input.participantType !== "visitante" && !identifier) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Informe ${input.participantType === "terceiro" ? "a chapa" : "o WWID"}.` });
        }
        const visitorKey = `VISITANTE-${cleanName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`;
        const chapa = input.participantType === "visitante" ? visitorKey : identifier;
        const wwid = input.participantType === "visitante" ? visitorKey : identifier;
        const participant = await db.findOrCreateParticipant(cleanName, chapa, wwid, input.participantType);
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
          wwid: z.string().trim().min(1, "Chapa ou WWID é obrigatório").max(64),
        })
      )
      .query(async ({ input }) => {
        const cleanWwid = input.wwid.trim().toUpperCase();
        const participant = (await db.getParticipantByWwid(cleanWwid)) || (await db.getParticipantByChapa(cleanWwid));
        const ranking = await db.getRankingList();
        if (!participant) {
          return {
            participant: null,
            rank: 0,
            totalParticipants: ranking.length,
          };
        }

        const rankIndex = ranking.findIndex((item) => item.wwid === participant.wwid);

        return {
          participant,
          rank: rankIndex >= 0 ? rankIndex + 1 : 1,
          totalParticipants: ranking.length,
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
      .query(async ({ input }) => {
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
      return stored.length ? stored.map((scenario) => ({ key: scenario.scenarioKey, label: scenario.label, image: scenario.imageUrl, safeImage: scenario.safeImageUrl || scenario.imageUrl, difficulty: scenario.difficulty, timeSeconds: scenario.timeSeconds, hintCount: scenario.hintCount, hintCost: scenario.hintCost, wrongClickPenalty: scenario.wrongClickPenalty, phaseMode: scenario.phaseMode })) : CDBS_SPOT_ERROR_SCENARIOS.map((scenario) => ({ ...scenario, safeImage: scenario.image, difficulty: "facil" as const, timeSeconds: 180, hintCount: 2, hintCost: 5, wrongClickPenalty: 0, phaseMode: "livres" as const }));
    }),

      getSpotErrorHotspots: publicProcedure
      .input(z.object({ scenarioKey: z.string().optional(), adminKey: z.string().optional() }).optional())
      .query(async ({ input }) => {
        if (!isValidAdminKey(input?.adminKey ?? "")) await assertGameOpen("ache_o_erro");
        return db.listSpotErrorHotspots(true, input?.scenarioKey);
    }),

    getQuestions: publicProcedure
      .input(
        z.object({
          gameType: z.enum(["quiz_seguranca", "quiz_ergonomia"]),
        })
      )
      .query(async ({ input }) => {
        await assertGameOpen(input.gameType);
        const questions = await db.getQuizQuestions(input.gameType);
        return questions.map((q) => ({
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

    verifyAnswer: publicProcedure
      .input(
        z.object({
          questionId: z.number(),
          selectedOption: z.enum(["A", "B", "C", "D"]),
          remainingSeconds: z.number().min(0).max(60),
          difficulty: z.enum(["facil", "medio", "dificil"]),
        })
      )
      .mutation(async ({ input }) => {
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

        const isCorrect = question.correctOption === input.selectedOption;

        let basePoints = 100;
        if (input.difficulty === "medio") basePoints = 200;
        if (input.difficulty === "dificil") basePoints = 300;

        let earnedPoints = 0;
        if (isCorrect && input.remainingSeconds > 0) {
          earnedPoints = Math.round(basePoints * (input.remainingSeconds / 60));
        }

        return {
          isCorrect: isCorrect && input.remainingSeconds > 0,
          earnedPoints,
          correctOption: question.correctOption,
          explanation: question.explanation,
        };
      }),

  submitResult: publicProcedure
      .input(
        z.object({
          participantChapa: z.string().min(1),
          participantName: z.string().min(1),
          participantWwid: z.string().min(1),
          scenarioKey: z.string().max(64).optional(),
          gameType: z.enum(["quiz_seguranca", "quiz_ergonomia", "ache_o_erro", "organize_a_fabrica"]),
          difficulty: z.enum(["facil", "medio", "dificil", "muito_dificil"]),
          score: z.number().min(0),
          correctCount: z.number().min(0),
          wrongCount: z.number().min(0),
          hintsUsed: z.number().int().min(0).max(20).optional(),
          timeSpentSeconds: z.number().min(0),
        })
      )
      .mutation(async ({ input }) => {
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

        return db.recordGameResult(input);
      }),
  }),

  admin: router({
    verifyKey: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const isValid = isValidAdminKey(input.adminKey);
        return { isValid };
      }),

    dashboardStats: publicProcedure
      .input(z.object({ adminKey: z.string() }))
      .query(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.getDashboardStats();
      }),

    listParticipants: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
          search: z.string().optional(),
          participantType: z.enum(["terceiro", "cummins", "visitante"]).optional(),
        })
      )
      .query(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.listAllParticipants(input.search, input.participantType);
      }),

    updateParticipant: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
          id: z.number(),
          name: z.string().optional(),
          chapa: z.string().optional(),
          wwid: z.string().optional(),
          totalScore: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
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
          adminKey: z.string(),
          id: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.deleteParticipant(input.id);
        return { success: true };
      }),

    listQuestions: publicProcedure
      .input(z.object({ adminKey: z.string() }))
      .query(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.listAllQuestions();
      }),

    createQuestion: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
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
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        const { adminKey, ...data } = input;
        await db.createQuizQuestion(data);
        return { success: true };
      }),

    updateQuestion: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
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
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        const { adminKey, id, ...data } = input;
        await db.updateQuizQuestion(id, data);
        return { success: true };
      }),

    deleteQuestion: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
          id: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.deleteQuizQuestion(input.id);
        return { success: true };
      }),

    listSpotErrorHotspots: publicProcedure
      .input(z.object({ adminKey: z.string(), scenarioKey: z.string().optional() }))
      .query(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        return db.listSpotErrorHotspots(false, input.scenarioKey);
      }),

    createSpotErrorHotspot: publicProcedure
      .input(z.object({ adminKey: z.string(), scenarioKey: z.string().min(2), title: z.string().min(3), description: z.string().min(3), hint: z.string().optional(), category: z.string().min(2), x: z.number().min(0).max(100), y: z.number().min(0).max(100), width: z.number().min(0.1).max(100).optional(), height: z.number().min(0.1).max(100).optional(), tolerance: z.number().min(0).max(2).optional(), shape: z.enum(["retangulo", "circulo", "poligono"]).optional(), points: z.string().optional() }))
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const { adminKey, ...data } = input;
        await db.createSpotErrorHotspot(data);
        return { success: true };
      }),

    updateSpotErrorHotspot: publicProcedure
      .input(z.object({ adminKey: z.string(), id: z.number(), scenarioKey: z.string().min(2).optional(), title: z.string().min(3).optional(), description: z.string().min(3).optional(), hint: z.string().optional(), category: z.string().min(2).optional(), x: z.number().min(0).max(100).optional(), y: z.number().min(0).max(100).optional(), width: z.number().min(0.1).max(100).optional(), height: z.number().min(0.1).max(100).optional(), tolerance: z.number().min(0).max(2).optional(), shape: z.enum(["retangulo", "circulo", "poligono"]).optional(), points: z.string().optional(), active: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const { adminKey, id, ...data } = input;
        await db.updateSpotErrorHotspot(id, data);
        return { success: true };
      }),

    deleteSpotErrorHotspot: publicProcedure
      .input(z.object({ adminKey: z.string(), id: z.number() }))
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        await db.deleteSpotErrorHotspot(input.id);
        return { success: true };
      }),

    listScenarioImages: publicProcedure
      .input(z.object({ adminKey: z.string() }))
      .query(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        return db.listScenarioImages(false);
      }),

    createScenarioImage: publicProcedure
      .input(z.object({
        adminKey: z.string(),
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
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const { adminKey, ...data } = input;
        await db.createScenarioImage(data);
        return { success: true };
      }),

    updateScenarioImage: publicProcedure
      .input(z.object({
        adminKey: z.string(),
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
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const { adminKey, scenarioKey, ...data } = input;
        await db.updateScenarioImage(scenarioKey, data);
        return { success: true };
      }),

    uploadScenarioAsset: publicProcedure
      .input(z.object({ adminKey: z.string(), scenarioKey: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/, "Use apenas letras minúsculas, números e hífens na chave."), kind: z.enum(["safe", "errors"]), dataUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/).max(16_000_000) }))
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const match = input.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
        if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Envie uma imagem PNG, JPG ou WebP válida." });
        const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
        const uploaded = await storagePut(`sipat-scenarios/${input.scenarioKey}-${input.kind}.${extension}`, Buffer.from(match[2], "base64"), match[1]);
        return { url: uploaded.url };
      }),

    deleteScenarioImage: publicProcedure
      .input(z.object({ adminKey: z.string(), id: z.number() }))
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        await db.deleteScenarioImage(input.id);
        return { success: true };
      }),

    deleteScenario: publicProcedure
      .input(z.object({ adminKey: z.string(), scenarioKey: z.string().min(3).max(64) }))
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        await db.deleteScenario(input.scenarioKey);
        return { success: true };
      }),

    listResults: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        return db.listAllGameResults(input.search);
      }),

    deleteResult: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
          id: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.deleteGameResult(input.id);
        return { success: true };
      }),

    toggleGameStatus: publicProcedure
      .input(
        z.object({
          adminKey: z.string(),
          gameKey: z.string(),
          active: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        }
        await db.updateGameStatus(input.gameKey, input.active);
        return { success: true };
      }),

    updateGameAccess: publicProcedure
      .input(z.object({ adminKey: z.string(), gameKey: z.string(), active: z.boolean(), accessStartAt: z.string().nullable(), accessEndAt: z.string().nullable() }))
      .mutation(async ({ input }) => {
        if (!isValidAdminKey(input.adminKey)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso administrativo negado." });
        const start = input.accessStartAt ? new Date(input.accessStartAt) : null;
        const end = input.accessEndAt ? new Date(input.accessEndAt) : null;
        if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime())) || (start && end && start >= end)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A janela de acesso precisa ter datas válidas e o início deve ser anterior ao fim." });
        }
        await db.updateGameAccess(input.gameKey, { active: input.active, accessStartAt: start, accessEndAt: end });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
