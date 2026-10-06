import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function parseEmbedURL(interviewer: string, interviewee: string) {
	const GOOGLE_FORM_EMBED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfdKfTmymzGDXm3NbnGEnMgsLZQpQ6h42pG3cyIvJ6P9nHbiw/viewform";

	const params = new URLSearchParams({
		embedded: "true",
		"entry.1420316577": interviewer,
		"entry.1074090088": interviewee,
	});

	return `${GOOGLE_FORM_EMBED_URL}?${params.toString()}`;
}
