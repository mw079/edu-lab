// Usage: npm run generate -- "Teacher request" [--audience "High school"]
// Runs plan -> design -> scene without teacher review and prints what happened.
import { newDraft, runAll, DATA } from "../server/pipeline.ts";
import { join } from "node:path";

const args = process.argv.slice(2);
const ai = args.indexOf("--audience");
const audience = ai >= 0 ? args.splice(ai, 2)[1] : "High school";
const request = args.join(" ").trim();
if (!request) {
  console.error('Usage: npm run generate -- "Teacher request" [--audience "High school"]');
  process.exit(2);
}

const started = Date.now();
const d = await runAll(newDraft(request, audience));
for (const l of d.log) console.log(`  ${l.stage.padEnd(6)} ${String(Math.round((l.ms || 0) / 1000)).padStart(4)} s  ${l.tokens ?? "?"} tokens  ${l.what}`);
console.log(`\n${d.status === "ready" ? "READY" : "FAILED"}: ${d.plan?.title || request}  (${Math.round((Date.now() - started) / 1000)} s, components: ${d.plan?.components.join(", ") || "-"})`);
if (d.error) console.log(d.error);
for (const w of d.warnings || []) console.log(`  warning${w.level ? ` (level ${w.level})` : ""}: ${w.message}`);
console.log(join(DATA, d.id));
process.exit(d.status === "ready" ? 0 : 1);
