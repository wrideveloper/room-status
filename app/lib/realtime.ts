// Client-side realtime transport. The runtime picks WebSocket on Cloudflare
// (WebSocket Hibernation API via the Durable Object) and SSE on Node/SQLite.
type Cleanup = () => void;

export function subscribeToBroadcast(
	onMessage: (message: string) => void,
): Cleanup {
	if (import.meta.env.VITE_REALTIME === "ws") {
		const protocol = window.location.protocol === "https:" ? "wss" : "ws";
		const socket = new WebSocket(
			`${protocol}://${window.location.host}/api/room/0/ws`,
		);
		socket.onmessage = (event) => onMessage(String(event.data));
		return () => socket.close();
	}

	const source = new EventSource("/api/room/0/sse");
	source.onmessage = (event) => onMessage(event.data);
	return () => source.close();
}
