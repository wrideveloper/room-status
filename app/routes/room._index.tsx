import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { fetchInterviewersGroupedByRoom } from "~/lib/server/util.server";
import type { Interviewer } from "~/lib/db/schema";
import { cn } from "~/lib/utils";
import { intervalToDuration } from "date-fns";
import { House, RefreshCw, UserRound } from "lucide-react";
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
import { NavLinks } from "~/components/nav-links";

const LEGEND = [
	{
		dot: "bg-red-500",
		color: "text-red-600",
		label: "merah",
		text: "lagi nge-interview",
	},
	{
		dot: "bg-emerald-500",
		color: "text-green-600",
		label: "hijau",
		text: "available",
	},
	{
		dot: "bg-yellow-500",
		color: "text-yellow-600",
		label: "kuning",
		text: "lagi break",
	},
];

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
		<div className="min-h-screen pt-16">
			<NavLinks
				className="fixed top-4 left-4 z-20"
				items={[
					{ to: "/", label: "Home", icon: House },
					{ to: "/register", label: "Register", icon: UserRound },
				]}
			/>
			<header className="mx-auto flex max-w-screen-lg flex-col items-center gap-3 px-6 text-center">
				<h1 className="font-sans text-5xl font-bold tracking-tight text-slate-800">
					Status Ruangan
				</h1>
				<p className="text-lg text-slate-600">
					Pantau status tiap ruangan dan interviewer secara real-time.
				</p>
				<ul className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
					{LEGEND.map(({ dot, color, label, text }) => (
						<li key={label} className="flex items-center gap-2 text-slate-700">
							<span
								className={`inline-block size-3 rounded-full ${dot}`}
								aria-hidden="true"
							/>
							<span>
								<b className={color}>{label}</b> = {text}
							</span>
						</li>
					))}
				</ul>
			</header>
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
	const isInterviewing = props.interviewer.status === "interviewing";
	const isBreak = props.interviewer.status === "break";
	const startedAt = props.interviewer.interview_started_at;

	const [duration, setDuration] = useState(() =>
		isInterviewing && startedAt !== null
			? intervalToDuration({ start: new Date(startedAt), end: new Date() })
			: null,
	);

	useEffect(() => {
		const interval = setInterval(() => {
			if (!isInterviewing || startedAt === null) {
				setDuration(null);
				return;
			}

			setDuration(
				intervalToDuration({ start: new Date(startedAt), end: new Date() }),
			);
		}, 1000);
		return () => clearInterval(interval);
	}, [isInterviewing, startedAt]);

	const color: string = isBreak
		? "bg-yellow-500"
		: isInterviewing
			? "bg-red-500"
			: "bg-emerald-500";
	return (
		<div
			key={props.interviewer.id as string}
			className="flex items-center gap-2"
		>
			<div className="flex items-center justify-center pr-2">
				<span className="relative flex size-3">
					<span className={`absolute inline-flex h-full w-full rounded-full ${cn(color, isInterviewing ? "animate-ping" : "")} opacity-75`} />
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
