import { EventStream } from "@remix-sse/server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server.ts";

export function loader({ request }: LoaderFunctionArgs) {
	return new EventStream(request, (send) => {
		const interval = setInterval(async () => {
			const interviewersByRoom = await fetchInterviewersGroupedByRoom();
			send(JSON.stringify({ interviewersByRoom }));
		}, 2000);

		return () => clearInterval(interval);
	});
}
