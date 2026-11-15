// Lesson generation in three model steps, each followed by automatic checks and up to two fix rounds:
//   1. plan   – request -> title, idea, objectives, components         (teacher approves)
//   2. design – plan -> design.json: data + expressions, 5 levels      (logic validated; teacher approves)
//   3. scene  – design -> scene function using the chosen components   (played in headless Chrome)
// Drafts live in data/lessons/<id>/ (draft.json, design.json, scene.js, lesson.js, llm/ replies, screenshots/).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { ROOT } from "./env.ts";
import { chat, extractJson, type Message, type Part } from "./llm.ts";
import { catalog, catalogSummary, snippet, snippetApi } from "./catalog.ts";
import { assembleLesson, checkDesign, type Design, type Issue } from "./design.ts";
import { buildLessonHtml, loadLesson } from "./lesson.ts";
import { browserCheck } from "./browser-check.ts";
import { cleanText, sourceBlock, type Source } from "./source.ts";

export const DATA = join(ROOT, "data", "lessons");
const MAX_FIX_ROUNDS = 2;
const MAX_DESIGN_FIX_ROUNDS = 3; // the steps involve arithmetic the model often needs a second look at
const MAX_REVIEW_ROUNDS = 1; // visual review findings are suggestions: one fix attempt, never blocking

export type ReviewIssue = { step?: number; problem: string; fix?: string };
export type Plan = { title: string; audience: string; idea: string; objectives: string[]; components: string[]; fit?: string; note?: string };
export type Stage = "plan" | "design" | "build";
type LogStage = Stage | "review";
export type Draft = {
  id: string;
  createdAt: string;
  request: string;
  audience: string;
  status: "working" | "planned" | "designed" | "ready" | "failed";
  stage: Stage; // the stage that is running, or the last one that ran
  activity?: string; // what is happening right now, for the UI
  source?: Source; // pasted text the lesson is based on
  plan?: Plan;
  design?: Design;
  warnings?: Issue[];
  check?: { ok: boolean; errors: string[]; layout: string[]; levels: { level: number; startsUnsolved: boolean; solvedViaUi: boolean }[] };
  review?: { issues: ReviewIssue[]; fixed: boolean; found?: ReviewIssue[]; note?: string }; // issues = what remains; found = before the fix
  eval?: string; // evaluation run id: hidden from the teacher app
  error?: string;
  log: { at: string; stage: LogStage; what: string; ms?: number; tokens?: number }[];
};

// ---------- Storage ----------

const dirOf = (id: string) => join(DATA, id);
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");
const fill = (template: string, vars: Record<string, string>) => template.replace(/\{\{(\w+)\}\}/g, (m, k: string) => vars[k] ?? m);

export function saveDraft(d: Draft) {
  mkdirSync(dirOf(d.id), { recursive: true });
  writeFileSync(join(dirOf(d.id), "draft.json"), JSON.stringify(d, null, 2));
}

export function getDraft(id: string): Draft | null {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const f = join(dirOf(id), "draft.json");
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as Draft) : null;
}

export function listDrafts(): Draft[] {
  if (!existsSync(DATA)) return [];
  return readdirSync(DATA)
    .map((id) => getDraft(id))
    .filter((d): d is Draft => Boolean(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function newDraft(request: string, audience: string, sourceText?: string): Draft {
  const slug = request.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "lesson";
  const d: Draft = { id: `${slug}-${randomUUID().slice(0, 6)}`, createdAt: new Date().toISOString(), request, audience, status: "working", stage: "plan", log: [] };
  if (sourceText?.trim()) d.source = { text: cleanText(sourceText) };
  saveDraft(d);
  return d;
}

// ---------- Running a stage ----------

const running = new Set<string>();

/** Run one stage in the background; the draft records progress and errors. Returns false if busy. */
export function runStage(d: Draft, stage: Stage, opts: { objectives?: string[]; note?: string } = {}): boolean {
  if (running.has(d.id)) return false;
  running.add(d.id);
  Object.assign(d, { status: "working", stage, error: undefined, activity: "Starting…" });
  saveDraft(d);
  const work = stage === "plan" ? plan(d) : stage === "design" ? design(d, opts) : build(d);
  work
    .catch((err: Error) => Object.assign(d, { status: "failed", error: err.message }))
    .finally(() => {
      d.activity = undefined;
      saveDraft(d);
      running.delete(d.id);
    });
  return true;
}

/** Run every stage in order without teacher review (CLI and evaluation). */
export async function runAll(d: Draft, from: Stage = "plan"): Promise<Draft> {
  const stages: Stage[] = ["plan", "design", "build"];
  for (const stage of stages.slice(stages.indexOf(from))) {
    Object.assign(d, { status: "working", stage });
    try {
      await (stage === "plan" ? plan(d) : stage === "design" ? design(d, {}) : build(d));
    } catch (err) {
      Object.assign(d, { status: "failed", error: (err as Error).message });
    }
    d.activity = undefined;
    saveDraft(d);
    if (d.status === "failed") break;
  }
  return d;
}

let replyCount = 0;
// How long the model may think per step. Unlimited thinking used the whole budget without answering.
const EFFORT: Record<LogStage, "low" | "medium"> = { plan: "low", design: "medium", build: "medium", review: "low" };

async function ask(d: Draft, stage: LogStage, what: string, messages: Message[]): Promise<string> {
  d.activity = what;
  saveDraft(d);
  let r = await chat(messages, { maxTokens: 24000, temperature: 0.3, reasoningEffort: EFFORT[stage] });
  if (!r.text.trim()) {
    // Thought until the token limit without answering: ask again with less thinking.
    d.log.push({ at: new Date().toISOString(), stage, what: `${what}: empty reply, retrying with less thinking`, ms: r.ms, tokens: r.usage.completion_tokens });
    r = await chat(messages, { maxTokens: 24000, temperature: 0.3, reasoningEffort: "low" });
  }
  const llmDir = join(dirOf(d.id), "llm");
  mkdirSync(llmDir, { recursive: true });
  writeFileSync(join(llmDir, `${Date.now()}-${++replyCount}-${stage}.txt`), `${r.reasoning ? `--- reasoning ---\n${r.reasoning}\n\n` : ""}--- reply ---\n${r.text}`);
  d.log.push({ at: new Date().toISOString(), stage, what, ms: r.ms, tokens: r.usage.completion_tokens });
  if (!r.text.trim()) throw new Error(`The model returned an empty reply (${what})`);
  return r.text;
}

const issueList = (issues: Issue[]) => issues.map((i) => `- ${i.level ? `level ${i.level}: ` : ""}${i.message}`).join("\n");

// ---------- 1. Plan ----------

async function plan(d: Draft) {
  const messages: Message[] = [
    { role: "system", content: fill(read("prompts", "plan.md"), { CATALOG: catalogSummary() }) },
    { role: "user", content: [`Audience: ${d.audience || "not specified"}`, `Teacher request: ${d.request}`, d.source ? sourceBlock(d.source) : ""].filter(Boolean).join("\n\n") },
  ];
  const known = new Set(catalog().map((c) => c.id));
  for (let round = 0; ; round++) {
    const text = await ask(d, "plan", round ? "Fixing the plan" : "Planning objectives and components", messages);
    let problem = "";
    try {
      const p = extractJson<Plan>(text);
      p.components = (p.components || []).filter((c) => known.has(c));
      if (!p.title || !p.objectives?.length) problem = "title and objectives are required";
      else if (!p.components.some((c) => c !== "draw")) problem = `choose at least one component from: ${[...known].join(", ")}`;
      else {
        d.plan = p;
        d.status = "planned";
        return;
      }
    } catch (e) {
      problem = `reply was not valid JSON (${(e as Error).message})`;
    }
    if (round >= MAX_FIX_ROUNDS) throw new Error(`Planning failed: ${problem}`);
    messages.push({ role: "assistant", content: text }, { role: "user", content: `Problem: ${problem}. Reply with the corrected JSON object only.` });
  }
}

// ---------- 2. Design ----------

async function design(d: Draft, opts: { objectives?: string[]; note?: string }) {
  if (!d.plan) throw new Error("Plan the lesson first");
  if (opts.objectives?.length) d.plan.objectives = opts.objectives;
  const components = [...new Set(d.plan.components)];
  const example = read("examples", "momentum", "design.json");
  const messages: Message[] = [
    {
      role: "system",
      content: fill(read("prompts", "design.md"), {
        COMPONENTS: components.map((id) => `### ${id}\n${snippetApi(id)}`).join("\n\n"),
        EXAMPLE: example,
      }),
    },
    {
      role: "user",
      content: [
        `Teacher request: ${d.request}`,
        `Approved plan:\n${JSON.stringify(d.plan, null, 2)}`,
        d.source ? sourceBlock(d.source, 6000) : "",
        opts.note ? `Teacher's note on the previous version: ${opts.note}` : "",
        "Write the lesson design JSON.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
  let last: Issue[] = [];
  for (let round = 0; ; round++) {
    const text = await ask(d, "design", round ? `Fixing ${last.length} problem${last.length === 1 ? "" : "s"} in the levels (round ${round})` : "Designing the five steps", messages);
    let candidate: Design | null = null;
    try {
      candidate = extractJson<Design>(text);
      candidate.components = components;
      candidate.objectives = d.plan.objectives;
      candidate.audience ||= d.plan.audience;
      // A hidden readout must be among the shown ones; repair that instead of sending it back.
      for (const lv of candidate.levels || []) {
        if (lv.hide?.length && Array.isArray(lv.show)) lv.show = [...new Set([...lv.hide, ...lv.show])].slice(0, 3);
      }
      d.activity = "Checking the levels";
      const { errors, warnings } = checkDesign(candidate);
      last = errors;
      d.warnings = warnings;
    } catch (e) {
      last = [{ message: `The reply was not a valid JSON object: ${(e as Error).message}` }];
    }
    if (candidate && !last.length) {
      d.design = candidate;
      writeFileSync(join(dirOf(d.id), "design.json"), JSON.stringify(candidate, null, 2));
      d.status = "designed";
      return;
    }
    if (round >= MAX_DESIGN_FIX_ROUNDS) throw new Error(`The levels still have problems after ${round + 1} attempts:\n${issueList(last)}`);
    messages.push({ role: "assistant", content: text }, { role: "user", content: `The automatic checks found these problems:\n${issueList(last)}\n\nFix them and reply with the complete corrected JSON object only.` });
  }
}

// ---------- 3. Scene ----------

function extractCode(text: string): string {
  const fenced = text.match(/```(?:js|javascript)?\s*([\s\S]*?)```/);
  let code = (fenced ? fenced[1] : text).trim();
  code = code.replace(/^(?:const|let|var)\s+\w+\s*=\s*/, "").replace(/^scene\s*:\s*/, "").replace(/;\s*$/, "");
  if (!/^(function\b|\(?\s*stage\b)/.test(code)) throw new Error("The reply must be a single function (stage, kit) { … }");
  return code;
}

function sceneBrief(design: Design) {
  return {
    state: design.state,
    controls: design.controls.map((c) => c.key),
    derived: (design.derived || []).map((x) => `${x.key} = ${x.expr}`),
    readouts: (design.readouts || []).map((r) => r.key),
    actions: (design.actions || []).map((a) => a.id),
    levels: design.levels.map((l, i) => ({ level: i + 1, goal: l.goal, setup: l.setup, hide: l.hide })),
  };
}

type Attempt = { scene: string; js: string; report: Awaited<ReturnType<typeof browserCheck>> };

/** Assemble a scene reply into a lesson and play it in Chrome. Throws if the reply is not usable code. */
async function tryScene(d: Draft, design: Design, text: string, shotsDir: string): Promise<Attempt> {
  const scene = extractCode(text);
  const js = assembleLesson(design, scene);
  loadLesson(js); // syntax
  d.activity = "Playing every step in Chrome";
  saveDraft(d);
  rmSync(shotsDir, { recursive: true, force: true });
  const report = await browserCheck(buildLessonHtml(js, design.title), shotsDir);
  return { scene, js, report };
}

const blockingProblems = (r: Attempt["report"]) => [...r.errors, ...r.levels.filter((l) => !l.solvedViaUi).map((l) => `level ${l.level} could not be solved in the browser`)];
const problemList = (p: string[]) => p.map((x) => `- ${x}`).join("\n");

/** The conversation that asks the model for the scene function. */
function sceneMessages(d: Draft, design: Design): Message[] {
  const components = [...new Set([...(design.components || []), "draw"])];
  const example = JSON.parse(read("examples", "momentum", "design.json")) as Design;
  return [
    {
      role: "system",
      content: fill(read("prompts", "scene.md"), {
        COMPONENTS: components.map((id) => `### ${id}\n\`\`\`js\n${snippet(id)}\`\`\``).join("\n\n"),
        EXAMPLE_SUMMARY: JSON.stringify(sceneBrief(example)),
        EXAMPLE_SCENE: read("examples", "momentum", "scene.js"),
      }),
    },
    { role: "user", content: `Lesson: ${design.title}\nIdea: ${d.plan?.idea || ""}\n\nDesign:\n${JSON.stringify(sceneBrief(design), null, 2)}\n\nWrite the scene function.` },
  ];
}

/** Whether the visual review runs (EDU_REVIEW=off turns it off, e.g. for comparisons). */
const reviewEnabled = () => process.env.EDU_REVIEW !== "off";

async function build(d: Draft) {
  if (!d.design) throw new Error("Design the levels first");
  const design = d.design;
  const shots = (name: string) => join(dirOf(d.id), name);
  const messages = sceneMessages(d, design);

  // 1. Draw, then fix until it plays in Chrome without errors (layout problems get the same rounds).
  let accepted: Attempt | null = null;
  for (let round = 0; ; round++) {
    const text = await ask(d, "build", round ? `Fixing the simulation (round ${round})` : "Drawing the simulation", messages);
    let problems: string[];
    try {
      const a = await tryScene(d, design, text, shots("screenshots"));
      problems = [...blockingProblems(a.report), ...a.report.layout.slice(0, 8)];
      // Layout problems do not block a lesson that works once the rounds are used up.
      if (a.report.ok && (!a.report.layout.length || round >= MAX_FIX_ROUNDS)) {
        accepted = a;
        messages.push({ role: "assistant", content: text });
        break;
      }
    } catch (e) {
      problems = [(e as Error).message];
    }
    if (round >= MAX_FIX_ROUNDS) throw new Error(`The simulation still fails after ${round + 1} attempts:\n${problemList(problems)}`);
    messages.push({ role: "assistant", content: text }, { role: "user", content: `Running the lesson in a browser found these problems (positions are in stage units, 1000 × 560):\n${problemList(problems)}\n\nFix the scene function and reply with the complete function in one js code block.` });
  }

  // 2. Visual review of the step screenshots (suggestions, see reviewAndFix).
  if (reviewEnabled()) accepted = await reviewAndFix(d, design, messages, accepted);

  const r = accepted.report;
  d.check = { ok: r.ok, errors: r.errors, layout: r.layout, levels: r.levels.map(({ level, startsUnsolved, solvedViaUi }) => ({ level, startsUnsolved, solvedViaUi })) };
  writeFileSync(join(dirOf(d.id), "scene.js"), accepted.scene + "\n");
  writeFileSync(join(dirOf(d.id), "lesson.js"), accepted.js);
  d.status = "ready";
}

// ---------- Visual review ----------

/**
 * Review the accepted simulation's step screenshots; one fix round, kept only if the lesson still works,
 * has no more layout problems and a second review finds fewer problems. Returns the version to keep.
 */
async function reviewAndFix(d: Draft, design: Design, messages: Message[], accepted: Attempt): Promise<Attempt> {
  const issues = await visualReview(d, design, accepted.report.stageShots);
  d.review = { issues, fixed: false };
  for (let round = 0; issues.length && round < MAX_REVIEW_ROUNDS; round++) {
    messages.push({
      role: "user",
      content: `A reviewer looked at screenshots of the drawing at the start of each step and found:\n${problemList(issues.map((i) => `${i.step ? `step ${i.step}: ` : ""}${i.problem}${i.fix ? ` (suggested: ${i.fix})` : ""}`))}\n\nFix the problems that are real; keep everything else as it is. Reply with the complete function in one js code block.`,
    });
    const text = await ask(d, "build", "Fixing what the visual review found", messages);
    try {
      const a = await tryScene(d, design, text, join(dirOf(d.id), "screenshots-review"));
      if (!a.report.ok || a.report.layout.length > accepted.report.layout.length) {
        d.review.note = "The fix was not kept: it broke the lesson or added layout problems.";
      } else {
        // Look again: keep the fix only if it leaves fewer problems than it set out to fix.
        const after = await visualReview(d, design, a.report.stageShots);
        if (after.length < issues.length) {
          accepted = a;
          d.review = { issues: after, fixed: true, found: issues };
        } else d.review.note = `The fix was not kept: the review still found ${after.length} problem(s).`;
      }
    } catch (e) {
      d.review.note = `The fix was not kept: ${(e as Error).message}`;
    }
  }
  return accepted;
}

/** Run only the visual review (and its fix round) on a finished lesson's current simulation. */
export async function reviewExisting(d: Draft): Promise<void> {
  if (!d.design || !existsSync(join(dirOf(d.id), "scene.js"))) throw new Error("No finished simulation to review");
  const scene = readFileSync(join(dirOf(d.id), "scene.js"), "utf8").trim();
  const messages = [...sceneMessages(d, d.design), { role: "assistant" as const, content: "```js\n" + scene + "\n```" }];
  const accepted = await tryScene(d, d.design, messages[messages.length - 1].content as string, join(dirOf(d.id), "screenshots"));
  if (!accepted.report.ok) throw new Error("The current simulation does not pass the browser check");
  const kept = await reviewAndFix(d, d.design, messages, accepted);
  writeFileSync(join(dirOf(d.id), "scene.js"), kept.scene + "\n");
  writeFileSync(join(dirOf(d.id), "lesson.js"), kept.js);
  d.activity = undefined;
  saveDraft(d);
}


/** Ask the vision model what a student would notice in the step screenshots. Never throws: no review = no issues. */
async function visualReview(d: Draft, design: Design, images: string[]): Promise<ReviewIssue[]> {
  if (!images.length) return [];
  const label = (key: string) => design.readouts?.find((r) => r.key === key)?.label || key;
  // Say what the student changes in each step, so a picture that is not yet at the target is not reported.
  const changes = (l: Design["levels"][number]) => {
    const free = design.controls.filter((c) => !(l.lock || []).includes(c.key)).map((c) => c.label);
    if (l.ask) return "the student types an answer; the picture shows the situation described";
    return free.length ? `the student will change: ${free.join(", ")}` : "";
  };
  const steps = design.levels
    .map((l, i) => `Step ${i + 1}: ${l.goal} [${changes(l)}]${l.hide?.length ? ` (hidden: ${l.hide.map(label).join(", ")})` : ""}`)
    .join("\n");
  const content: Part[] = [{ type: "text", text: `Lesson: ${design.title}\n${steps}\n\nScreenshots follow, one per step.` }];
  images.forEach((file, i) => {
    content.push({ type: "text", text: `Step ${i + 1}:` }, { type: "image_url", image_url: { url: `data:image/png;base64,${readFileSync(file).toString("base64")}` } });
  });
  try {
    const text = await ask(d, "review", "Reviewing the screenshots", [
      { role: "system", content: fill(read("prompts", "review.md"), { AUDIENCE: (d.audience || "high school").toLowerCase() }) },
      { role: "user", content },
    ]);
    const issues = extractJson<{ issues?: ReviewIssue[] }>(text).issues || [];
    return issues.filter((i) => i && typeof i.problem === "string" && i.problem.trim()).slice(0, 5);
  } catch (e) {
    d.log.push({ at: new Date().toISOString(), stage: "review", what: `Visual review skipped: ${(e as Error).message}` });
    return [];
  }
}

/** Review the finished lesson again (evaluation: which problems remain after the fix round). */
export async function reviewFinal(d: Draft): Promise<ReviewIssue[]> {
  if (!d.design || !existsSync(join(dirOf(d.id), "lesson.js"))) return [];
  const dir = join(dirOf(d.id), "screenshots-final");
  rmSync(dir, { recursive: true, force: true });
  const report = await browserCheck(buildLessonHtml(readFileSync(join(dirOf(d.id), "lesson.js"), "utf8"), d.design.title), dir);
  return visualReview(d, d.design, report.stageShots);
}

/** Drafts left "working" by a stopped server can never finish; mark them failed so they can be retried. */
export function recoverInterrupted() {
  for (const d of listDrafts()) {
    if (d.status === "working") saveDraft(Object.assign(d, { status: "failed", error: "Interrupted because the server restarted. Press Try again.", activity: undefined }));
  }
}
