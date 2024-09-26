import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { db } from "~/lib/db/client";
import { interviewers } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

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

	return (
		<div className="">
			<form method="POST" id="reset" className="invisible">
				<input type="hidden" name="_action" value="reset" />
			</form>
			<form method="POST" id="quit" className="invisible">
				<input type="hidden" name="_action" value="quit" />
			</form>
			<main className="mx-auto max-w-fit min-w-[24rem] mt-10 p-6 border rounded-md bg-white">
				<h1 className="font-semibold text-2xl text-slate-800">Room Data</h1>
				<form className="flex flex-col gap-4 mt-8" id="data" method="POST">
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
								defaultValue={data.interviewer?.interviewee ?? ""}
							/>
							<Button className="flex-1" form="data" variant="secondary">
								<svg
									title="plane-icon"
									xmlns="http://www.w3.org/2000/svg"
									width="1em"
									height="1em"
									viewBox="0 0 256 256"
								>
									<path
										fill="currentColor"
										d="M227.32 28.68a16 16 0 0 0-15.66-4.08h-.15L19.57 82.84a16 16 0 0 0-2.49 29.8L102 154l41.3 84.87a15.86 15.86 0 0 0 14.44 9.13q.69 0 1.38-.06a15.88 15.88 0 0 0 14-11.51l58.2-191.94v-.15a16 16 0 0 0-4-15.66m-69.49 203.17l-.05.14v-.07l-40.06-82.3l48-48a8 8 0 0 0-11.31-11.31l-48 48l-82.33-40.06h-.07h.14L216 40Z"
									/>
								</svg>
							</Button>
						</div>
					</Label>
				</form>
				<hr className="my-2 h-[1px] bg-slate-600" />
				<div className="flex flex-col gap-2">
					<div className="flex gap-2 justify-stretch w-full">
						<Button className="flex-1" form="reset">
							Done
						</Button>
					</div>
					<Button className="flex-1" variant="outline" form="quit">
						Quit
					</Button>
				</div>
			</main>
		</div>
	);
}

export async function action({ request, params }: LoaderFunctionArgs) {
	const form = await request.formData();
	const id = params.id as string;

	if (form.get("_action") === "update") {
		return updateInterviewee(id, form);
	}

	if (form.get("_action") === "reset") {
		return resetInterviewee(id);
	}

	if (form.get("_action") === "quit") {
		return quitRoom(id);
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

async function resetInterviewee(id: string) {
	await db
		.update(interviewers)
		.set({
			interviewee: null,
			updated_at: null,
		})
		.where(eq(interviewers.id, id))
		.execute();
	return json({ id });
}

async function quitRoom(id: string) {
	await db.delete(interviewers).where(eq(interviewers.id, id)).execute();
	return json({ id });
}
