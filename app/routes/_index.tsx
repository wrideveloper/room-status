import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server.ts";
import type { Interviewer } from "~/lib/db/schema";
import { intervalToDuration } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => {
	return [
		{ title: "Room Status" },
		{ name: "description", content: "Room Status" },
	];
};

export async function loader() {
	const interviewersByRoom = await fetchInterviewersGroupedByRoom();
	return { interviewersByRoom };
}

export default function Index() {
	const data = useLoaderData<typeof loader>();
	const [liveData, setLiveData] = useState<{
		interviewersByRoom: Record<string, Interviewer[]>;
	} | null>(null);

	useEffect(() => {
		let active = true;
		const tick = async () => {
			try {
				const res = await fetch("/api/room-status");
				if (res.ok && active) {
					setLiveData(await res.json());
				}
			} catch {
				// keep last known state on transient errors
			}
		};
		tick();
		const id = setInterval(tick, 2000);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, []);

	return (
		<div className="h-screen pt-16">
			<h1 className="text-center font-sans text-5xl font-bold text-slate-800">
				Status Ruangan
			</h1>
			<br />
			<div className="w-100">
				<div className="w-[fit-content] mx-auto">
					<p className="text-center text-lg text-slate-700">
						Kalau <b className="text-red-600">merah</b> berarti <u>lagi nge-interview</u> |
						Kalau <b className="text-green-600">hijau</b> berarti <u>available</u> buat nge-interview |
						Kalau <b className="text-yellow-600">kuning</b> berarti lagi <u>break</u>
					</p>
				</div>
			</div>
			<div className="mt-8 flex justify-center">
				<Button asChild>
					<Link to="/room">INTERVIEWER MASUK SINI BANG</Link>
				</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto max-w-screen-lg mt-10 px-8">
				{Object.entries(
					liveData?.interviewersByRoom ?? data.interviewersByRoom,
				).map(([room, interviewers]) => (
					<div key={room} className="border p-4 rounded-[1rem] bg-white">
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
	}, [props.interviewer.updated_at, props.interviewer.interviewee]);

	let color: String = props.interviewer.interviewee === null ? "bg-emerald-500" : "bg-red-500";

	return (
		<div
			key={props.interviewer.id as string}
			className="flex items-center gap-2"
		>
			<div className="flex items-center justify-center pr-2">
				<span className="relative flex size-3">
					<span className={`absolute inline-flex h-full w-full rounded-full ${cn(color, (props.interviewer.interviewee !== null) ? "animate-ping": "")} opacity-75`}></span>
					<span className={`relative inline-flex size-3 rounded-full ${color}`}></span>
				</span>
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
