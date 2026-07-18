CREATE TABLE `feedback_daily_budgets` (
	`day_bucket` text PRIMARY KEY NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_daily_budgets_updated_at_idx` ON `feedback_daily_budgets` (`updated_at`);--> statement-breakpoint
CREATE TABLE `feedback_rate_limits` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`window_started_at` integer NOT NULL,
	`request_count` integer DEFAULT 1 NOT NULL,
	`daily_count` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feedback_rate_limits_updated_at_idx` ON `feedback_rate_limits` (`updated_at`);