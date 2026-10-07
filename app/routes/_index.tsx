import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router";
import { Megaphone, Monitor, UserRound } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert, type AlertVariant } from "~/components/ui/alert";
export const meta = () => [
	{ title: "Room Status" },
	{ name: "description", content: "Room Status application" },
];

const navigationCards = [
	{
		icon: UserRound,
		title: "INTERVIEWER",
		subtitle: "Interviewer masuk sini bang",
		to: "/register",
	},
	{
		icon: Monitor,
		title: "MONITORING",
		subtitle: "Pantau status ruangan dan interviewer saat ini",
		to: "/room",
	},
];

export default function LandingPage() {
	const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [alert, setAlert] = useState<{ message: string; variant: AlertVariant } | null>(null);
	const handleBroadcast = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!message.trim() || isSending) return;

		setIsSending(true);
		try {
			const response = await fetch("/api/room/0/broadcast", {
				method: "POST",
				body: message.trim(),
			});

			if (!response.ok) throw new Error("Broadcast failed");
			setMessage("");
			setIsBroadcastOpen(false);
			setAlert({ message: "Broadcast berhasil dikirim.", variant: "success" });
		} catch {
			setAlert({ message: "Pesan broadcast gagal dikirim.", variant: "error" });
		} finally {
			setIsSending(false);
		}
	};

	return (
		<main className="min-h-[90vh] px-6 py-1 flex justify-center items-center">
			<div className="max-w-4xl">
				<header className="text-center">
					<h1 className="font-sans text-5xl font-bold tracking-tight sm:text-6xl">
						Room Status
					</h1>
					<p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
						Kelola interview dan pantau status ruangan dalam satu tempat 📝
					</p>
				</header>

				<section className="mt-12 grid gap-5 md:grid-cols-3" aria-label="Navigasi utama">
					{navigationCards.map(({ icon: Icon, title, subtitle, to }) => (
						<Link
							key={title}
							to={to}
							className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
						>
							<Icon className="h-8 w-8 text-slate-700" strokeWidth={1.8} />
							<h2 className="mt-6 text-xl font-bold tracking-wide text-slate-800">
								{title}
							</h2>
							<p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
						</Link>
					))}

					<button
						type="button"
						onClick={() => setIsBroadcastOpen(true)}
						className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
					>
						<Megaphone className="h-8 w-8 text-slate-700" strokeWidth={1.8} />
						<h2 className="mt-6 text-xl font-bold tracking-wide text-slate-800">
							BROADCAST
						</h2>
						<p className="mt-2 text-sm leading-6 text-slate-500">
							Kirim pesan ke para interviewer
						</p>
					</button>
				</section>
			</div>

			<Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
				<DialogContent className="bg-slate-100">
					<DialogHeader>
						<DialogTitle className="text-[1.8rem] text-center">
							Kirim broadcast
						</DialogTitle>
						<DialogDescription className="text-center text-md">
							Pesan ini akan dikirim ke <b>semua</b> interviewer
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleBroadcast} className="space-y-5">
						<div>
							<label  htmlFor="message" className="text-sm block font-medium mb-3">Pesan</label>
							<Input
								id="message"
								value={message}
								onChange={(event) => setMessage(event.target.value)}
								placeholder="Ganti gelombang woyy..."
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button type="submit" disabled={!message.trim() || isSending}>
								{isSending ? "Mengirim..." : "Kirim pesan"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
			{alert && (
				<Alert
					message={alert.message}
					variant={alert.variant}
					onClose={() => setAlert(null)}
				/>
			)}
		</main>
	);
}
