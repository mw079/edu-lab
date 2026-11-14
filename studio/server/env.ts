// Minimal .env loader: KEY=VALUE lines, no shell expansion. Existing process env wins.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  fireworksKey: process.env.FIREWORKS_API_KEY || "",
  model: process.env.FIREWORKS_MODEL || "accounts/fireworks/models/glm-5p3-flash",
};
