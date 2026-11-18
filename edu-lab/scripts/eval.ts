// Usage: npm run eval [-- --only id1,id2]
// Runs every request in eval/requests.json through the whole pipeline (one at a time, to stay under the
// API rate limit), reviews each finished lesson once more, and writes data/eval/<run>/results.json and
// summary.md. Evaluation lessons are hidden from the teacher app.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA, newDraft, reviewFinal, runAll, saveDraft as save, type Draft } from "../server/pipeline.ts";

type Request = { id: string; audience: string; request: string; sourceText?: string; note?: string };

const args = process.argv.slice(2);
const oi = args.indexOf("--only");
if (oi >= 0 && !args[oi + 1]) {
  console.error("Usage: npm run eval [-- --only id1,id2]");
  process.exit(2);
}
const only = oi >= 0 ? new Set(args[oi + 1].split(",")) : null;
const requests = (JSON.parse(readFileSync("eval/requests.json", "utf8")) as Request[]).filter((r) => !only || only.has(r.id));
const run = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = join(DATA, "..", "eval", run);
mkdirSync(outDir, { recursive: true });

const fixRounds = (d: Draft, stage: string) => d.log.filter((l) => l.stage === stage && /^Fixing/.test(l.what)).length;
const results = [];
for (const req of requests) {
  const started = Date.now();
  const d = newDraft(req.request, req.audience, req.sourceText);
  d.eval = run;
  save(d);
  await runAll(d);
  const remaining = d.status === "ready" ? await reviewFinal(d) : [];
  save(d);
  const r = {
    id: req.id,
    lesson: d.id,
    audience: req.audience,
    status: d.status,
    title: d.design?.title || d.plan?.title || "",
    components: d.plan?.components || [],
    fit: d.plan?.fit || "",
    seconds: Math.round((Date.now() - started) / 1000),
    tokens: d.log.reduce((n, l) => n + (l.tokens || 0), 0),
    fixRounds: { plan: fixRounds(d, "plan"), design: fixRounds(d, "design"), build: d.log.filter((l) => l.stage === "build" && /^Fixing the simulation/.test(l.what)).length },
    layoutWarnings: d.check?.layout?.length ?? null,
    reviewIssues: d.review?.found || d.review?.issues || [],
    reviewFixed: d.review?.fixed ?? false,
    remainingIssues: remaining,
    error: d.error || "",
  };
  results.push(r);
  console.log(`${r.status === "ready" ? "ready " : "FAILED"} ${r.id.padEnd(11)} ${String(r.seconds).padStart(4)} s  review ${r.reviewIssues.length}→${r.remainingIssues.length}${r.reviewFixed ? " (fixed)" : ""}  ${r.error.split("\n")[0]}`);
}

const ready = results.filter((r) => r.status === "ready");
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const summary = [
  `# Evaluation ${run}`,
  "",
  `Ready: **${ready.length}/${results.length}** · average time ${avg(ready.map((r) => r.seconds))} s · average output tokens ${avg(ready.map((r) => r.tokens))}`,
  `Review issues found ${results.reduce((n, r) => n + r.reviewIssues.length, 0)}, fixed in ${results.filter((r) => r.reviewFixed).length} lessons, remaining after fix ${results.reduce((n, r) => n + r.remainingIssues.length, 0)}`,
  "",
  "| Request | Audience | Status | Time | Fix rounds (plan/steps/sim) | Layout warnings | Review: found → remaining | Fit |",
  "|---|---|---|---|---|---|---|---|",
  ...results.map((r) => `| ${r.id} | ${r.audience} | ${r.status} | ${r.seconds} s | ${r.fixRounds.plan}/${r.fixRounds.design}/${r.fixRounds.build} | ${r.layoutWarnings ?? "–"} | ${r.reviewIssues.length} → ${r.remainingIssues.length}${r.reviewFixed ? " (fixed)" : ""} | ${r.fit} |`),
  "",
  "## Remaining review issues",
  "",
  ...results.flatMap((r) => r.remainingIssues.map((i) => `- **${r.id}** step ${i.step ?? "?"}: ${i.problem}`)),
  ...results.filter((r) => r.error).map((r) => `- **${r.id}** failed: ${r.error.split("\n")[0]}`),
].join("\n");
writeFileSync(join(outDir, "results.json"), JSON.stringify(results, null, 2));
writeFileSync(join(outDir, "summary.md"), summary + "\n");
console.log(`\n${summary}\n\n${outDir}`);
