const sessionsByRoom = new Map<
	string,
	Set<ReadableStreamDefaultController<Uint8Array>>
>();

export function subscribeToRoom(roomId: string) {
	let controllerRef: ReadableStreamDefaultController<Uint8Array> | undefined;
	let sessions = sessionsByRoom.get(roomId);

	if (!sessions) {
		sessions = new Set();
		sessionsByRoom.set(roomId, sessions);
	}

	const stream = new ReadableStream<Uint8Array>({
		start: (controller) => {
			controllerRef = controller;
			sessions?.add(controller);
		},
		cancel: () => {
			if (!controllerRef || !sessions) return;
			sessions.delete(controllerRef);
			if (sessions.size === 0) sessionsByRoom.delete(roomId);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}

export async function broadcastToRoom(roomId: string, body: string) {
	const sessions = sessionsByRoom.get(roomId);
	if (!sessions) return;

	const message = new TextEncoder().encode(`data: ${body}\n\n`);
	for (const controller of sessions) {
		try {
			controller.enqueue(message);
		} catch {
			sessions.delete(controller);
		}
	}
}
