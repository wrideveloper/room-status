import { randomUUID } from "node:crypto";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const interviewers = sqliteTable("interviewers", {
	id: text("id").primaryKey().$defaultFn(randomUUID),
	name: text("name").notNull(),
	room: text("room").notNull(),
	// Session state: idle | interviewing | break (server-authoritative).
	status: text("status", { enum: ["idle", "interviewing", "break"] })
		.notNull()
		.default("idle"),
	// Participant name while `status === "interviewing"`, otherwise null.
	interviewee: text("interviewee"),
	// When the current interview started (epoch ms); drives the countdown.
	interview_started_at: integer("interview_started_at"),
	updated_at: integer("updated_at"),
});

export type Interviewer = typeof interviewers.$inferSelect;
