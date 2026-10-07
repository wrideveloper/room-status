import { notifyBroadcast } from "~/lib/server/notify.server";

export async function action({
	params,
	request,
}: {
	params: { id?: string };
	request: Request;
}) {
	const roomId = params.id;
	console.log("[broadcast] action", { roomId, method: request.method });
	if (!roomId) return new Response("Room ID is required", { status: 400 });

	const body = await request.text();
	console.log("[broadcast] body", body);
	await notifyBroadcast(roomId, body);
	console.log("[broadcast] fanned out");

	return { success: true };
}
