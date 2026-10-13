CREATE INDEX `game_results_participant_game_date_idx` ON `game_results` (`participantId`,`gameType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `game_results_game_score_idx` ON `game_results` (`gameType`,`score`);--> statement-breakpoint
CREATE INDEX `mural_public_feed_idx` ON `mural_messages` (`status`,`isFeatured`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `mural_prompt_feed_idx` ON `mural_messages` (`status`,`promptKey`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `participants_participant_type_idx` ON `participants` (`participantType`);--> statement-breakpoint
CREATE INDEX `participants_total_score_idx` ON `participants` (`totalScore`);--> statement-breakpoint
CREATE INDEX `participants_updated_at_idx` ON `participants` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `quiz_questions_active_difficulty_idx` ON `quiz_questions` (`gameType`,`active`,`difficulty`);--> statement-breakpoint
CREATE INDEX `scenario_images_active_idx` ON `scenario_images` (`active`);--> statement-breakpoint
CREATE INDEX `spot_hotspots_scenario_active_idx` ON `spot_error_hotspots` (`scenarioKey`,`active`);