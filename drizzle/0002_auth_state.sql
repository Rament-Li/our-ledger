CREATE TABLE `auth_challenges` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`purpose` text NOT NULL,
	`challenge` text NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ledger_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`passkey_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`passkey_id`) REFERENCES `passkeys`(`id`) ON UPDATE no action ON DELETE cascade
);
