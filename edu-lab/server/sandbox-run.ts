// Runs inside the sandboxed child process started by sandbox.ts: lesson.js on stdin, a JSON report on stdout.
// The process may read only this file, lesson.ts, html.ts and simkit/core.js, may not write files or start processes,
// and gets no environment variables (so no API key).
import { readFileSync } from "node:fs";
import { loadLesson, validateLesson } from "./lesson.ts";

let out: unknown;
try {
  out = validateLesson(loadLesson(readFileSync(0, "utf8")));
} catch (e) {
  out = { error: (e as Error).message || String(e) };
}
process.stdout.write(JSON.stringify(out));
