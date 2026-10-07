import { env } from "~/lib/platform";
import { subscribeToRoom } from "~/lib/server/sse.server";

export async function loader({ params }: { params: { id?: string } }) {
	const roomId = params.id;
	if (!roomId) return new Response("Room ID is required", { status: 400 });

	// Cloudflare: fan out through the Durable Object.
	const roomBroker = env?.ROOM_BROKER;
	if (!roomBroker) return subscribeToRoom(roomId);

	const id = roomBroker.idFromName(roomId);
	return roomBroker.get(id).fetch(new Request("http://internal/subscribe"));
}
