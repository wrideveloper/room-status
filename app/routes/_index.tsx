import { json, type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server.ts";
import { useEventStream } from "@remix-sse/client";
import type { Interviewer } from "~/lib/db/schema";
import { intervalToDuration } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
	return [
		{ title: "Room Status" },
		{ name: "description", content: "Room Status" },
	];
};

export async function loader() {
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
			<p className="text-center text-lg text-slate-700 mt-4">
				Kalo merah berarti lagi nge-interview, kalo hijau berarti available buat nge-interview.
			</p>
			<Button className="mx-auto block mt-8">
				<Link to="/room">INTERVIEWER MASUK SINI BANG</Link>
			</Button>
			<div className="grid grid-cols-2 gap-4 mx-auto max-w-screen-lg mt-10 px-8">
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
								<InterviewerCard
									key={interviewer.id}
									interviewer={interviewer}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

type InterviewerCardProps = {
	interviewer: Interviewer;
};

function InterviewerCard(props: InterviewerCardProps) {
	const [duration, setDuration] = useState(() =>
		props.interviewer.updated_at !== null
			? intervalToDuration({
				start: new Date(props.interviewer.updated_at),
				end: new Date(),
			})
			: null,
	);

	console.log(duration, "INI DURATION")

	useEffect(() => {
		const interval = setInterval(() => {
			if (props.interviewer.updated_at === null) {
				setDuration(null);
				return;
			}

			if (props.interviewer.interviewee === null) {
				setDuration(null);
				return
			}

			setDuration(() =>
				intervalToDuration({
					start: new Date(props.interviewer.updated_at as number),
					end: new Date(),
				}),
			);

		}, 1000);
		return () => clearInterval(interval);
	}, [props.interviewer.updated_at]);

	console.log(props.interviewer)

	return (
		<div
			key={props.interviewer.id as string}
			className="flex items-center gap-2"
		>
			<div className="flex items-center justify-center pr-2">
				<div
					className={`w-4 h-4 rounded-full ${props.interviewer.interviewee === null ? "bg-emerald-500" : "bg-red-500"}`}
				/>
			</div>
			<div className="">
				<p className="font-semibold text-slate-600 whitespace-nowrap">
					{props.interviewer.name}
				</p>
				<p className="text-sm text-slate-500">
					{props.interviewer.interviewee ?? "-"}
				</p>
			</div>
			{duration !== null && (
				<div className="ml-auto text-slate-700 font-medium">
					{(duration.minutes ?? 0).toString().padStart(2, "0")}:
					{(duration.seconds ?? 0).toString().padStart(2, "0")}
				</div>
			)}
		</div>
	);
}
