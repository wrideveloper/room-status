ALTER TABLE `interviewers` ADD `status` text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE `interviewers` ADD `interview_started_at` integer;--> statement-breakpoint
UPDATE `interviewers` SET `status` = 'break' WHERE `interviewee` = '__BREAK__';--> statement-breakpoint
UPDATE `interviewers` SET `interviewee` = NULL WHERE `status` = 'break';--> statement-breakpoint
UPDATE `interviewers` SET `status` = 'interviewing', `interview_started_at` = `updated_at` WHERE `interviewee` IS NOT NULL;--> statement-breakpoint
