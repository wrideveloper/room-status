import { env } from "~/lib/platform";

// WebSocket transport (Cloudflare only). Upgrades the connection and hands it
// to the room's Durable Object, which uses the Hibernation API.
export async function loader({
	params,
	request,
}: {
	params: { id?: string };
	request: Request;
}) {
	const roomId = params.id;
	if (!roomId) return new Response("Room ID is required", { status: 400 });

	const roomBroker = env?.ROOM_BROKER;
	if (!roomBroker) {
		return new Response("WebSocket transport is only available on Cloudflare", {
			status: 501,
		});
	}

	const id = roomBroker.idFromName(roomId);
	return roomBroker.get(id).fetch(request);
}
