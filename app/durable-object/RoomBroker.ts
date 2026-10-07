import { DurableObject } from "cloudflare:workers";

export class RoomBroker extends DurableObject<Env> {
	private sessions = new Set<ReadableStreamDefaultController<Uint8Array>>();

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/subscribe") {
			let controllerRef: ReadableStreamDefaultController<Uint8Array> | undefined;

			const stream = new ReadableStream<Uint8Array>({
				start: (controller) => {
					controllerRef = controller;
					this.sessions.add(controller);
				},
				cancel: () => {
					if (controllerRef) this.sessions.delete(controllerRef);
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

		if (url.pathname === "/broadcast" && request.method === "POST") {
			const message = `data: ${await request.text()}\n\n`;
			const encodedMessage = new TextEncoder().encode(message);

			for (const controller of this.sessions) {
				try {
					controller.enqueue(encodedMessage);
				} catch {
					this.sessions.delete(controller);
				}
			}

			return new Response("OK");
		}

		return new Response("Not found", { status: 404 });
	}
}
