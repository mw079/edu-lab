// Minimal .env loader: KEY=VALUE lines, no shell expansion. Existing process env wins.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/** Where lessons, thumbnails and trash are kept (EDU_DATA_DIR lets tests use a temporary folder). */
export const DATA_ROOT = process.env.EDU_DATA_DIR || join(ROOT, "data");

const file = join(ROOT, ".env");
if (existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith("#")) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

export const config = {
  port: Number(process.env.PORT || 8787),
  /** 0.0.0.0 on a host (Dockerfile); only this computer otherwise. */
  host: process.env.HOST || "127.0.0.1",
  /** When set, the teacher app and API ask for this password (the website and its example lessons stay open). */
  password: process.env.EDU_PASSWORD || "",
  /** When set, at most this many model runs (new lessons, changes, retries) a day. */
  dailyLimit: Number(process.env.EDU_DAILY_LIMIT || 0),
  /** When set, a lesson a teacher created is erased this many minutes after anyone last opened or changed it. */
  lessonMinutes: Number(process.env.EDU_LESSON_MINUTES || 0),
  fireworksKey: process.env.FIREWORKS_API_KEY || "",
  model: process.env.FIREWORKS_MODEL || "accounts/fireworks/models/glm-5p3-flash",
};
