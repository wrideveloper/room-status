import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

// D1 is a per-request binding, so the client is created per call.
export function getDb() {
	return drizzle(env.DB);
}
