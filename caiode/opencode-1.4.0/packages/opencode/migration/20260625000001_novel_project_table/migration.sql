CREATE TABLE `novel_project` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`genre` text NOT NULL,
	`description` text NOT NULL DEFAULT '',
	`total_word_count` integer NOT NULL DEFAULT 0,
	`chapter_count` integer NOT NULL DEFAULT 0,
	`character_count` integer NOT NULL DEFAULT 0,
	`status` text NOT NULL DEFAULT 'draft',
	`deleted_at` integer,
	`protagonist` text,
	`target_audience` text,
	`writing_style` text,
	`story_theme` text,
	`custom_settings` text,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL
);
