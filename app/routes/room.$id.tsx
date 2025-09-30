import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
	redirect,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
import { db } from "~/lib/db/client";
import { interviewers } from "~/lib/db/schema";
import { useEffect, useState } from "react";

export const meta: MetaFunction = () => {
	return [
		{ title: "Interviewer" },
		{ name: "description", content: "Interviewer Registration" },
	];
};

export async function loader({ params }: LoaderFunctionArgs) {
	const interviewer = db
		.select()
		.from(interviewers)
		.where(eq(interviewers.id, params.id as string))
		.get();
	if (interviewer === undefined) {
		return json({ interviewer: null }, { status: 404 });
	}
	return json({
		interviewer: interviewer,
	});
}

export default function RoomPage() {
	const data = useLoaderData<typeof loader>();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [timeLeft, setTimeLeft] = useState(20 * 60);
	const [isTimerRunning, setIsTimerRunning] = useState(false);
	const [showTimeAlert, setShowTimeAlert] = useState(false);
	const isFinished = data.interviewer?.interviewee === null;

	useEffect(() => {
		if (!isTimerRunning || data.interviewer?.interviewee === null) return;

		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setShowTimeAlert(true);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isTimerRunning, data.interviewer?.interviewee]);

	const handleStartInterview = () => {
		setIsDialogOpen(true);
		setIsTimerRunning(true);
		setTimeLeft(20 * 60);
	};

	const handleCloseDialog = async () => {
		setIsDialogOpen(false);
		setIsTimerRunning(false);
		const formData = new FormData();
		formData.append("_action", "reset");

		await fetch(window.location.href, {
			method: "POST",
			body: formData,
		});
		window.location.reload();
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	return (
		<div className="">
			<form method="POST" id="quit" className="invisible">
				<input type="hidden" name="_action" value="quit" />
			</form>
			<main className="mx-auto max-w-fit min-w-[24rem] mt-10 p-6 border rounded-md bg-white">
				<h1 className="font-semibold text-2xl text-slate-800">
					Room Data
				</h1>
				<form
					className="flex flex-col gap-4 mt-8"
					id="data"
					method="POST"
				>
					<input type="hidden" name="_action" value="update" />
					<Label>
						<span className="block mb-2">Name</span>
						<Input
							name="name"
							type="text"
							value={data.interviewer?.name}
							readOnly
						/>
					</Label>
					<Label>
						<span className="block mb-2">Interviewee</span>
						<div className="flex items-center gap-2">
							<Input
								name="interviewee"
								type="text"
								defaultValue={
									data.interviewer?.interviewee ?? ""
								}
							/>
							<Button
								className="flex-1"
								form="data"
								variant="secondary"
							>
								OK
							</Button>
						</div>
					</Label>
				</form>
				<hr className="my-2 h-[1px] bg-slate-600" />
				<div className="flex flex-col gap-2">
					<Button
						className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
						onClick={handleStartInterview}
						type="button"
					>
						MULAI INTERVIEW
					</Button>
					<Button className="flex-1" variant="outline" form="quit">
						INI SAATNYA (PULANG)
					</Button>
				</div>
			</main>

			{/* Google Form */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-4xl h-[90vh] flex flex-col">
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
											<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
											<span className="text-sm font-medium">
												Live
											</span>
										</div>
										<div className="text-2xl font-bold text-green-500 tabular-nums">
											{formatTime(timeLeft)}
										</div>
									</>
								)}
								<Button
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
							src="https://docs.google.com/forms/d/e/1FAIpQLSddym_7rm-6MaZIO70kzMNqfh6Szjf12AyuemLmIJwiCJX7oQ/viewform?embedded=true"
							width="100%"
							height="100%"
							frameBorder="0"
							marginHeight={0}
							marginWidth={0}
						>
							Loading…
						</iframe>
					</div>
				</DialogContent>
			</Dialog>

			{/* Time Alert */}
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
						<AlertDialogAction>OK, Mengerti</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

async function resetRoom(id: string) {
	await db
		.update(interviewers)
		.set({
			interviewee: null,
			updated_at: Date.now(),
		})
		.where(eq(interviewers.id, id))
		.execute();

	return json({ id });
}

export async function action({ request, params }: LoaderFunctionArgs) {
	const form = await request.formData();
	const id = params.id as string;

	if (form.get("_action") === "update") {
		return updateInterviewee(id, form);
	}

	if (form.get("_action") === "quit") {
		return quitRoom(id);
	}

	if (form.get("_action") === "reset") {
		return resetRoom(id);
	}

	return json({ id });
}

async function updateInterviewee(id: string, form: FormData) {
	const interviewee = form.get("interviewee") as string;
	await db
		.update(interviewers)
		.set({
			interviewee: interviewee,
			updated_at: Date.now(),
		})
		.where(eq(interviewers.id, id))
		.execute();
	return json({ id });
}

async function quitRoom(id: string) {
	await db.delete(interviewers).where(eq(interviewers.id, id)).execute();
	return redirect("/");
}