import { randomUUID } from "node:crypto";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const interviewers = sqliteTable("interviewers", {
	id: text("id").primaryKey().$defaultFn(randomUUID),
	name: text("name").notNull(),
	room: text("room").notNull(),
	interviewee: text("interviewee"),
});

export type Interviewer = typeof interviewers.$inferSelect;
