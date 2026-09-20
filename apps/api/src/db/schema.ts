import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const links = pgTable("links", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  code: text().notNull().unique(),
  targetUrl: text("target_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
