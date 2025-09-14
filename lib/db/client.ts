import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Prefer a singleton in server context
const queryClient = postgres(databaseUrl, {
  max: 1,
  prepare: true,
  idle_timeout: 20,
});

export const db = drizzle(queryClient, { schema });
