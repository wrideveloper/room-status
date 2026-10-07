import { createRequestHandler } from "react-router";

// Export the Durable Object class so the `ROOM_BROKER` binding can resolve it.
export { RoomBroker } from "../app/durable-object/RoomBroker";

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

const ROOM_WS_PATH = /^\/api\/room\/([^/]+)\/ws$/;

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// WebSocket upgrades must reach the Durable Object with the raw `Upgrade`
		// header intact. Handle them here, before React Router rebuilds the Request
		// (which drops forbidden headers like `Upgrade`).
		const match = new URL(request.url).pathname.match(ROOM_WS_PATH);
		if (
			match &&
			request.headers.get("Upgrade")?.toLowerCase() === "websocket"
		) {
			const id = env.ROOM_BROKER.idFromName(match[1]);
			return env.ROOM_BROKER.get(id).fetch(request);
		}

		return requestHandler(request);
	},
} satisfies ExportedHandler<Env>;
