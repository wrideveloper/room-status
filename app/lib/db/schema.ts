import { randomUUID } from "node:crypto";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const interviewers = sqliteTable("interviewers", {
	id: text("id").primaryKey().$defaultFn(randomUUID),
	name: text("name").notNull(),
	room: text("room").notNull(),
	interviewee: text("interviewee"),
	updated_at: integer("updated_at"),
});

export type Interviewer = typeof interviewers.$inferSelect;
