import fs from "node:fs";

const file = "drizzle/schema.ts";
let source = fs.readFileSync(file, "utf8");
source = source.replace(
  'import { boolean, double, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";',
  'import { boolean, double, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";'
);
const replacements = [
  [
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n});\n\nexport const gameResults',
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n}, (table) => ({\n  participantTypeIdx: index("participants_participant_type_idx").on(table.participantType),\n  totalScoreIdx: index("participants_total_score_idx").on(table.totalScore),\n  updatedAtIdx: index("participants_updated_at_idx").on(table.updatedAt),\n}));\n\nexport const gameResults',
  ],
  [
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n});\n\nexport const quizQuestions',
    '  createdAt: timestamp("createdAt").defaultNow().notNull(),\n}, (table) => ({\n  participantGameDateIdx: index("game_results_participant_game_date_idx").on(table.participantId, table.gameType, table.createdAt),\n  gameScoreIdx: index("game_results_game_score_idx").on(table.gameType, table.score),\n}));\n\nexport const quizQuestions',
  ],
  [
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n});\n\nexport const gameSettings',
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n}, (table) => ({\n  activeDifficultyIdx: index("quiz_questions_active_difficulty_idx").on(table.gameType, table.active, table.difficulty),\n}));\n\nexport const gameSettings',
  ],
  [
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n});\n\nexport const scenarioImages',
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n}, (table) => ({\n  scenarioActiveIdx: index("spot_hotspots_scenario_active_idx").on(table.scenarioKey, table.active),\n}));\n\nexport const scenarioImages',
  ],
  [
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n});\n\nexport const muralMessages',
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n}, (table) => ({\n  activeIdx: index("scenario_images_active_idx").on(table.active),\n}));\n\nexport const muralMessages',
  ],
  [
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n});\n\nexport const participantAchievements',
    '  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),\n}, (table) => ({\n  publicFeedIdx: index("mural_public_feed_idx").on(table.status, table.isFeatured, table.submittedAt),\n  promptFeedIdx: index("mural_prompt_feed_idx").on(table.status, table.promptKey, table.submittedAt),\n}));\n\nexport const participantAchievements',
  ],
];
for (const [from, to] of replacements) {
  if (!source.includes(from)) throw new Error(`Pattern not found: ${from.slice(0, 80)}`);
  source = source.replace(from, to);
}
fs.writeFileSync(file, source);
console.log("capacity indexes applied");
