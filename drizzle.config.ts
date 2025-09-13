import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
