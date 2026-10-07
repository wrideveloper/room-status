import { env } from "~/lib/platform";
import { broadcastToRoom } from "~/lib/server/sse.server";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server.ts";

// All clients subscribe to the same channel (see app/lib/realtime.ts).
const DEFAULT_ROOM_ID = "0";

async function fanOut(roomId: string, payload: string) {
	const roomBroker = env?.ROOM_BROKER;
	console.log("[notify] fanOut", {
		roomId,
		via: roomBroker ? "durable-object" : "in-memory",
		payload,
	});
	if (!roomBroker) {
		await broadcastToRoom(roomId, payload);
		return;
	}

	const id = roomBroker.idFromName(roomId);
	await roomBroker.get(id).fetch(
		new Request("http://internal/broadcast", {
			method: "POST",
			body: payload,
		}),
	);
}

export async function notifyRoomStatus(roomId: string = DEFAULT_ROOM_ID) {
	const interviewersByRoom = await fetchInterviewersGroupedByRoom();
	await fanOut(roomId, JSON.stringify({ type: "status", interviewersByRoom }));
}

export async function notifyBroadcast(roomId: string, message: string) {
	await fanOut(roomId, JSON.stringify({ type: "broadcast", message }));
}
