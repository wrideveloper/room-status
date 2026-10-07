import { getDb } from "~/lib/db/client";
import { interviewers } from "~/lib/db/schema";
import { notifyRoomStatus } from "~/lib/server/notify.server";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server";

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
	await notifyRoomStatus();
	return new Response(null, { status: 204 });
}
