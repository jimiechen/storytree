CREATE TABLE `novel_chapter` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`order_index` integer NOT NULL DEFAULT 0,
	`status` text NOT NULL DEFAULT 'draft',
	`word_count` integer NOT NULL DEFAULT 0,
	`content` text NOT NULL DEFAULT '',
	`summary` text,
	`outline` text,
	`extracted_info` text,
	`information_state` text,
	`ai_suggestions` text,
	`last_edited_at` integer,
	`deleted_at` integer,
	`time_created` integer NOT NULL,
	`time_updated` integer NOT NULL
);
