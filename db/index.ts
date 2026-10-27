import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./auth-schema";
import * as appSchema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

export const client = postgres(connectionString, {
  prepare: false,
});

export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...appSchema,
  },
});
