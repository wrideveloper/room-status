import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const GOOGLE_FORM_EMBED_URL = import.meta.env.GOOGLE_FORM_EMBED_URL;

/**
 * Builds the Google Form embed URL for an interview session.
 *
 * Returns `null` when `GOOGLE_FORM_EMBED_URL` is not configured, so callers can
 * show a friendly message instead of throwing (which would break the button).
 */
export function parseEmbedURL(
	interviewer: string,
	interviewee: string,
): string | null {
	if (!GOOGLE_FORM_EMBED_URL) return null;

	return GOOGLE_FORM_EMBED_URL.replaceAll(
		"{interviewer}",
		encodeURIComponent(interviewer),
	).replaceAll("{interviewee}", encodeURIComponent(interviewee));
}
