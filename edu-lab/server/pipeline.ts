// Lesson generation in three model steps, each followed by automatic checks and up to two fix rounds:
//   1. plan   – request -> title, idea, objectives, components         (teacher approves)
//   2. design – plan -> design.json: data + expressions, 5 levels      (logic validated; teacher approves)
//   3. scene  – design -> scene function using the chosen components   (played in headless Chrome)
// The built lesson is a preview ("built") until the teacher approves it ("ready"). Before that, or later, the
// teacher can ask for changes (revise): the model decides whether the picture or the steps change, and the new
// version replaces the old one only if it passes every check (the old one is kept in previous/ for Undo).
// Drafts live in data/lessons/<id>/ (draft.json, design.json, scene.js, lesson.js, llm/ replies, screenshots/).
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DATA_ROOT, ROOT } from "./env.ts";
import { chat, extractJson, type Message, type Part } from "./llm.ts";
import { catalog, catalogSummary, snippet, snippetApi } from "./catalog.ts";
import { assembleLesson, checkDesign, type Design, type Issue } from "./design.ts";
import { buildLessonHtml } from "./lesson.ts";
import { checkLesson } from "./sandbox.ts";
import { browserCheck } from "./browser-check.ts";
import { cleanText, sourceBlock, type Source } from "./source.ts";

export const DATA = join(DATA_ROOT, "lessons");
const MAX_FIX_ROUNDS = 2;
const MAX_DESIGN_FIX_ROUNDS = 3; // the steps involve arithmetic the model often needs a second look at
const MAX_REVIEW_ROUNDS = 1; // visual review findings are suggestions: one fix attempt, never blocking

export type ReviewIssue = { step?: number; problem: string; fix?: string };
export type Plan = { title: string; audience: string; idea: string; objectives: string[]; components: string[]; fit?: string; note?: string };
export type Stage = "plan" | "design" | "build" | "revise";
/** A teacher's change request after previewing the lesson, and what came of it. */
export type Revision = { at: string; note: string; step?: number; change?: "picture" | "steps"; applied: boolean; message: string; from?: "built" | "ready" };
type LogStage = Stage | "review";
export type Draft = {
  id: string;
  createdAt: string;
  request: string;
  audience: string;
  status: "working" | "planned" | "designed" | "built" | "ready" | "failed"; // built = preview, ready = approved
  stage: Stage; // the stage that is running, or the last one that ran
  activity?: string; // what is happening right now, for the UI
  source?: Source; // pasted text the lesson is based on
  plan?: Plan;
  design?: Design;
  warnings?: Issue[];
  check?: { ok: boolean; errors: string[]; layout: string[]; levels: { level: number; startsUnsolved: boolean; solvedViaUi: boolean }[] };
  review?: { issues: ReviewIssue[]; fixed: boolean; found?: ReviewIssue[]; note?: string }; // issues = what remains; found = before the fix
  version?: number; // goes up whenever lesson.js changes (the app reloads the preview)
  revisions?: Revision[];
  notice?: { applied: boolean; text: string }; // the outcome of the last change request, until approved
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

/**
 * Remove a draft or finished lesson from the app. The folder is moved to data/trash/ rather than erased, so a
 * lesson deleted by mistake can be put back by hand.
 */
export function deleteDraft(id: string): "ok" | "missing" | "busy" {
  if (!getDraft(id)) return "missing";
  if (running.has(id)) return "busy";
  const trash = join(DATA_ROOT, "trash");
  mkdirSync(trash, { recursive: true });
  renameSync(dirOf(id), join(trash, `${id}-${Date.now()}`));
  return "ok";
}

/** Run one stage in the background; the draft records progress and errors. Returns false if busy. */
export function runStage(d: Draft, stage: Stage, opts: { objectives?: string[]; note?: string; step?: number } = {}): boolean {
  if (running.has(d.id)) return false;
  running.add(d.id);
  const was = d.status;
  Object.assign(d, { status: "working", stage, error: undefined, activity: "Starting…" });
  saveDraft(d);
  const work = stage === "plan" ? plan(d) : stage === "design" ? design(d, opts) : stage === "build" ? build(d) : reviseLesson(d, { ...opts, was });
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
  // Nobody previews a lesson made from the command line: approve it.
  if (d.status === "built") saveDraft(Object.assign(d, { status: "ready" }));
  return d;
}

let replyCount = 0;
// How long the model may think per step. Unlimited thinking used the whole budget without answering.
const EFFORT: Record<LogStage, "low" | "medium"> = { plan: "low", design: "medium", build: "medium", revise: "medium", review: "low" };

// The review's fix is a small edit to a working scene and is optional: little thinking, and give up after 45 s.
const REVIEW_FIX = { reasoningEffort: "low", timeoutMs: 45_000, retries: 0 } as const;

async function ask(d: Draft, stage: LogStage, what: string, messages: Message[], opts: { reasoningEffort?: "low" | "medium"; timeoutMs?: number; retries?: number } = {}): Promise<string> {
  d.activity = what;
  saveDraft(d);
  let r = await chat(messages, { maxTokens: 24000, temperature: 0.3, reasoningEffort: EFFORT[stage], ...opts });
  if (!r.text.trim()) {
    // Thought until the token limit without answering: ask again with less thinking.
    d.log.push({ at: new Date().toISOString(), stage, what: `${what}: empty reply, retrying with less thinking`, ms: r.ms, tokens: r.usage.completion_tokens });
    r = await chat(messages, { maxTokens: 24000, temperature: 0.3, ...opts, reasoningEffort: "low" }); // keeps a caller's time limit
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
  const candidate = await writeDesign(d, "design", opts);
  d.design = candidate;
  writeFileSync(join(dirOf(d.id), "design.json"), JSON.stringify(candidate, null, 2));
  d.status = "designed";
}

/** Ask for the design JSON and fix it until it passes checkDesign. Returns it without saving it. */
async function writeDesign(d: Draft, stage: LogStage, opts: { objectives?: string[]; note?: string }): Promise<Design> {
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
        // The note refers to the previous steps ("make step 2 easier"), so the model needs to see them.
        opts.note && d.design ? `Previous version of the design (change what the note asks for; keep the rest):\n${JSON.stringify(d.design, null, 2)}` : "",
        opts.note ? `Teacher's note on the previous version: ${opts.note}` : "",
        "Write the lesson design JSON.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
  let last: Issue[] = [];
  for (let round = 0; ; round++) {
    const text = await ask(d, stage, round ? `Fixing ${last.length} problem${last.length === 1 ? "" : "s"} in the levels (round ${round})` : "Designing the five steps", messages);
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
    if (candidate && !last.length) return candidate;
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
  checkLesson(js); // loads in the sandbox: throws on syntax errors or code that never finishes
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
  const messages = sceneMessages(d, design);
  let accepted = await drawScene(d, design, messages, "build");
  // Visual review of the step screenshots (suggestions, see reviewAndFix).
  if (reviewEnabled()) accepted = await reviewAndFix(d, design, messages, accepted);
  saveVersion(d, design, accepted);
  // A new build replaces the lesson: an Undo or a change notice from before would refer to something else.
  rmSync(previousDir(d.id), { recursive: true, force: true });
  d.notice = undefined;
  d.status = "built";
}

/**
 * Get a scene that plays in Chrome: draw, then fix until it works (layout problems get the same rounds but do
 * not block a working lesson once they are used up). `first` is an existing scene to try before asking the model.
 */
async function drawScene(d: Draft, design: Design, messages: Message[], stage: LogStage, opts: { first?: string; what?: string } = {}): Promise<Attempt> {
  for (let round = 0; ; round++) {
    const text = round === 0 && opts.first ? "```js\n" + opts.first + "\n```" : await ask(d, stage, round ? `Fixing the simulation (round ${round})` : opts.what || "Drawing the simulation", messages);
    let problems: string[];
    try {
      const a = await tryScene(d, design, text, join(dirOf(d.id), "screenshots"));
      problems = [...blockingProblems(a.report), ...a.report.layout.slice(0, 8)];
      if (a.report.ok && (!a.report.layout.length || round >= MAX_FIX_ROUNDS)) {
        messages.push({ role: "assistant", content: text });
        return a;
      }
    } catch (e) {
      problems = [(e as Error).message];
    }
    if (round >= MAX_FIX_ROUNDS) throw new Error(`The simulation still fails after ${round + 1} attempts:\n${problemList(problems)}`);
    messages.push({ role: "assistant", content: text }, { role: "user", content: `Running the lesson in a browser found these problems (positions are in stage units, 1000 × 560):\n${problemList(problems)}\n\nFix the scene function and reply with the complete function in one js code block.` });
  }
}

/** Make a checked design + scene the lesson's current version. */
function saveVersion(d: Draft, design: Design, a: Attempt) {
  const dir = dirOf(d.id);
  const r = a.report;
  d.design = design;
  d.check = { ok: r.ok, errors: r.errors, layout: r.layout, levels: r.levels.map(({ level, startsUnsolved, solvedViaUi }) => ({ level, startsUnsolved, solvedViaUi })) };
  d.version = (d.version || 0) + 1;
  writeFileSync(join(dir, "design.json"), JSON.stringify(design, null, 2));
  writeFileSync(join(dir, "scene.js"), a.scene + "\n");
  writeFileSync(join(dir, "lesson.js"), a.js);
  // The screenshots were only needed for the checks; a failed build keeps them for debugging.
  for (const name of ["screenshots", "screenshots-review"]) rmSync(join(dir, name), { recursive: true, force: true });
}

// ---------- 4. Teacher's change requests (after the preview) ----------

const VERSION_FILES = ["design.json", "scene.js", "lesson.js"];
const previousDir = (id: string) => join(dirOf(id), "previous");
export const hasPrevious = (id: string) => existsSync(join(previousDir(id), "meta.json"));

/**
 * Carry out a teacher's change request. The model first decides whether only the picture changes (redraw the
 * scene, keep the steps) or the steps change (rewrite the design, then try the current scene with it before
 * redrawing). The visual review then looks at the result, as after a build: a change easily undoes what it
 * fixed (labels that give a step's answer away). The result replaces the lesson only if it passes every check,
 * adds no layout problems and the review finds no more problems than in the current version; otherwise the
 * lesson stays as it was and the notice says why. Never throws for a failed change.
 */
export async function reviseLesson(d: Draft, opts: { note?: string; step?: number; was?: Draft["status"] }) {
  const note = (opts.note || "").trim();
  if (!note) throw new Error("Describe the change you want");
  if (!d.design || !existsSync(join(dirOf(d.id), "scene.js"))) throw new Error("Build the lesson first");
  const was = opts.was === "ready" ? "ready" : "built";
  const step = opts.step && d.design.levels[opts.step - 1] ? opts.step : undefined;
  const about = step ? ` about step ${step} ("${d.design.levels[step - 1].title}")` : "";
  const rev: Revision = { at: new Date().toISOString(), note, step, applied: false, message: "", from: was };
  d.revisions = [...(d.revisions || []), rev];
  d.notice = undefined;
  const warnings = d.warnings;
  const review = d.review;
  try {
    rev.change = await whatChanges(d, note, step);
    const scene = readFileSync(join(dirOf(d.id), "scene.js"), "utf8").trim();
    let design = d.design;
    let messages: Message[];
    let attempt: Attempt;
    if (rev.change === "steps") {
      design = await writeDesign(d, "revise", { note: `${step ? `(About step ${step}.) ` : ""}${note}` });
      // The current drawing often still fits the new steps: try it before asking for a new one.
      messages = sceneMessages(d, design);
      attempt = await drawScene(d, design, messages, "revise", { first: scene, what: "Adjusting the simulation to the new steps" });
    } else {
      messages = [
        ...sceneMessages(d, design),
        { role: "assistant", content: "```js\n" + scene + "\n```" },
        {
          role: "user",
          content:
            `The teacher previewed the lesson and asks for this change${about}: "${note}"\n\n` +
            "Change the scene function to do that and keep everything else as it is. In particular keep hiding, in every step, " +
            "everything the current function hides (the values in info.hidden, and anything else from which a student could read " +
            "or work out a hidden value or the answer of a question step). Reply with the complete function in one js code block.",
        },
      ];
      attempt = await drawScene(d, design, messages, "revise", { what: "Changing the simulation" });
    }
    const before = d.check?.layout.length ?? 0;
    if (attempt.report.layout.length > before)
      throw new Error(`The changed lesson had more layout problems than before:\n${problemList(attempt.report.layout.slice(0, 3))}`);
    if (reviewEnabled()) {
      attempt = await reviewAndFix(d, design, messages, attempt);
      const found = d.review?.issues || [];
      if (found.length > (review?.issues.length ?? 0))
        throw new Error(`The visual review found a problem in the changed lesson:\n${problemList(found.slice(0, 2).map((i) => `${i.step ? `step ${i.step}: ` : ""}${i.problem}`))}`);
    }
    keepPrevious(d, review);
    saveVersion(d, design, attempt);
    rev.applied = true;
    rev.message = rev.change === "steps" ? "The steps were rewritten and the lesson passed every check." : "The simulation was redrawn and the lesson passed every check.";
    d.status = "built";
  } catch (e) {
    const [first, second] = (e as Error).message.split("\n");
    rev.message = [first, second?.replace(/^- /, "")].filter(Boolean).join(" ");
    d.warnings = warnings;
    d.review = review;
    d.status = was;
  }
  d.notice = { applied: rev.applied, text: rev.message };
}

/** "picture" when only the drawing changes, "steps" for anything in the steps' text, numbers or controls. */
async function whatChanges(d: Draft, note: string, step?: number): Promise<"picture" | "steps"> {
  const steps = d.design!.levels.map((l, i) => `Step ${i + 1}: ${l.title}. ${l.goal}`).join("\n");
  const text = await ask(d, "revise", "Reading your request", [
    { role: "system", content: read("prompts", "revise.md") },
    { role: "user", content: `Lesson: ${d.design!.title}\n${steps}\n\nTeacher's request${step ? ` about step ${step}` : ""}: ${note}` },
  ], { reasoningEffort: "low" });
  try {
    return extractJson<{ change?: string }>(text).change === "picture" ? "picture" : "steps";
  } catch {
    return "steps"; // the safer choice: it can change anything
  }
}

/** Keep the current version for Undo (one level). */
function keepPrevious(d: Draft, review: Draft["review"]) {
  const dir = previousDir(d.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of VERSION_FILES) if (existsSync(join(dirOf(d.id), f))) cpSync(join(dirOf(d.id), f), join(dir, f));
  writeFileSync(join(dir, "meta.json"), JSON.stringify({ design: d.design, check: d.check, warnings: d.warnings, review }));
}

/** Go back to the version before the last applied change. It needs approving again. */
export function undoRevision(id: string): "ok" | "missing" | "busy" | "nothing" {
  const d = getDraft(id);
  if (!d) return "missing";
  if (running.has(id)) return "busy";
  if (!hasPrevious(id)) return "nothing";
  const dir = previousDir(id);
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")) as Pick<Draft, "design" | "check" | "warnings" | "review">;
  for (const f of VERSION_FILES) if (existsSync(join(dir, f))) cpSync(join(dir, f), join(dirOf(id), f));
  rmSync(dir, { recursive: true, force: true });
  Object.assign(d, meta, { status: "built", version: (d.version || 0) + 1, notice: { applied: true, text: "Back to the version before the last change." } });
  saveDraft(d);
  return "ok";
}

/** The teacher approves the previewed lesson: it appears in the overview. */
export function approveDraft(id: string): "ok" | "missing" | "busy" | "not-built" {
  const d = getDraft(id);
  if (!d) return "missing";
  if (running.has(id)) return "busy";
  if (d.status !== "built") return "not-built";
  saveDraft(Object.assign(d, { status: "ready", notice: undefined }));
  return "ok";
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
    try {
      const text = await ask(d, "build", "Fixing what the visual review found", messages, REVIEW_FIX);
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
      const slow = (e as Error).name === "TimeoutError";
      d.review.note = slow ? "No fix was made: the model took longer than 45 s, so the lesson stays as built." : `The fix was not kept: ${(e as Error).message}`;
      if (slow) d.log.push({ at: new Date().toISOString(), stage: "review", what: "Review fix skipped after 45 s" });
    }
  }
  return accepted;
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
  const issues = await visualReview(d, d.design, report.stageShots);
  rmSync(dir, { recursive: true, force: true });
  return issues;
}

/** Drafts left "working" by a stopped server can never finish; mark them failed so they can be retried. */
export function recoverInterrupted() {
  for (const d of listDrafts()) {
    if (d.status !== "working") continue;
    // A change request never touches the lesson until it has passed: the previewed version is still there.
    if (d.stage === "revise") {
      const from = d.revisions?.at(-1)?.from === "ready" ? "ready" : "built";
      saveDraft(Object.assign(d, { status: from, activity: undefined, notice: { applied: false, text: "Interrupted because the server restarted." } }));
    }
    else saveDraft(Object.assign(d, { status: "failed", error: "Interrupted because the server restarted. Press Try again.", activity: undefined }));
  }
}
