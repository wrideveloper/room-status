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

		// A WebSocket upgrade is a subscribe. The Worker entry forwards the raw
		// request (preserving the Upgrade header), so the path here is the
		// original /api/room/:id/ws.
		if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
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
		for (const socket of this.ctx.getWebSockets()) {
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
		// 1005 (no status), 1006 (abnormal) and 1015 (TLS) are reserved and must
		// never be sent back in a close frame, so echoing them throws
		// InvalidAccessError. `web_socket_auto_reply_to_close` (compat date
		// >= 2026-04-07) already completed the handshake, so there is nothing to do.
		if (code === 1005 || code === 1006 || code === 1015) return;

		// Only close explicitly for real codes, keeping this correct on older
		// compatibility dates that do not auto-reply.
		ws.close(code, reason);
	}

	async webSocketError(_ws: WebSocket, error: unknown) {
		console.error("RoomBroker socket error", error);
	}
}
