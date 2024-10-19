import {
	type ActionFunctionArgs,
	type MetaFunction,
	redirect,
} from "@remix-run/node";
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
import { db } from "~/lib/db/client";
import { eq } from "drizzle-orm";
import { interviewers } from "~/lib/db/schema";
import { INTERVIEWERS } from "~/lib/data/interviewer";

export const meta: MetaFunction = () => {
	return [
		{ title: "Interviewer" },
		{ name: "description", content: "Interviewer" },
	];
};

export default function RoomPage() {
	return (
		<div className="">
			<main className="mx-auto max-w-fit mt-10 p-6 border rounded-md bg-white">
				<h1 className="font-semibold text-2xl text-slate-800">
					Register as Interviewer
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
					<Button type="submit">Submit</Button>
				</form>
			</main>
		</div>
	);
}

export async function action(args: ActionFunctionArgs) {
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
		interviewee: null,
	});
	return redirect(`/room/${id}`);
}
