// Usage: npm run check [-- id1 id2 …]
// Re-checks finished lessons against today's checks: the examples and the teacher's lessons in data/lessons
// (evaluation lessons are skipped). Checks get stricter over time, and a stored lesson is never re-checked on
// its own. Runs the design checks and plays every step in Chrome, as after a build. Costs nothing: no model calls.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { browserCheck } from "../server/browser-check.ts";
import { checkDesign, lessonSourceFromDir, type Design } from "../server/design.ts";
import { ROOT } from "../server/env.ts";
import { buildLessonHtml } from "../server/lesson.ts";
import { DATA, getDraft } from "../server/pipeline.ts";

type Item = { id: string; kind: "example" | "lesson"; design: Design; js: string };

const only = new Set(process.argv.slice(2));
const items: Item[] = [];
for (const id of readdirSync(join(ROOT, "examples"))) {
  const dir = join(ROOT, "examples", id);
  if (existsSync(join(dir, "design.json"))) items.push({ id, kind: "example", design: JSON.parse(readFileSync(join(dir, "design.json"), "utf8")), js: lessonSourceFromDir(dir) });
}
for (const id of existsSync(DATA) ? readdirSync(DATA) : []) {
  const d = getDraft(id);
  const js = join(DATA, id, "lesson.js");
  if (d?.design && !d.eval && existsSync(js)) items.push({ id, kind: "lesson", design: d.design, js: readFileSync(js, "utf8") });
}

let failed = 0;
for (const item of items.filter((i) => !only.size || only.has(i.id))) {
  const problems: string[] = [];
  for (const e of checkDesign(item.design).errors) problems.push(`${e.level ? `step ${e.level}: ` : ""}${e.message}`);
  const shots = mkdtempSync(join(tmpdir(), "edu-lab-check-"));
  try {
    const r = await browserCheck(buildLessonHtml(item.js, item.design.title), shots);
    problems.push(...r.errors);
    for (const l of r.levels) {
      if (!l.startsUnsolved) problems.push(`step ${l.level} is already solved when it starts`);
      if (!l.solvedViaUi) problems.push(`step ${l.level} could not be solved in the browser`);
    }
    problems.push(...r.layout.map((m) => `layout: ${m}`));
  } finally {
    rmSync(shots, { recursive: true, force: true });
  }
  console.log(`${problems.length ? "PROBLEM" : "ok     "} ${item.kind.padEnd(7)} ${item.id}  (${item.design.title})`);
  for (const p of problems) console.log(`          - ${p}`);
  if (problems.length) failed++;
}
console.log(failed ? `\n${failed} lesson(s) need attention. Fix a lesson with "Request changes" in the app.` : "\nAll lessons pass.");
process.exit(failed ? 1 : 0);
