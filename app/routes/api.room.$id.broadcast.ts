import { env } from "~/lib/platform";
import { broadcastToRoom } from "~/lib/server/sse.server";

export async function action({
	params,
	request,
}: {
	params: { id?: string };
	request: Request;
}) {
	const roomId = params.id;
	if (!roomId) return new Response("Room ID is required", { status: 400 });

	const body = await request.text();

	// Cloudflare: fan out through the Durable Object.
	const roomBroker = env?.ROOM_BROKER;
	if (!roomBroker) {
		await broadcastToRoom(roomId, body);
		return { success: true };
	}

	const id = roomBroker.idFromName(roomId);
	await roomBroker.get(id).fetch(
		new Request("http://internal/broadcast", {
			method: "POST",
			body,
		}),
	);

	return { success: true };
}
