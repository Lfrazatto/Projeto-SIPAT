import { boolean, double, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const participants = mysqlTable("participants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  participantType: mysqlEnum("participantType", ["terceiro", "cummins", "visitante"]).default("terceiro").notNull(),
  chapa: varchar("chapa", { length: 64 }).notNull().unique(),
  wwid: varchar("wwid", { length: 64 }).notNull().unique(),
  totalScore: int("totalScore").default(0).notNull(),
  completedGamesCount: int("completedGamesCount").default(0).notNull(),
  bestSecurityScore: int("bestSecurityScore").default(0).notNull(),
  bestEnvironmentScore: int("bestEnvironmentScore").default(0).notNull(),
  bestSpotErrorScore: int("bestSpotErrorScore").default(0).notNull(),
  bestOrganizeScore: int("bestOrganizeScore").default(0).notNull(),
  totalCorrectAnswers: int("totalCorrectAnswers").default(0).notNull(),
  totalWrongAnswers: int("totalWrongAnswers").default(0).notNull(),
  highestDifficulty: varchar("highestDifficulty", { length: 32 }).default("Fácil").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const gameResults = mysqlTable("game_results", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  scenarioKey: varchar("scenarioKey", { length: 64 }).default("unknown").notNull(),
  participantChapa: varchar("participantChapa", { length: 64 }).notNull(),
  participantWwid: varchar("participantWwid", { length: 64 }).notNull(),
  participantName: varchar("participantName", { length: 255 }).notNull(),
  gameType: mysqlEnum("gameType", ["quiz_seguranca", "quiz_ergonomia", "ache_o_erro", "organize_a_fabrica"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["facil", "medio", "dificil", "muito_dificil"]).notNull(),
  score: int("score").notNull(),
  correctCount: int("correctCount").notNull(),
  wrongCount: int("wrongCount").notNull(),
  hintsUsed: int("hintsUsed").default(0).notNull(),
  timeSpentSeconds: int("timeSpentSeconds").notNull(),
  isBestScore: boolean("isBestScore").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  gameType: mysqlEnum("gameType", ["quiz_seguranca", "quiz_ergonomia"]).notNull(),
  question: text("question").notNull(),
  optionA: text("optionA").notNull(),
  optionB: text("optionB").notNull(),
  optionC: text("optionC").notNull(),
  optionD: text("optionD").notNull(),
  correctOption: mysqlEnum("correctOption", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation"),
  theme: varchar("theme", { length: 128 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["facil", "medio", "dificil"]).default("facil").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const gameSettings = mysqlTable("game_settings", {
  id: int("id").autoincrement().primaryKey(),
  gameKey: varchar("gameKey", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description").notNull(),
  active: boolean("active").default(true).notNull(),
  accessStartAt: timestamp("accessStartAt"),
  accessEndAt: timestamp("accessEndAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const spotErrorHotspots = mysqlTable("spot_error_hotspots", {
  id: int("id").autoincrement().primaryKey(),
  scenarioKey: varchar("scenarioKey", { length: 64 }).default("cdbs-oficina").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description").notNull(),
  hint: text("hint"),
  category: varchar("category", { length: 64 }).notNull(),
  x: double("x").notNull(),
  y: double("y").notNull(),
  width: double("width").default(14).notNull(),
  height: double("height").default(13).notNull(),
  tolerance: double("tolerance").default(1).notNull(),
  shape: mysqlEnum("shape", ["retangulo", "circulo", "poligono"]).default("retangulo").notNull(),
  points: text("points"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const scenarioImages = mysqlTable("scenario_images", {
  id: int("id").autoincrement().primaryKey(),
  scenarioKey: varchar("scenarioKey", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  safeImageUrl: text("safeImageUrl"),
  sourceUrl: text("sourceUrl"),
  description: text("description"),
  difficulty: mysqlEnum("difficulty", ["facil", "medio", "dificil", "muito_dificil"]).default("facil").notNull(),
  timeSeconds: int("timeSeconds").default(180).notNull(),
  hintCount: int("hintCount").default(2).notNull(),
  hintCost: int("hintCost").default(5).notNull(),
  wrongClickPenalty: int("wrongClickPenalty").default(0).notNull(),
  phaseMode: mysqlEnum("phaseMode", ["livres", "sequenciais"]).default("livres").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const muralMessages = mysqlTable("mural_messages", {
  id: int("id").autoincrement().primaryKey(),
  promptKey: varchar("promptKey", { length: 64 }).notNull(),
  promptText: varchar("promptText", { length: 255 }).notNull(),
  message: text("message").notNull(),
  publicName: varchar("publicName", { length: 80 }),
  isAnonymous: boolean("isAnonymous").default(true).notNull(),
  consent: boolean("consent").default(false).notNull(),
  participantId: int("participantId"),
  status: mysqlEnum("status", ["pendente", "aprovada", "rejeitada", "arquivada"]).default("pendente").notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  flagged: boolean("flagged").default(false).notNull(),
  flagReasons: text("flagReasons"),
  moderationNote: text("moderationNote"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  moderatedAt: timestamp("moderatedAt"),
  moderatedBy: varchar("moderatedBy", { length: 120 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const participantAchievements = mysqlTable("participant_achievements", {
  id: int("id").autoincrement().primaryKey(),
  participantId: int("participantId").notNull(),
  achievementKey: varchar("achievementKey", { length: 64 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
}, (table) => ({
  participantAchievementUnique: uniqueIndex("participant_achievement_unique").on(table.participantId, table.achievementKey),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;
export type GameResult = typeof gameResults.$inferSelect;
export type InsertGameResult = typeof gameResults.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;
export type GameSetting = typeof gameSettings.$inferSelect;
export type InsertGameSetting = typeof gameSettings.$inferInsert;
export type SpotErrorHotspot = typeof spotErrorHotspots.$inferSelect;
export type InsertSpotErrorHotspot = typeof spotErrorHotspots.$inferInsert;
export type MuralMessage = typeof muralMessages.$inferSelect;
export type InsertMuralMessage = typeof muralMessages.$inferInsert;
export type ParticipantAchievement = typeof participantAchievements.$inferSelect;
export type InsertParticipantAchievement = typeof participantAchievements.$inferInsert;
