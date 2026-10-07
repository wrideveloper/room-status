import { DurableObject } from "cloudflare:workers";

// Broadcast hub for a room. Uses the WebSocket Hibernation API so connections
// survive object hibernation and the object can sleep while idle. Connections
// are owned by the runtime (`this.ctx.getWebSockets()`), not by in-memory state.
export class RoomBroker extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		console.log("[RoomBroker] fetch", url.pathname, {
			sockets: this.ctx.getWebSockets().length,
		});

		if (url.pathname === "/subscribe") {
			if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
				console.log("[RoomBroker] subscribe rejected: missing Upgrade header");
				return new Response("Expected WebSocket upgrade", { status: 426 });
			}

			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);

			this.ctx.acceptWebSocket(server);
			console.log("[RoomBroker] accepted socket", {
				total: this.ctx.getWebSockets().length,
			});

			return new Response(null, { status: 101, webSocket: client });
		}

		if (url.pathname === "/broadcast" && request.method === "POST") {
			const message = await request.text();
			const sockets = this.ctx.getWebSockets();
			console.log("[RoomBroker] broadcast", {
				sockets: sockets.length,
				message,
			});

			for (const socket of sockets) {
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
