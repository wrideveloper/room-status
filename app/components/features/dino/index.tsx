import { useEffect, useRef } from "react";
import Resources from "./resources";
import DinoScript from "./script";
import DinoStyle from "./style";

export default function Dino() {
	const startRef = useRef<HTMLDivElement>(null);
	const endRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const startElement = startRef.current;
		const endElement = endRef.current;
		if (!startElement || !endElement) return;

		type DinoRunner = {
			handleEvent?: (event: Event) => void;
			stop?: () => void;
			stopListening?: () => void;
			containerEl?: HTMLElement;
			touchController?: HTMLElement;
		};
		type DinoWindow = Window & {
			__roomDinoRunner?: DinoRunner;
			Runner?: DinoRunner & { instance_?: DinoRunner | null };
		};
		const dinoWindow = window as DinoWindow;
		const previousRunner = dinoWindow.__roomDinoRunner;
		previousRunner?.stop?.();
		previousRunner?.stopListening?.();
		previousRunner?.touchController?.remove();
		previousRunner?.containerEl?.remove();
		if (dinoWindow.Runner) dinoWindow.Runner.instance_ = null;

		const dinoScript = document.createElement("script");
		dinoScript.textContent = DinoScript;
		startElement.appendChild(dinoScript);

		const runnerScript = document.createElement("script");
		runnerScript.textContent =
			"window.__roomDinoRunner = new Runner('.break-dino .interstitial-wrapper');";
		endElement.appendChild(runnerScript);
		const handleMouseDown = (event: MouseEvent) => {
			event.preventDefault();
			dinoWindow.__roomDinoRunner?.handleEvent?.(event);
		};
		const handleMouseUp = (event: MouseEvent) => {
			event.preventDefault();
			dinoWindow.__roomDinoRunner?.handleEvent?.(event);
		};
		startElement.addEventListener("mousedown", handleMouseDown);
		startElement.addEventListener("mouseup", handleMouseUp);

		return () => {
			startElement.removeEventListener("mousedown", handleMouseDown);
			startElement.removeEventListener("mouseup", handleMouseUp);
			const runner = dinoWindow.__roomDinoRunner;
			runner?.stop?.();
			runner?.stopListening?.();
			runner?.touchController?.remove();
			runner?.containerEl?.remove();
			const runnerConstructor = dinoWindow.Runner;
			if (runnerConstructor && runnerConstructor.instance_ === runner) {
				runnerConstructor.instance_ = null;
			}
			delete dinoWindow.__roomDinoRunner;
			dinoScript.remove();
			runnerScript.remove();
		};
	}, []);

	return (
		<div ref={startRef} className="offline break-dino h-[150px] overflow-hidden">
			<style>{`${DinoStyle}
				.break-dino .interstitial-wrapper { height: 150px; margin: 0 auto; max-width: 100%; overflow: hidden; padding: 0; position: relative; }
				.break-dino .runner-container { height: 150px; left: 0; position: relative; top: 0; width: 100% !important; }
				.break-dino .runner-canvas { height: 150px; left: 0; max-width: 100%; top: 0; width: 100%; }
			`}</style>
			<div id="main-frame-error" className="interstitial-wrapper">
				<Resources />
				<div ref={endRef} />
			</div>
		</div>
	);
}
