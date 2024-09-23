import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server.ts";
import { useEventStream } from "@remix-sse/client";
import { Interviewer } from "~/lib/db/schema";

export const meta: MetaFunction = () => {
	return [
		{ title: "Room Status" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export async function loader(args: LoaderFunctionArgs) {
	const interviewersByRoom = await fetchInterviewersGroupedByRoom();
	return json({ interviewersByRoom });
}

export default function Index() {
	const data = useLoaderData<typeof loader>();
	const liveDataRaw = useEventStream("/sse/room-update", {
		returnLatestOnly: true,
	}) as string;
	const liveData = JSON.parse(liveDataRaw) as {
		interviewersByRoom: Record<string, Interviewer[]>;
	} | null;

	return (
		<div className="h-screen">
			<h1 className="text-center mt-10 font-sans text-5xl font-bold text-slate-800">
				Status Ruangan
			</h1>
			<Link
				to="/room"
				className="block text-center mt-2 text-yellow-500 underline"
			>
				Go to room page
			</Link>
			<div className="grid grid-cols-3 gap-4 mx-auto max-w-screen-lg mt-10 px-8">
				{Object.entries(
					liveData?.interviewersByRoom ?? data.interviewersByRoom,
				).map(([room, interviewers]) => (
					<div key={room} className="border p-4 rounded-md">
						<h2 className="text-2xl font-bold text-slate-700 uppercase text-center">
							{room}
						</h2>
						<hr className="my-2 h-[1px] bg-slate-600" />
						<div className="flex flex-col gap-2">
							{interviewers.map((interviewer) => (
								<div key={interviewer.id as string} className="flex">
									<div className="flex items-center justify-center pr-2">
										<div
											className={`w-4 h-4 rounded-full ${interviewer.interviewee === null ? "bg-emerald-500" : "bg-red-500"}`}
										/>
									</div>
									<div className="">
										<p className="font-semibold text-slate-600 whitespace-nowrap">
											{interviewer.name}
										</p>
										<p className="text-sm text-slate-500">
											{interviewer.interviewee ?? "-"}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
