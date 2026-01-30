import path from "node:path";
import * as dotenv from "dotenv";
import fs from "node:fs";

// Load environment variables before any other imports
export const currentEnv = (process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
const envPaths = [
  `.env.${currentEnv}.local`,
  `.env.local`,
  `.env.${currentEnv}`,
  `.env`,
].map((f) => path.resolve(process.cwd(), f));

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}
