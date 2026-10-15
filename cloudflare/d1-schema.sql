PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openId TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  loginMethod TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastSignedIn TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  participantType TEXT NOT NULL DEFAULT 'terceiro' CHECK (participantType IN ('terceiro','cummins','visitante')),
  chapa TEXT NOT NULL UNIQUE,
  wwid TEXT NOT NULL UNIQUE,
  totalScore INTEGER NOT NULL DEFAULT 0,
  completedGamesCount INTEGER NOT NULL DEFAULT 0,
  bestSecurityScore INTEGER NOT NULL DEFAULT 0,
  bestEnvironmentScore INTEGER NOT NULL DEFAULT 0,
  bestSpotErrorScore INTEGER NOT NULL DEFAULT 0,
  bestOrganizeScore INTEGER NOT NULL DEFAULT 0,
  totalCorrectAnswers INTEGER NOT NULL DEFAULT 0,
  totalWrongAnswers INTEGER NOT NULL DEFAULT 0,
  highestDifficulty TEXT NOT NULL DEFAULT 'Fácil',
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS game_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participantId INTEGER NOT NULL,
  scenarioKey TEXT NOT NULL DEFAULT 'unknown',
  participantChapa TEXT NOT NULL,
  participantWwid TEXT NOT NULL,
  participantName TEXT NOT NULL,
  gameType TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  correctCount INTEGER NOT NULL,
  wrongCount INTEGER NOT NULL,
  hintsUsed INTEGER NOT NULL DEFAULT 0,
  timeSpentSeconds INTEGER NOT NULL,
  isBestScore INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gameType TEXT NOT NULL,
  question TEXT NOT NULL,
  optionA TEXT NOT NULL,
  optionB TEXT NOT NULL,
  optionC TEXT NOT NULL,
  optionD TEXT NOT NULL,
  correctOption TEXT NOT NULL,
  explanation TEXT,
  theme TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'facil',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS game_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gameKey TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  accessStartAt TEXT,
  accessEndAt TEXT,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS spot_error_hotspots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenarioKey TEXT NOT NULL DEFAULT 'cdbs-oficina',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hint TEXT,
  category TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL DEFAULT 14,
  height REAL NOT NULL DEFAULT 13,
  tolerance REAL NOT NULL DEFAULT 1,
  shape TEXT NOT NULL DEFAULT 'retangulo',
  points TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS scenario_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenarioKey TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  safeImageUrl TEXT,
  sourceUrl TEXT,
  description TEXT,
  difficulty TEXT NOT NULL DEFAULT 'facil',
  timeSeconds INTEGER NOT NULL DEFAULT 180,
  hintCount INTEGER NOT NULL DEFAULT 2,
  hintCost INTEGER NOT NULL DEFAULT 5,
  wrongClickPenalty INTEGER NOT NULL DEFAULT 0,
  phaseMode TEXT NOT NULL DEFAULT 'livres',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mural_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promptKey TEXT NOT NULL,
  promptText TEXT NOT NULL,
  message TEXT NOT NULL,
  publicName TEXT,
  isAnonymous INTEGER NOT NULL DEFAULT 1,
  consent INTEGER NOT NULL DEFAULT 0,
  participantId INTEGER,
  status TEXT NOT NULL DEFAULT 'pendente',
  isFeatured INTEGER NOT NULL DEFAULT 0,
  flagged INTEGER NOT NULL DEFAULT 0,
  flagReasons TEXT,
  moderationNote TEXT,
  submittedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  moderatedAt TEXT,
  moderatedBy TEXT,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS participant_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participantId INTEGER NOT NULL,
  achievementKey TEXT NOT NULL,
  unlockedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (participantId, achievementKey)
);

CREATE INDEX IF NOT EXISTS participants_participant_type_idx ON participants(participantType);
CREATE INDEX IF NOT EXISTS participants_total_score_idx ON participants(totalScore);
CREATE INDEX IF NOT EXISTS participants_updated_at_idx ON participants(updatedAt);
CREATE INDEX IF NOT EXISTS game_results_participant_game_date_idx ON game_results(participantId, gameType, createdAt);
CREATE INDEX IF NOT EXISTS game_results_game_score_idx ON game_results(gameType, score);
CREATE INDEX IF NOT EXISTS quiz_questions_active_difficulty_idx ON quiz_questions(gameType, active, difficulty);
CREATE INDEX IF NOT EXISTS spot_hotspots_scenario_active_idx ON spot_error_hotspots(scenarioKey, active);
CREATE INDEX IF NOT EXISTS scenario_images_active_idx ON scenario_images(active);
CREATE INDEX IF NOT EXISTS mural_public_feed_idx ON mural_messages(status, isFeatured, submittedAt);
CREATE INDEX IF NOT EXISTS mural_prompt_feed_idx ON mural_messages(status, promptKey, submittedAt);
