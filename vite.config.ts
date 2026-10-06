import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
	envPrefix: ["VITE_", "GOOGLE_FORM_"],
	plugins: [reactRouter()],
	resolve: {
		tsconfigPaths: true,
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
