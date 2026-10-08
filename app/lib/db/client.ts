// Runtime-selected Drizzle client.
// Vite aliases `#db` to client.workers.ts (D1) or client.sqlite.ts (better-sqlite3).
export { getDb } from "#db";
