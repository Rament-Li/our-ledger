CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`spent_at` text NOT NULL,
	`merchant` text NOT NULL,
	`amount_pence` integer NOT NULL,
	`currency` text DEFAULT 'GBP' NOT NULL,
	`category` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`source` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_expenses_spent_at` ON `expenses` (`spent_at`);