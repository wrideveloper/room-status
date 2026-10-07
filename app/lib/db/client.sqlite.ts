import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// Node + SQLite fallback: module-level singleton.
const sqlite = new Database("store.db");
const db = drizzle(sqlite);

export function getDb() {
	return db;
}
