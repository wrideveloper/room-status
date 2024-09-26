CREATE TABLE `interviewers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`room` text NOT NULL,
	`interviewee` text,
	`updated_at` integer
);
