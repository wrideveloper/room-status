import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server.ts";

export async function loader() {
	const interviewersByRoom = await fetchInterviewersGroupedByRoom();
	return { interviewersByRoom };
}
