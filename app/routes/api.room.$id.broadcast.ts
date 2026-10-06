import { broadcastToRoom } from "~/lib/server/sse.server";

type RoomBrokerBinding = {
	idFromName(name: string): unknown;
	get(id: unknown): { fetch(request: Request): Promise<Response> };
};

type CloudflareRouteArgs = {
	params: { id?: string };
	request: Request;
	context?: unknown;
};

function getRoomBroker(context: unknown) {
	const cloudflare = (context as {
		cloudflare?: { env?: { ROOM_BROKER?: RoomBrokerBinding } };
	} | undefined)?.cloudflare;
	return cloudflare?.env?.ROOM_BROKER;
}

export async function action({ params, request, context }: CloudflareRouteArgs) {
	const roomId = params.id;
	if (!roomId) return new Response("Room ID is required", { status: 400 });

	const body = await request.text();
	const roomBroker = getRoomBroker(context);
	if (!roomBroker) {
		await broadcastToRoom(roomId, body);
		return { success: true };
	}

	const id = roomBroker.idFromName(roomId);
	await roomBroker.get(id).fetch(new Request("http://internal/broadcast", {
		method: "POST",
		body,
	}));

	return { success: true };
}