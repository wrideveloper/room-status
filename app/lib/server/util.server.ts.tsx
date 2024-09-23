import { db } from "~/lib/db/client";
import { type Interviewer, interviewers } from "~/lib/db/schema";

export async function fetchInterviewersGroupedByRoom() {
	const interviewersData = await db.select().from(interviewers);
	return interviewersData.reduce(
		(acc, curr) => {
			if (!acc[curr.room]) {
				acc[curr.room] = [];
			}
			acc[curr.room].push(curr);
			return acc;
		},
		{} as Record<string, Interviewer[]>,
	);
}
