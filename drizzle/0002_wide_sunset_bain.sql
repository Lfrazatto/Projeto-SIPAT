CREATE TABLE `participant_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`achievementKey` varchar(64) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `participant_achievement_unique` UNIQUE(`participantId`,`achievementKey`)
);
