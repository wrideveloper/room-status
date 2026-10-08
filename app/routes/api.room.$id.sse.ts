import { subscribeToRoom } from "~/lib/server/sse.server";

// SSE transport for the Node/SQLite fallback (Cloudflare uses WebSockets).
export async function loader({ params }: { params: { id?: string } }) {
	const roomId = params.id;
	if (!roomId) return new Response("Room ID is required", { status: 400 });

	return subscribeToRoom(roomId);
}
