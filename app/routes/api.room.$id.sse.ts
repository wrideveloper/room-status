import { subscribeToRoom } from "~/lib/server/sse.server";

type RoomBrokerBinding = {
	idFromName(name: string): unknown;
	get(id: unknown): { fetch(request: Request): Promise<Response> };
};

type CloudflareRouteArgs = {
	params: { id?: string };
	context?: unknown;
};

function getRoomBroker(context: unknown) {
	const cloudflare = (context as {
		cloudflare?: { env?: { ROOM_BROKER?: RoomBrokerBinding } };
	} | undefined)?.cloudflare;
	return cloudflare?.env?.ROOM_BROKER;
}

export async function loader({ params, context }: CloudflareRouteArgs) {
	const roomId = params.id;
	if (!roomId) return new Response("Room ID is required", { status: 400 });

	const roomBroker = getRoomBroker(context);
	if (!roomBroker) return subscribeToRoom(roomId);

	const id = roomBroker.idFromName(roomId);
	return roomBroker.get(id).fetch(new Request("http://internal/subscribe"));
}