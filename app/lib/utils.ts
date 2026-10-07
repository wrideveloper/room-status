import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const GOOGLE_FORM_EMBED_URL = import.meta.env.GOOGLE_FORM_EMBED_URL;

export function parseEmbedURL(interviewer: string, interviewee: string) {
	if (!GOOGLE_FORM_EMBED_URL) {
		throw new Error("GOOGLE_FORM_EMBED_URL is not configured");
	}

	return GOOGLE_FORM_EMBED_URL
		.replaceAll("{interviewer}", encodeURIComponent(interviewer))
		.replaceAll("{interviewee}", encodeURIComponent(interviewee));
}

export const BREAK_STATUS = "__BREAK__";