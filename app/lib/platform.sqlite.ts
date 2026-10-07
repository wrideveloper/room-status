// Node + SQLite fallback: there are no Cloudflare bindings.
// Consumers use `env?.ROOM_BROKER` / `env?.DB`, which resolve to `undefined` here.
export const env = undefined as
	| { DB?: unknown; ROOM_BROKER?: unknown }
	| undefined;
