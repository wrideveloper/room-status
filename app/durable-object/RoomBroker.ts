import { DurableObject } from "cloudflare:workers";

// Broadcast hub for a room.
//
// Uses the WebSocket Hibernation API: `ctx.acceptWebSocket()` tells the runtime
// the connection is hibernatable, so the Durable Object can be evicted from
// memory while clients stay connected, and is re-initialized when an event
// arrives. We do not keep per-connection state, so `ctx.getWebSockets()` is the
// source of truth for connected clients (no `sessions` map needed).
export class RoomBroker extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		// App-level "ping"/"pong" answered by the runtime without waking the
		// object from hibernation.
		this.ctx.setWebSocketAutoResponse(
			new WebSocketRequestResponsePair("ping", "pong"),
		);
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const upgrade = request.headers.get("Upgrade")?.toLowerCase();

		// A WebSocket upgrade is a subscribe. The Worker entry forwards the raw
		// request (preserving the Upgrade header), so the path here is the
		// original /api/room/:id/ws.
		if (upgrade === "websocket") {
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);

			// Hibernatable accept: the runtime owns the connection across evictions.
			this.ctx.acceptWebSocket(server);

			return new Response(null, { status: 101, webSocket: client });
		}

		if (url.pathname === "/broadcast" && request.method === "POST") {
			this.fanOut(await request.text());
			return new Response("OK");
		}

		return new Response("Not found", { status: 404 });
	}

	private fanOut(message: string) {
		const sockets = this.ctx.getWebSockets();
		console.log("[RoomBroker] broadcast", { sockets: sockets.length });

		for (const socket of sockets) {
			try {
				socket.send(message);
			} catch {
				// closed socket; the runtime cleans it up
			}
		}
	}

	async webSocketMessage(_ws: WebSocket, message: string | ArrayBuffer) {
		// Broadcast-only hub: relay any client message to everyone.
		this.fanOut(typeof message === "string" ? message : "[binary]");
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string) {
		console.log("[RoomBroker] socket closed", {
			code,
			reason,
			remaining: this.ctx.getWebSockets().length,
		});
		// `web_socket_auto_reply_to_close` (compat date >= 2026-04-07) completes
		// the close handshake, so ws.close() is optional here.
		ws.close(code, reason);
	}

	async webSocketError(_ws: WebSocket, error: unknown) {
		console.error("[RoomBroker] socket error", error);
	}
}
