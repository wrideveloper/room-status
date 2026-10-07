import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

// Primary target is Cloudflare Workers. Set APP_TARGET=sqlite for the
// no-wrangler Node + better-sqlite3 fallback.
const target = process.env.APP_TARGET ?? "workers";
const isWorkers = target !== "sqlite";
const root = import.meta.dirname;

export default defineConfig({
	envPrefix: ["VITE_", "GOOGLE_FORM_"],
	define: {
		// Client realtime transport: WebSocket on Workers, SSE on Node/SQLite.
		"import.meta.env.VITE_REALTIME": JSON.stringify(isWorkers ? "ws" : "sse"),
	},
	plugins: [
		...(isWorkers ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
		reactRouter(),
	],
	resolve: {
		tsconfigPaths: true,
		alias: {
			"#platform": `${root}/app/lib/platform.${isWorkers ? "workers" : "sqlite"}.ts`,
			"#db": `${root}/app/lib/db/client.${isWorkers ? "workers" : "sqlite"}.ts`,
		},
	},
	// Pre-bundle UI deps so dev does not optimize them lazily on first navigation.
	optimizeDeps: {
		include: [
			"@radix-ui/react-alert-dialog",
			"@radix-ui/react-dialog",
			"@radix-ui/react-label",
			"@radix-ui/react-select",
			"@radix-ui/react-slot",
			"lucide-react",
		],
	},
	server: {
		allowedHosts: ["frontend_web"],
	},
});
