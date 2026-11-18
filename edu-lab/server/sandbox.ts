// Lesson code comes from a model and must not run inside the server: node:vm is not a security boundary
// (a lesson can reach the host's `process` through any object the host hands it), and a check() that loops
// forever would freeze every request. So the logic checks run in a short-lived child process under Node's
// permission model, with a hard time limit and an empty environment.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ValidationReport } from "./lesson.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SANDBOX_TIMEOUT_MS = 5000;

const READABLE = ["server/sandbox-run.ts", "server/lesson.ts", "server/html.ts", "simkit/core.js", "package.json"].map((f) => `--allow-fs-read=${join(ROOT, f)}`);

/** Load lesson.js and run validateLesson on it in the sandbox. Throws if the code does not load or takes too long. */
export function checkLesson(lessonJs: string): ValidationReport {
  const r = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", "--permission", ...READABLE, join(HERE, "sandbox-run.ts")],
    { input: lessonJs, encoding: "utf8", timeout: SANDBOX_TIMEOUT_MS, env: {}, maxBuffer: 8 * 1024 * 1024 },
  );
  if ((r.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT" || r.signal)
    throw new Error(`Running the lesson's expressions took longer than ${SANDBOX_TIMEOUT_MS / 1000} s; one of them probably never finishes (an endless loop)`);
  if (r.error) throw r.error;
  let out: ValidationReport & { error?: string };
  try {
    out = JSON.parse(r.stdout);
  } catch {
    throw new Error(`The lesson check stopped unexpectedly: ${(r.stderr || "").trim().slice(0, 500) || `exit code ${r.status}`}`);
  }
  if (out.error) throw new Error(out.error);
  return out;
}
