import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const expenses = sqliteTable(
  "expenses",
  {
    id: text("id").primaryKey(),
    spentAt: text("spent_at").notNull(),
    merchant: text("merchant").notNull(),
    amountPence: integer("amount_pence").notNull(),
    currency: text("currency").notNull().default("GBP"),
    category: text("category").notNull(),
    note: text("note").notNull().default(""),
    source: text("source").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_expenses_spent_at").on(table.spentAt)],
);

export const passkeys = sqliteTable(
  "passkeys",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    publicKey: text("public_key").notNull(),
    counter: integer("counter").notNull(),
    transports: text("transports").notNull().default("[]"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_passkeys_created_at").on(table.createdAt)],
);

export const authChallenges = sqliteTable("auth_challenges", {
  tokenHash: text("token_hash").primaryKey(),
  purpose: text("purpose").notNull(),
  challenge: text("challenge").notNull(),
  label: text("label").notNull().default(""),
  expiresAt: integer("expires_at").notNull(),
});

export const ledgerSessions = sqliteTable("ledger_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  passkeyId: text("passkey_id").notNull().references(() => passkeys.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});
