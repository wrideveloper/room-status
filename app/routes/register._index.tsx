import {
	type ActionFunctionArgs,
	type MetaFunction,
	redirect,
	useNavigate,
} from "react-router";
import { useEffect } from "react";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { getDb } from "~/lib/db/client";
import { notifyRoomStatus } from "~/lib/server/notify.server";
import { eq } from "drizzle-orm";
import { interviewers } from "~/lib/db/schema";
import { INTERVIEWERS } from "~/lib/data/interviewer";
import { getStoredInterviewerId } from "~/lib/utils";

export const meta: MetaFunction = () => {
	return [
		{ title: "Interviewer" },
		{ name: "description", content: "Interviewer" },
	];
};

export default function RoomPage() {
	const navigate = useNavigate();

	// Already registered (and not on break/quit)? Go straight back to the room.
	useEffect(() => {
		const id = getStoredInterviewerId();
		if (id) navigate(`/room/${id}`, { replace: true });
	}, [navigate]);

	return (
		<div className="min-h-[90vh] flex justify-center items-center">
			<main className="mx-auto w-[min(60%,360px)] p-6 border rounded-[1rem] bg-white">
				<h1 className="text-center font-semibold text-2xl mt-2 text-slate-800">
					Register
				</h1>
				<form method="POST" className="flex flex-col gap-4 mt-8">
					<Label>
						<span className="block mb-2">Nama Lengkap</span>
						<Select name="name" required>
							<SelectTrigger className="w-full">
								<SelectValue
									className="text-slate-600"
									placeholder="Pilih Nama"
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Nama Lengkap</SelectLabel>
									{INTERVIEWERS.map((interviewer) => (
										<SelectItem
											key={interviewer.id}
											value={JSON.stringify({
												id: interviewer.id,
												name: interviewer.name,
											})}
										>
											{interviewer.name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Label>
					<Label>
						<span className="block mb-2">Ruangan</span>
						<Select name="room" required>
							<SelectTrigger className="w-full">
								<SelectValue
									className="text-slate-600"
									placeholder="Pilih Ruangan"
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Ruangan</SelectLabel>
									<SelectItem value="lpy-4">LPY - 4</SelectItem>
									<SelectItem value="lkj-2">LKJ - 2</SelectItem>
									<SelectItem value="lkj-3">LKJ - 3</SelectItem>
									<SelectItem value="lerp">LERP</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</Label>

					<hr className="w-[60%] my-2 mx-auto h-[1px] bg-slate-600" />

					<Button type="submit" className="font-bold">
						SUBMIT
					</Button>
				</form>
			</main>
		</div>
	);
}

export async function action(args: ActionFunctionArgs) {
	const db = getDb();
	const form = await args.request.formData();
	const { id, name } = JSON.parse(form.get("name") as string);

	// check if the interviewer already exists
	const interviewer = await db
		.select()
		.from(interviewers)
		.where(eq(interviewers.id, id));

	if (interviewer.length > 0) return redirect(`/room/${id}`);

	await db.insert(interviewers).values({
		id,
		name,
		room: form.get("room") as string,
		status: "idle",
		interviewee: null,
	});

	await notifyRoomStatus();
	return redirect(`/room/${id}`);
}
