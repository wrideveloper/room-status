import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./app/lib/db/schema.ts",
	out: "./app/lib/db/drizzle",
	dbCredentials: {
		url: "store.db",
	},
});
