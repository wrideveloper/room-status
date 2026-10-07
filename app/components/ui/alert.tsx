import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";
import { cn } from "~/lib/utils";

export type AlertVariant = "success" | "error" | "info";

export type AlertProps = {
	message: string;
	variant?: AlertVariant;
	duration?: number;
	onClose: () => void;
};

const variantStyles: Record<AlertVariant, { className: string; Icon: typeof Info }> = {
	success: {
		className: "border-emerald-200 bg-emerald-50 text-emerald-800",
		Icon: CheckCircle2,
	},
	error: {
		className: "border-red-200 bg-red-50 text-red-800",
		Icon: XCircle,
	},
	info: {
		className: "border-blue-200 bg-blue-50 text-blue-800",
		Icon: Info,
	},
};

export function Alert({
	message,
	variant = "info",
	duration = 4000,
	onClose,
}: AlertProps) {
	useEffect(() => {
		if (duration <= 0) return;
		const timeout = window.setTimeout(onClose, duration);
		return () => window.clearTimeout(timeout);
	}, [duration, onClose]);

	const { className, Icon } = variantStyles[variant];

	return (
		<div
			role={variant === "error" ? "alert" : "status"}
			className={cn(
				"fixed bottom-5 right-5 z-[100] flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg",
				className,
			)}
		>
			<Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
			<p className="flex-1 leading-5">{message}</p>
			<button
				type="button"
				aria-label="Tutup notifikasi"
				onClick={onClose}
				className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-current"
			>
				<X className="h-4 w-4" aria-hidden="true" />
			</button>
		</div>
	);
}
