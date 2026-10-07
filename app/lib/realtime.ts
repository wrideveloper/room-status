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
		try {
			onMessage(JSON.parse(raw) as RoomMessage);
		} catch {
			// ignore malformed frames
		}
	};

	if (import.meta.env.VITE_REALTIME === "ws") {
		const protocol = window.location.protocol === "https:" ? "wss" : "ws";
		const socket = new WebSocket(
			`${protocol}://${window.location.host}/api/room/0/ws`,
		);
		socket.onopen = () => options.onOpen?.();
		socket.onmessage = (event) => handle(String(event.data));
		return () => socket.close();
	}

	const source = new EventSource("/api/room/0/sse");
	source.onopen = () => options.onOpen?.();
	source.onmessage = (event) => handle(event.data);
	return () => source.close();
}
