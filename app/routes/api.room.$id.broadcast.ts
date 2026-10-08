import { notifyBroadcast } from "~/lib/server/notify.server";

export async function action({
	params,
	request,
}: {
	params: { id?: string };
	request: Request;
}) {
	const roomId = params.id;
	if (!roomId) return new Response("Room ID is required", { status: 400 });

	await notifyBroadcast(roomId, await request.text());

	return { success: true };
}
