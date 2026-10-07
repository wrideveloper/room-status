import type { Interviewer } from "~/lib/db/schema";

// Typed messages for the room realtime channel.
export type RoomMessage =
	| { type: "status"; interviewersByRoom: Record<string, Interviewer[]> }
	| { type: "broadcast"; message: string };

type Cleanup = () => void;

// Subscribes to the room channel. Uses WebSocket on Cloudflare (Durable Object
// with the Hibernation API) and SSE on Node/SQLite (in-memory hub).
export function subscribeToRoom(
	onMessage: (message: RoomMessage) => void,
	options: { onOpen?: () => void } = {},
): Cleanup {
	const handle = (raw: string) => {
		console.log("[realtime] message", raw);
		try {
			onMessage(JSON.parse(raw) as RoomMessage);
		} catch {
			// ignore malformed frames
		}
	};

	if (import.meta.env.VITE_REALTIME === "ws") {
		const protocol = window.location.protocol === "https:" ? "wss" : "ws";
		const url = `${protocol}://${window.location.host}/api/room/0/ws`;
		console.log("[realtime] connecting websocket", url);
		const socket = new WebSocket(url);
		socket.onopen = () => {
			console.log("[realtime] websocket open");
			options.onOpen?.();
		};
		socket.onerror = (event) => console.error("[realtime] websocket error", event);
		socket.onclose = (event) =>
			console.log("[realtime] websocket close", event.code, event.reason);
		socket.onmessage = (event) => handle(String(event.data));
		return () => socket.close();
	}

	console.log("[realtime] connecting SSE");
	const source = new EventSource("/api/room/0/sse");
	source.onopen = () => {
		console.log("[realtime] SSE open");
		options.onOpen?.();
	};
	source.onerror = (event) => console.error("[realtime] SSE error", event);
	source.onmessage = (event) => handle(event.data);
	return () => source.close();
}
