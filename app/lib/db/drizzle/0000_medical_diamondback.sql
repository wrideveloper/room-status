CREATE TABLE `interviewers` (
	`id` text PRIMARY KEY DEFAULT 'uuid_generate_v4()' NOT NULL,
	`name` text NOT NULL,
	`room` text NOT NULL,
	`interviewee` text
);
