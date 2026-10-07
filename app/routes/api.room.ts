import { getDb } from "~/lib/db/client";
import { interviewers } from "~/lib/db/schema";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server.ts";

export async function loader() {
	const interviewersByRoom = await fetchInterviewersGroupedByRoom();
	return { interviewersByRoom };
}

export async function action({ request }: { request: Request }) {
	if (request.method !== "DELETE") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: { Allow: "DELETE" },
		});
	}

	const db = getDb();
	await db.delete(interviewers).execute();
	return new Response(null, { status: 204 });
}
