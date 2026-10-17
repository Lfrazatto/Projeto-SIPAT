ALTER TABLE `quiz_questions` ADD `sortOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `quiz_questions_order_idx` ON `quiz_questions` (`gameType`,`active`,`sortOrder`,`id`);