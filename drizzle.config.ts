import type { Config } from "drizzle-kit";
import { neonConfig } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import ws from "ws";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

neonConfig.webSocketConstructor = ws;

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL!,
  },
} satisfies Config;
