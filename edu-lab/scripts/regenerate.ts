// Usage: npm run regenerate -- <lesson-id> [more ids] [--from design|build]
// Re-runs the pipeline for the named lessons only (default: from "design", keeping the approved plan).
// "--from build" redraws the simulation and keeps the steps. Lessons are run one at a time to stay
// under the API rate limit; each lesson's folder is backed up to data/backups/ first.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DATA, getDraft, runAll, type Stage } from "../server/pipeline.ts";

const args = process.argv.slice(2);
const fi = args.indexOf("--from");
const from = (fi >= 0 ? args.splice(fi, 2)[1] : "design") as Stage;
const ids = args;
if (!ids.length || !["design", "build"].includes(from)) {
  console.error("Usage: npm run regenerate -- <lesson-id> [more ids] [--from design|build]");
  process.exit(2);
}

let failed = 0;
for (const id of ids) {
  const d = getDraft(id);
  if (!d?.plan) {
    console.log(`skip ${id}: no such lesson, or it has no approved plan`);
    failed++;
    continue;
  }
  const backup = join(DATA, "..", "backups", `${id}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  mkdirSync(backup, { recursive: true });
  cpSync(join(DATA, id), backup, { recursive: true });
  const started = Date.now();
  const r = await runAll(d, from);
  const layout = r.check?.layout?.length ? ` (${r.check.layout.length} layout warnings)` : "";
  console.log(`${r.status === "ready" ? "ready " : "FAILED"} ${id}  ${Math.round((Date.now() - started) / 1000)} s${layout}${r.error ? `\n  ${r.error}` : ""}\n  backup: ${backup}`);
  if (r.status !== "ready") failed++;
}
process.exit(failed ? 1 : 0);
