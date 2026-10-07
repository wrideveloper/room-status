import { DurableObject } from "cloudflare:workers";

// Broadcast hub for a room. Uses the WebSocket Hibernation API so connections
// survive object hibernation and the object can sleep while idle. Connections
// are owned by the runtime (`this.ctx.getWebSockets()`), not by in-memory state.
export class RoomBroker extends DurableObject<Env> {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const upgrade = request.headers.get("Upgrade")?.toLowerCase();
		console.log("[RoomBroker] fetch", url.pathname, {
			upgrade,
			sockets: this.ctx.getWebSockets().length,
		});

		// Any WebSocket upgrade is a subscribe (the worker entry forwards the raw
		// request, so the path is the original /api/room/:id/ws, not /subscribe).
		if (upgrade === "websocket") {
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
