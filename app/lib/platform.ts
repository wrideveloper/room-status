// Runtime-selected platform bindings.
// Vite aliases `#platform` to platform.workers.ts (Cloudflare) or
// platform.sqlite.ts (Node/SQLite) depending on APP_TARGET.
export { env } from "#platform";
