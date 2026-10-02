CREATE TABLE `passkeys` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`public_key` text NOT NULL,
	`counter` integer NOT NULL,
	`transports` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_passkeys_created_at` ON `passkeys` (`created_at`);