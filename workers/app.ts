import { createRequestHandler } from "react-router";

// Export the Durable Object class so the `ROOM_BROKER` binding can resolve it.
export { RoomBroker } from "../app/durable-object/RoomBroker";

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request: Request): Promise<Response> {
		return requestHandler(request);
	},
} satisfies ExportedHandler<Env>;
