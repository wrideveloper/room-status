import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const CLOSE_ANIMATION_MS = 300;

export function Notification({
	open,
	message,
	onClose,
}: {
	open: boolean;
	message: string;
	onClose: () => void;
}) {
	const [isMounted, setIsMounted] = useState(open);
	const [isClosing, setIsClosing] = useState(false);
	const [messageAnimationKey, setMessageAnimationKey] = useState(0);
	const previousMessage = useRef(message);

	useEffect(() => {
		if (previousMessage.current === message) return;
		previousMessage.current = message;
		setMessageAnimationKey((key) => key + 1);
	}, [message]);

	useEffect(() => {
		if (open) {
			setIsMounted(true);
			setIsClosing(false);
			return;
		}

		if (!isMounted) return;

		setIsClosing(true);
		const timeout = window.setTimeout(() => {
			setIsMounted(false);
			setIsClosing(false);
		}, CLOSE_ANIMATION_MS);

		return () => window.clearTimeout(timeout);
	}, [open, isMounted]);

	const handleClose = () => {
		if (isClosing) return;
		setIsClosing(true);
		window.setTimeout(() => {
			setIsMounted(false);
			setIsClosing(false);
			onClose();
		}, CLOSE_ANIMATION_MS);
	};

	if (!isMounted) return null;

	return (
		<div
			key={messageAnimationKey}
			role="alert"
			className={`pointer-events-auto fixed left-1/2 top-4 z-80 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border-l-6 border-r-6 border-orange-300 bg-white p-5 text-start shadow-[0_2px_8px_0_rgba(99,99,99,0.2)] duration-300 ${
				isClosing
					? "animate-out slide-out-to-top-6 fade-out-0"
					: "animate-in slide-in-from-top-6 fade-in-0 zoom-in-95"
			}`}
		>
			<button
				type="button"
				onClick={handleClose}
				aria-label="Tutup pesan"
				className="absolute right-3 top-3 rounded-sm p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
			>
				<X className="size-8 cursor-pointer" aria-hidden="true" />
			</button>

			<h2 className="mb-3 pr-8 text-start text-3xl font-bold tracking-tight">
				Ada Pesan Dari <b className="text-red-500">ATMIN!</b>
			</h2>
			<hr />
			<div className="mt-3 text-start font-sans text-base font-semibold leading-relaxed text-slate-600">
				{message}
			</div>
		</div>
	);
}

