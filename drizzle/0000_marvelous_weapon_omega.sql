CREATE TABLE `game_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`scenarioKey` varchar(64) NOT NULL DEFAULT 'unknown',
	`participantChapa` varchar(64) NOT NULL,
	`participantWwid` varchar(64) NOT NULL,
	`participantName` varchar(255) NOT NULL,
	`gameType` enum('quiz_seguranca','quiz_ergonomia','ache_o_erro','organize_a_fabrica') NOT NULL,
	`difficulty` enum('facil','medio','dificil','muito_dificil') NOT NULL,
	`score` int NOT NULL,
	`correctCount` int NOT NULL,
	`wrongCount` int NOT NULL,
	`hintsUsed` int NOT NULL DEFAULT 0,
	`timeSpentSeconds` int NOT NULL,
	`isBestScore` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameKey` varchar(64) NOT NULL,
	`title` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`accessStartAt` timestamp,
	`accessEndAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `game_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_settings_gameKey_unique` UNIQUE(`gameKey`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`participantType` enum('terceiro','cummins','visitante') NOT NULL DEFAULT 'terceiro',
	`chapa` varchar(64) NOT NULL,
	`wwid` varchar(64) NOT NULL,
	`totalScore` int NOT NULL DEFAULT 0,
	`completedGamesCount` int NOT NULL DEFAULT 0,
	`bestSecurityScore` int NOT NULL DEFAULT 0,
	`bestEnvironmentScore` int NOT NULL DEFAULT 0,
	`bestSpotErrorScore` int NOT NULL DEFAULT 0,
	`bestOrganizeScore` int NOT NULL DEFAULT 0,
	`totalCorrectAnswers` int NOT NULL DEFAULT 0,
	`totalWrongAnswers` int NOT NULL DEFAULT 0,
	`highestDifficulty` varchar(32) NOT NULL DEFAULT 'Fácil',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `participants_chapa_unique` UNIQUE(`chapa`),
	CONSTRAINT `participants_wwid_unique` UNIQUE(`wwid`)
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameType` enum('quiz_seguranca','quiz_ergonomia') NOT NULL,
	`question` text NOT NULL,
	`optionA` text NOT NULL,
	`optionB` text NOT NULL,
	`optionC` text NOT NULL,
	`optionD` text NOT NULL,
	`correctOption` enum('A','B','C','D') NOT NULL,
	`explanation` text,
	`theme` varchar(128) NOT NULL,
	`difficulty` enum('facil','medio','dificil') NOT NULL DEFAULT 'facil',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenario_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioKey` varchar(64) NOT NULL,
	`label` varchar(128) NOT NULL,
	`imageUrl` text NOT NULL,
	`safeImageUrl` text,
	`sourceUrl` text,
	`description` text,
	`difficulty` enum('facil','medio','dificil','muito_dificil') NOT NULL DEFAULT 'facil',
	`timeSeconds` int NOT NULL DEFAULT 180,
	`hintCount` int NOT NULL DEFAULT 2,
	`hintCost` int NOT NULL DEFAULT 5,
	`wrongClickPenalty` int NOT NULL DEFAULT 0,
	`phaseMode` enum('livres','sequenciais') NOT NULL DEFAULT 'livres',
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenario_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `scenario_images_scenarioKey_unique` UNIQUE(`scenarioKey`)
);
--> statement-breakpoint
CREATE TABLE `spot_error_hotspots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioKey` varchar(64) NOT NULL DEFAULT 'cdbs-oficina',
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`hint` text,
	`category` varchar(64) NOT NULL,
	`x` double NOT NULL,
	`y` double NOT NULL,
	`width` double NOT NULL DEFAULT 14,
	`height` double NOT NULL DEFAULT 13,
	`tolerance` double NOT NULL DEFAULT 1,
	`shape` enum('retangulo','circulo','poligono') NOT NULL DEFAULT 'retangulo',
	`points` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spot_error_hotspots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
