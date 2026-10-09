import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	data as routeData,
	redirect,
} from "react-router";
import { useLoaderData, useFetcher, useBlocker } from "react-router";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { getDb } from "~/lib/db/client";
import { subscribeToRoom } from "~/lib/realtime";
import { notifyRoomStatus } from "~/lib/server/notify.server";
import { 
	interviewers, 
	interviewees, 
} from "~/lib/db/schema";
import {
	clearStoredInterviewerId,
	parseEmbedURL,
	setStoredInterviewerId,
} from "~/lib/utils";
import Dino from "~/components/features/dino";
import { useEffect, useState } from "react";
import { House, Monitor } from "lucide-react";
import { NavLinks } from "~/components/nav-links";

// const TIME = 20 * 60;
const TIME: number = 15 * 60; // change to 15 minutes instead of 20
const BREAK_TIME = 2 * 60;

function computeTimeLeft(startedAt: number | null): number {
	return startedAt === null
		? TIME
		: TIME - Math.floor((Date.now() - startedAt) / 1000);
}

export const meta: MetaFunction = () => {
	return [
		{ title: "Interviewer" },
		{ name: "description", content: "Interviewer Registration" },
	];
};

export async function loader({ params }: LoaderFunctionArgs) {
	const db = getDb();
	const [interviewer] = await db
		.select()
		.from(interviewers)
		.where(eq(interviewers.id, params.id as string));

	const intervieweeOptions = await db
		.select({ id: interviewees.id, name: interviewees.name })
		.from(interviewees);

	if (interviewer === undefined) {
		return routeData(
			{ interviewer: null, intervieweeOptions: [] },
			{ status: 404 },
		);
	}

	return { interviewer, intervieweeOptions };
}

export default function RoomPage() {
	const data = useLoaderData<typeof loader>();
	const fetcher = useFetcher();

	const [showTimeAlert, setShowTimeAlert] = useState(false);
	const [showMissingIntervieweeAlert, setShowMissingIntervieweeAlert] = useState(false);
	const [showActiveInterviewAlert, setShowActiveInterviewAlert] = useState(false);
	const [hasShownAlert, setHasShownAlert] = useState(false);
	const [showBroadcastAlert, setShowBroadcastAlert] = useState(false);
	const [broadcastMessage, setBroadcastMessage] = useState("");
	const [showMissingFormConfigAlert, setShowMissingFormConfigAlert] =
		useState(false);
	// Server-authoritative session state: the dialog + countdown are derived
	// from the interviewer row so a refresh/navigation restores the session.
	const status = data.interviewer?.status ?? "idle";
	const startedAt = data.interviewer?.interview_started_at ?? null;
	const isBreak = status === "break";
	const isInterviewActive = status === "interviewing";
	const isFinished = status === "idle";
	const isDialogOpen = isInterviewActive;
	const embedURL =
		isInterviewActive && data.interviewer && data.interviewer.interviewee
			? parseEmbedURL(data.interviewer.name, data.interviewer.interviewee)
			: null;

	const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(startedAt));
	const [breakTime, setBreakTime] = useState(0);
	const [iframeURL, setIframeURL] = useState<string | null>(null);
	const isTimeout = isInterviewActive && timeLeft <= 0;
	const isBreakDialogOpen = isBreak;

	// Keep the Google Form mounted; unmounting it can trigger its beforeunload handler.
	useEffect(() => {
		if (embedURL) setIframeURL(embedURL);
	}, [embedURL]);

	// Tick the break countdown while break time remains.
	useEffect(() => {
		if (!isBreak) return;
		const interval = setInterval(() => setBreakTime((prev) => Math.max(prev - 1, 0)), 1000);
		return () => clearInterval(interval);
	}, [isBreak]);

	useEffect(() => {
		if (!isBreak || breakTime > 0 || fetcher.state !== "idle") return;

		const formData = new FormData();
		formData.append("_action", "reset");
		fetcher.submit(formData, { method: "post" });
	}, [isBreak, breakTime, fetcher.state, fetcher.submit]);


	// Persist the active session so `/` and `/register` can redirect back here,
	// and clear it when the interviewer row is gone (e.g. PULANG / 404).
	useEffect(() => {
		if (data.interviewer) setStoredInterviewerId(data.interviewer.id as string);
		else clearStoredInterviewerId();
	}, [data.interviewer]);

	// Warn on in-app navigation away from an active interview.
	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			isInterviewActive && currentLocation.pathname !== nextLocation.pathname,
	);

	// Re-anchor the countdown whenever a (new) interview starts.
	useEffect(() => {
		setTimeLeft(computeTimeLeft(startedAt));
		setHasShownAlert(false);
		setShowTimeAlert(false);
	}, [startedAt]);

	// Tick the countdown while the interview is active.
	useEffect(() => {
		if (!isInterviewActive) return;
		const interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
		return () => clearInterval(interval);
	}, [isInterviewActive]);

	// Fire the "time's up" alert once, even if the page reloaded past zero.
	useEffect(() => {
		if (isInterviewActive && timeLeft <= 0 && !hasShownAlert) {
			setShowTimeAlert(true);
			setHasShownAlert(true);
		}
	}, [isInterviewActive, timeLeft, hasShownAlert]);

	useEffect(() => {
		const unsubscribe = subscribeToRoom((message) => {
			if (message.type === "broadcast") {
				setBroadcastMessage(message.message);
				setShowBroadcastAlert(true);
			}
		});

		return unsubscribe;
	}, []);

	const handleStartInterview = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		const form = document.getElementById("data") as HTMLFormElement;
		const formData = new FormData(form);
		const interviewee = formData.get("interviewee")?.toString().trim();
		if (!interviewee) {
			setShowMissingIntervieweeAlert(true);
			return;
		}

		if (parseEmbedURL(data.interviewer?.name ?? "", interviewee) === null) {
			setShowMissingFormConfigAlert(true);
			return;
		}

		fetcher.submit(formData, { method: "post" });
	};

	const handleBreak = () => {
		if (isInterviewActive) {
			setShowActiveInterviewAlert(true);
			return;
		}

		if (breakTime === 0) return;

		const formData = new FormData();
		formData.append("_action", "break");
		fetcher.submit(formData, { method: "post" });
	};

	const handleBreakFinished = () => {
		const formData = new FormData();
		formData.append("_action", "reset");
		fetcher.submit(formData, { method: "post" });
	};

	const handleCloseDialog = () => {
		setBreakTime(BREAK_TIME);
		const formData = new FormData();
		formData.append("_action", "reset");
		fetcher.submit(formData, { method: "post" });
	};

	const formatTime = (seconds: number) => {
		const absSeconds = Math.abs(seconds);
		const mins = Math.floor(absSeconds / 60);
		const secs = absSeconds % 60;
		const timeString = `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;

		return seconds < 0 ? `-${timeString}` : timeString;
	};

	return (
		<div className="min-h-[90vh] flex justify-center items-center">

			<NavLinks
				className="fixed top-4 left-4 z-20"
				items={[
					{ to: "/", label: "Home", icon: House },
					{ to: "/room", label: "Monitoring", icon: Monitor },
				]}
			/>
			<form
				method="POST"
				id="quit"
				className="invisible"
				onSubmit={clearStoredInterviewerId}
			>
				<input type="hidden" name="_action" value="quit" />
			</form>

			<main className="mx-auto max-w-fit min-w-[24rem] mt-10 p-6 border rounded-[1rem] bg-white">
				<span className="relative flex size-3 float-right">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
					<span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
				</span>
				<h1 className="text-center font-semibold text-[1.8rem] mt-4 text-slate-800">
					Welcome
				</h1>

				<form className="flex flex-col gap-4 mt-6" id="data" method="POST">
					<input type="hidden" name="_action" value="update" />
					<Label>
						<span className="block mb-2">Nama</span>
						<Input
							name="name"
							type="text"
							value={data.interviewer?.name}
							className="bg-muted font-semibold"
							readOnly
						/>
					</Label>
					<Label>
						<span className="block mb-2">Peserta</span>
						<div className="flex items-center gap-2">
							<datalist id="peserta">
								{data.intervieweeOptions.map((item) => (
									<option key={item.id} value={item.name} />
								))}
							</datalist>
							<Input
								name="interviewee"
								type="text"
								placeholder="Tanya namanya..."
								list="peserta"
								defaultValue={data.interviewer?.interviewee ?? ""}
							/>
						</div>
					</Label>

					<hr className="w-[60%] my-2 mx-auto h-[1px] bg-slate-600" />

					<div className="flex flex-col gap-2">
						<Button
							onClick={handleStartInterview}
							variant="success"
							className="font-bold"
							type="button"
						>
							MULAI INTERVIEW
						</Button>

						<Button
							onClick={handleBreak}
							variant="default"
							className="font-bold"
							type="button"
							disabled={isInterviewActive || breakTime === 0}
						>
							ISTIRAHAT DULS
						</Button>

						<Button
							className="flex-1 mt-2 font-normal"
							variant="outline"
							form="quit"
							type="submit"
						>
							INI SAATNYA (PULANG)
						</Button>
					</div>
				</form>
			</main>

			{/* Google Form */}
			<Dialog open={isDialogOpen} onOpenChange={() => {}}>
				<DialogContent
					forceMount
					onPointerDownOutside={(event) => event.preventDefault()}
					className="max-w-4xl h-[90vh] flex flex-col"
				>
					<DialogHeader>
						<div className="flex items-center justify-between">
							<div>
								<DialogTitle className="text-2xl">
									Interview Session
								</DialogTitle>
								<DialogDescription>
									{data.interviewer?.name} -{" "}
									{data.interviewer?.interviewee ||
										"Belum ada interviewee"}{" "}
									| {data.interviewer?.room.toUpperCase()}
								</DialogDescription>
							</div>
							<div className="flex items-center gap-4">

								{!isFinished && (
									<>
										<div className="flex items-center gap-2">
											<div className={`w-3 h-3 rounded-full ${isTimeout ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
											<span className="text-sm font-medium">
												{isTimeout ? 'Timeout' : 'Live'}
											</span>
										</div>
										<div className={`text-2xl font-bold tabular-nums ${isTimeout ? 'text-red-500' : 'text-green-500'}`}>
											{formatTime(timeLeft)}
										</div>
									</>
								)}
								<Button
									type="button"
									onClick={handleCloseDialog}
									variant="destructive"
									size="sm"
								>
									Done
								</Button>
							</div>
						</div>
					</DialogHeader>
					<div className="flex-1 overflow-hidden rounded-md border">
					<iframe
						title="Interview form"
						src={iframeURL ?? ""}
						className="h-full w-full border-0"
						loading="lazy"
					>
						Loading...
					</iframe>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={isBreakDialogOpen}>
				<DialogContent
					className="max-w-md text-center"
					onPointerDownOutside={(e) => e.preventDefault()}
					onEscapeKeyDown={(e) => e.preventDefault()}
					onKeyDown={(e) => { if (e.code === "Space") e.preventDefault() }}
					onKeyUp={(e) => { if (e.code === "Space") e.preventDefault() }}
				>
					<DialogHeader className="items-center text-center">
						<div className="flex items-start justify-between gap-4 w-full">
							<div className="flex-1">
								<DialogTitle className="text-[1.8rem]">
									Istirahat Duls
								</DialogTitle>
								<DialogDescription className="text-lg">
									Jangan lama-lama yaa😁
								</DialogDescription>
							</div>
							<div className="text-2xl font-bold tabular-nums text-yellow-500">
								{formatTime(breakTime)}
							</div>
						</div>
					</DialogHeader>

					<Dino />

					<Button variant="success" onClick={handleBreakFinished}>
						SELESAI
					</Button>
				</DialogContent>
			</Dialog>

			<AlertDialog open={showTimeAlert} onOpenChange={setShowTimeAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-2xl">
							⏰ LIHAT WAKTU BRO
						</AlertDialogTitle>
						<AlertDialogDescription className="text-base">
							Waktu interview sudah habis bolo!
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowTimeAlert(false)}>
							OK, Mengerti
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog
				open={showMissingIntervieweeAlert}
				onOpenChange={setShowMissingIntervieweeAlert}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Nama peserta belum diisi</AlertDialogTitle>
						<AlertDialogDescription>
							Isi nama peserta terlebih dahulu sebelum memulai interview.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => setShowMissingIntervieweeAlert(false)}
						>
							Mengerti
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog
				open={showActiveInterviewAlert}
				onOpenChange={setShowActiveInterviewAlert}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Interview masih berlangsung</AlertDialogTitle>
						<AlertDialogDescription>
							Selesaikan sesi interview terlebih dahulu sebelum mengambil waktu istirahat.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => setShowActiveInterviewAlert(false)}
						>
							Mengerti
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={showMissingFormConfigAlert}
				onOpenChange={setShowMissingFormConfigAlert}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Google Form belum dikonfigurasi</AlertDialogTitle>
						<AlertDialogDescription>
							Google Form belum dikonfigurasi. Hubungi panitia sebelum memulai
							interview.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => setShowMissingFormConfigAlert(false)}
						>
							Mengerti
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={showBroadcastAlert} onOpenChange={setShowBroadcastAlert}>
				<AlertDialogContent className="py-6">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-center text-3xl text-sans font-bold tracking-tight mb-3">
							Ada Pesan Dari <b className="text-red-500">ATMIN!</b>
						</AlertDialogTitle>
						<AlertDialogDescription className="text-base">
							<pre className="whitespace-pre-wrap px-3 py-2 bg-slate-50 text-slate-600 font-medium border border-slate-300 border-l-8 rounded-sm overflow-x-auto font-sans leading-relaxed">
								{broadcastMessage}
							</pre>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction className="font-bold"
							onClick={() => setShowBroadcastAlert(false)}>
							OK, Mengerti
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={blocker.state === "blocked"}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Keluar dari sesi interview?</AlertDialogTitle>
						<AlertDialogDescription>
							Sesi interview sedang berlangsung. Kalau keluar, sesi tetap berjalan
							tapi kamu harus membuka ulang halaman ini.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => blocker.state === "blocked" && blocker.reset()}
						>
							Tetap di sini
						</AlertDialogAction>
						<AlertDialogAction
							onClick={() => blocker.state === "blocked" && blocker.proceed()}
						>
							Keluar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

async function setBreakStatus(id: string) {
	const db = getDb();
	await db
		.update(interviewers)
		.set({
			status: "break",
			interviewee: null,
			interview_started_at: null,
			updated_at: Date.now(),
		})
		.where(eq(interviewers.id, id))
		.execute();

	await notifyRoomStatus();
	return { id };
}

async function resetRoom(id: string) {
	const db = getDb();
	await db
		.update(interviewers)
		.set({
			status: "idle",
			interviewee: null,
			interview_started_at: null,
			updated_at: Date.now(),
		})
		.where(eq(interviewers.id, id))
		.execute();

	await notifyRoomStatus();
	return { id };
}

export async function action({ request, params }: ActionFunctionArgs) {
	const form = await request.formData();
	const id = params.id as string;

	switch (form.get("_action")) {
		case "update": return updateInterviewee(id, form);
		case "quit": return quitRoom(id);
		case "break": return setBreakStatus(id);
		case "reset": return resetRoom(id);
	}

	return { id };
}

async function updateInterviewee(id: string, form: FormData) {
	const db = getDb();
	const interviewee = form.get("interviewee") as string;

	await db
		.update(interviewers)
		.set({
			status: "interviewing",
			interviewee: interviewee,
			interview_started_at: Date.now(),
			updated_at: Date.now(),
		})
		.where(eq(interviewers.id, id))
		.execute();

	await notifyRoomStatus();

	return { id };
}

async function quitRoom(id: string) {
	const db = getDb();
	await db.delete(interviewers).where(eq(interviewers.id, id)).execute();
	await notifyRoomStatus();
	return redirect("/");
}
