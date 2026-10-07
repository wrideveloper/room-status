import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server";
import type { Interviewer } from "~/lib/db/schema";
import { BREAK_STATUS, cn } from "~/lib/utils";
import { intervalToDuration } from "date-fns";
import { RefreshCw } from "lucide-react";
import {
 	AlertDialog,
 	AlertDialogAction,
 	AlertDialogCancel,
 	AlertDialogContent,
 	AlertDialogDescription,
 	AlertDialogFooter,
 	AlertDialogHeader,
 	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { subscribeToRoom } from "~/lib/realtime";

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
 	const [isResetting, setIsResetting] = useState(false);
 	const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
 	const [resetError, setResetError] = useState<string | null>(null);


	useEffect(() => {
		const resync = async () => {
			try {
				const res = await fetch("/api/room");
				if (res.ok) setLiveData(await res.json());
			} catch {
				// keep last known state on transient errors
			}
		};

		return subscribeToRoom(
			(message) => {
				if (message.type === "status") {
					setLiveData({ interviewersByRoom: message.interviewersByRoom });
				}
			},
			{ onOpen: resync },
		);
	}, []);

 	const handleResetRequest = () => {
 		setResetError(null);
 		setIsResetDialogOpen(true);
 	};

 	const handleResetConfirmed = async () => {
 		setIsResetting(true);
 		try {
 			const response = await fetch("/api/room", { method: "DELETE" });
 			if (!response.ok) throw new Error("Reset failed");
 			setLiveData({ interviewersByRoom: {} });
 			setIsResetDialogOpen(false);
 		} catch {
 			setResetError("Gagal menghapus entry interview. Coba lagi.");
 			setIsResetDialogOpen(true);
 		} finally {
 			setIsResetting(false);
 		}
 	};

	return (
		<div className="h-screen pt-16">
			<h1 className="text-center font-sans text-5xl font-bold tracking-tight text-slate-800">
				Status Ruangan
			</h1>
			<br />
			<div className="w-100">
				<div className="w-[fit-content] mx-auto">
					<p className="text-center text-lg text-slate-700 mx-12">
						<span className="inline-block">Kalau <b className="text-red-600">merah</b> berarti <u>lagi nge-interview</u> |&nbsp;</span>
						<span className="inline-block">Kalau <b className="text-green-600">hijau</b> berarti <u>available</u> buat nge-interview |&nbsp;</span>
						<span className="inline-block">Kalau <b className="text-yellow-600">kuning</b> berarti lagi <u>break</u></span>
					</p>
				</div>
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
 			<button
 				type="button"
 				onClick={handleResetRequest}
 				disabled={isResetting}
 				aria-label="Hapus semua entry interview"
 				className="fixed bottom-6 right-6 z-10 inline-flex size-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg transition hover:bg-red-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
 			>
 				<RefreshCw className={isResetting ? "size-5 animate-spin" : "size-5"} aria-hidden="true" />
 			</button>
 			<AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
 				<AlertDialogContent>
 					<AlertDialogHeader>
 						<AlertDialogTitle className="text-3xl text-center text-bold tracking-tight pb-1">
							Sapu Bersih Monitoring?
						</AlertDialogTitle>
 						<AlertDialogDescription className="text-center">
 							Tindakan ini akan menghapus seluruh data interview di database
							<hr className="mt-5" />
 						</AlertDialogDescription>
 						{resetError !== null && (
 							<p className="text-sm font-medium text-red-600">{resetError}</p>
 						)}
 					</AlertDialogHeader>
 					<AlertDialogFooter className="justify-center!">
 						<AlertDialogCancel disabled={isResetting}>Batal</AlertDialogCancel>
 						<AlertDialogAction
 							onClick={handleResetConfirmed}
 							disabled={isResetting}
 							className="bg-red-500 text-white hover:bg-red-600"
 						>
 							{isResetting ? "Menghapus..." : "Hapus semua"}
 						</AlertDialogAction>
 					</AlertDialogFooter>
 				</AlertDialogContent>
 			</AlertDialog>
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

			if (props.interviewer.interviewee === null || props.interviewer.interviewee === BREAK_STATUS) {
				setDuration(null);
				return;
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

	const isBreak = props.interviewer.interviewee === BREAK_STATUS;
	const color: string = props.interviewer.interviewee === null
		? "bg-emerald-500"
		: isBreak
			? "bg-yellow-500"
			: "bg-red-500";
	return (
		<div
			key={props.interviewer.id as string}
			className="flex items-center gap-2"
		>
			<div className="flex items-center justify-center pr-2">
				<span className="relative flex size-3">
					<span className={`absolute inline-flex h-full w-full rounded-full ${cn(color, (!isBreak && props.interviewer.interviewee !== null) ? "animate-ping" : "")} opacity-75`} />
					<span className={`relative inline-flex size-3 rounded-full ${color}`} />
				</span>
			</div>
			<div>
				<p className="font-semibold text-slate-600 whitespace-nowrap">
					{props.interviewer.name}
				</p>
				<p className="text-sm text-slate-500">
					{isBreak ? "[ISTIRAHAT]" : props.interviewer.interviewee ?? "[AVAILABLE]"}
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
