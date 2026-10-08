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

/** localStorage key holding the currently active interviewer session id. */
export const INTERVIEWER_ID_KEY = "room-status:interviewer-id";

export function getStoredInterviewerId(): string | null {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage.getItem(INTERVIEWER_ID_KEY);
	} catch {
		return null;
	}
}

export function setStoredInterviewerId(id: string): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(INTERVIEWER_ID_KEY, id);
	} catch {
		// Storage unavailable (private mode / quota) - session just won't persist.
	}
}

export function clearStoredInterviewerId(): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(INTERVIEWER_ID_KEY);
	} catch {
		// Ignore.
	}
}
