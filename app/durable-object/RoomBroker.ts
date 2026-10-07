import { DurableObject } from "cloudflare:workers";

// Broadcast hub for a room. Uses the WebSocket Hibernation API so connections
// survive object hibernation and the object can sleep while idle. Connections
// are owned by the runtime (`this.ctx.getWebSockets()`), not by in-memory state.
export class RoomBroker extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/subscribe") {
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);

			this.ctx.acceptWebSocket(server);

			return new Response(null, { status: 101, webSocket: client });
		}

		if (url.pathname === "/broadcast" && request.method === "POST") {
			const message = await request.text();

			for (const socket of this.ctx.getWebSockets()) {
				try {
					socket.send(message);
				} catch {
					// socket already closed; the runtime will clean it up
				}
			}

			return new Response("OK");
		}

		return new Response("Not found", { status: 404 });
	}
}
