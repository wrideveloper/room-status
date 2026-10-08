import { type RouteConfig, route } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes({ ignoredRouteFiles: ["**/wellknown.ts"] }).then(
	(fsRoutes) => [
		...fsRoutes,
		// Chrome DevTools probes this URL; answer it so it does not log a 404.
		route(
			".well-known/appspecific/com.chrome.devtools.json",
			"routes/wellknown.ts",
		),
	],
) satisfies RouteConfig;
