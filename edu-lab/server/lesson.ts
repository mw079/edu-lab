// Build a lesson HTML file from lesson.js and validate a lesson's logic without a browser.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { escapeHtml } from "./html.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/**
 * The simkit files: core.js first (it defines the kit the others add to), then every other .js file in simkit/.
 * Read from the folder, so a new component file is included without editing a list.
 */
const simkitList = () => ["core.js", ...readdirSync(join(ROOT, "simkit")).filter((f) => f.endsWith(".js") && f !== "core.js").sort()];

const read = (...p: string[]) => readFileSync(join(ROOT, ...p), "utf8");

/**
 * Which file defines each component (`kit.name = ...`); core.js is always included. Read on every build, like
 * the rest of simkit, so a component added while the server runs is found (61 small files: about 2 ms).
 */
const componentFiles = () =>
  new Map(simkitList().slice(1).flatMap((f) => [...read("simkit", f).matchAll(/^\s*kit\.(\w+)\s*=/gm)].map((m) => [m[1], f] as [string, string])));

/** The files `code` needs: core.js plus every file defining a `kit.x` / `simkit.x` it uses, and what those use. */
export function simkitFiles(code: string): string[] {
  const definedIn = componentFiles();
  const files = new Set(["core.js"]);
  const queue = [code];
  while (queue.length) {
    for (const [, name] of queue.pop()!.matchAll(/\b(?:kit|simkit)\.(\w+)/g)) {
      const f = definedIn.get(name);
      if (f && !files.has(f)) files.add(f), queue.push(read("simkit", f));
    }
  }
  return simkitList().filter((f) => files.has(f));
}

/** simkit for a page: only the files `code` uses, or the whole library when no code is given. */
export function simkitSource(code?: string): string {
  return (code === undefined ? simkitList() : simkitFiles(code)).map((f) => `/* ---- simkit/${f} ---- */\n${read("simkit", f)}`).join("\n");
}

// Prevent a script body from closing its own <script> tag.
const scriptSafe = (s: string) => s.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");

type Katex = { rules: string; faces: { family: string; css: string }[]; selectors: Map<string, string[][][]> };
let katex: Katex | null = null;
/**
 * KaTeX's stylesheet split into its @font-face rules (fonts inlined as woff2) and the rest, plus, per font
 * family, the selectors that use it (each selector as compound class lists, e.g. [["katex"], ["delimsizing", "size1"]]).
 */
function loadKatex(): Katex {
  if (katex) return katex;
  const dir = join(ROOT, "node_modules", "katex", "dist");
  const css = readFileSync(join(dir, "katex.min.css"), "utf8");
  // The order of the properties inside @font-face differs between KaTeX versions.
  const faces = [...css.matchAll(/@font-face\{[^}]*?font-family:(KaTeX_\w+)[^}]*\}/g)].map(([face, family]) => ({
    family,
    css: face.replace(/src:url\(fonts\/([\w-]+\.woff2)\) format\("woff2"\)[^;}]*/, (_, f: string) => `src:url(data:font/woff2;base64,${readFileSync(join(dir, "fonts", f)).toString("base64")}) format("woff2")`),
  }));
  const rules = css.replace(/@font-face\{[^}]*\}/g, "");
  const selectors = new Map<string, string[][][]>();
  for (const [, sel, family] of rules.matchAll(/([^{}]+)\{[^{}]*?\bfont(?:-family)?:[^;{}]*?(KaTeX_\w+)/g)) {
    const list = sel.split(",").map((s) => s.split(/[\s>+~]+/).map((c) => c.match(/\.[\w-]+/g)?.map((x) => x.slice(1)) || []).filter((c) => c.length));
    selectors.set(family, [...(selectors.get(family) || []), ...list]);
  }
  return (katex = { rules, faces, selectors });
}

/**
 * KaTeX's stylesheet with only the fonts the lesson's math uses (all 20 would add ~350 KB). A family is used
 * when one of its selectors matches: every compound in it appears together in one of the lesson's class lists.
 */
export function katexCss(lessonJs: string): string {
  const k = loadKatex();
  const classLists = [...lessonJs.matchAll(/class=\\"([^"\\]*)/g)].map(([, c]) => new Set(c.split(/\s+/)));
  const matches = (compounds: string[][]) => compounds.every((c) => classLists.some((l) => c.every((x) => l.has(x))));
  const used = new Set([...k.selectors].filter(([, sels]) => sels.some(matches)).map(([family]) => family));
  return k.faces.filter((f) => used.has(f.family)).map((f) => f.css).join("") + k.rules;
}

/** Inline template, styles, simkit, shell and the lesson into one self-contained HTML file. */
export function buildLessonHtml(lessonJs: string, title = "Lesson"): string {
  const parts: Record<string, string> = {
    TITLE: escapeHtml(title),
    // KaTeX's stylesheet and the fonts it needs only when the lesson contains rendered math.
    CSS: (lessonJs.includes('class=\\"katex') ? katexCss(lessonJs) + "\n" : "") + read("template", "tokens.css") + "\n" + read("template", "shell.css"),
    // Only the components this lesson uses (a lesson uses 1–2 of the ~90).
    SIMKIT: scriptSafe(simkitSource(lessonJs)),
    SHELL: scriptSafe(read("template", "shell.js")),
    LESSON: scriptSafe(lessonJs),
  };
  return read("template", "lesson.html").replace(/\{\{(TITLE|CSS|SIMKIT|SHELL|LESSON)\}\}/g, (_, k: string) => parts[k]);
}

export type Control = { key: string; label: string; type?: "select"; min?: number; max?: number; step?: number; unit?: string; options?: { value: unknown; label: string }[] };
export type Level = {
  title: string;
  goal: string;
  setup?: Record<string, unknown>;
  lock?: string[];
  hide?: string[];
  show?: string[];
  ask?: { label: string; unit?: string; type?: "number" | "text" };
  hints?: string[];
  check: (s: Record<string, unknown>, d: Record<string, unknown>, answer?: unknown) => boolean;
  feedback?: (s: Record<string, unknown>, d: Record<string, unknown>, answer?: unknown) => string;
  solution?: Record<string, unknown>;
  solutionText?: string;
  explain?: string;
};
type LessonConfig = {
  title: string;
  subtitle?: string;
  objectives?: string[];
  state: Record<string, unknown>;
  controls?: Control[];
  model?: (s: Record<string, unknown>) => Record<string, unknown>;
  readouts?: { key: string; label: string; unit?: string; digits?: number }[];
  scene: unknown;
  actions?: { id: string; label: string; run: unknown }[];
  levels: Level[];
};

/** Evaluate lesson.js in an isolated VM context and return the config passed to defineLesson. */
export function loadLesson(lessonJs: string): LessonConfig {
  const ctx: Record<string, unknown> = { console: { log() {}, warn() {}, error() {} } };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read("simkit", "core.js"), ctx, { timeout: 1000, filename: "simkit/core.js" });
  let captured: LessonConfig | null = null;
  ctx.defineLesson = (c: LessonConfig) => {
    captured = c;
  };
  vm.runInContext(lessonJs, ctx, { timeout: 1000, filename: "lesson.js" });
  if (!captured) throw new Error("lesson.js did not call defineLesson(...)");
  return captured;
}

export type Issue = { level?: number; message: string };
export type ValidationReport = { ok: boolean; errors: Issue[]; warnings: Issue[] };

/**
 * Structural and logical checks:
 * - required fields, control definitions and references
 * - every level starts unsolved and its solution (using only unlocked controls, within range) solves it
 * - hidden readouts exist, model values are finite
 * - the start does not already show a question step's answer in a visible readout
 */
export function validateLesson(config: LessonConfig): ValidationReport {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const err = (message: string, level?: number) => errors.push({ message, level });
  const warn = (message: string, level?: number) => warnings.push({ message, level });

  if (!config || typeof config !== "object") return { ok: false, errors: [{ message: "No config" }], warnings };
  if (!config.title) err("Missing title");
  if (!config.state || typeof config.state !== "object") err("Missing state object");
  if (typeof config.scene !== "function") err("scene must be a function (stage, kit) => view");
  if (!Array.isArray(config.levels) || config.levels.length === 0) err("levels must be a non-empty array");
  if (errors.length) return { ok: false, errors, warnings };
  if (config.levels.length !== 5) warn(`Expected 5 levels, found ${config.levels.length}`);
  if (!config.objectives?.length) warn("No learning objectives");

  const controls = new Map((config.controls || []).map((c) => [c.key, c]));
  const actionIds = new Set((config.actions || []).map((a) => a.id));
  const readoutKeys = new Set((config.readouts || []).map((r) => r.key));
  if (readoutKeys.size > 5) err(`Use at most 5 readouts (found ${readoutKeys.size}); keep only the numbers the steps need`);

  for (const c of config.controls || []) {
    if (!(c.key in config.state)) err(`Control "${c.key}" has no initial value in state`);
    if (c.type === "select") {
      if (!c.options?.length) err(`Select control "${c.key}" needs options`);
    } else {
      if (typeof c.min !== "number" || typeof c.max !== "number" || !(c.max > c.min)) err(`Control "${c.key}" needs numeric min < max`);
      if (c.step != null && !(c.step > 0)) err(`Control "${c.key}" step must be > 0`);
    }
  }

  const derive = (s: Record<string, unknown>) => ({ ...s, ...(config.model ? config.model(s) : {}) });
  const validValue = (c: Control, v: unknown): string | null => {
    if (c.type === "select") return c.options!.some((o) => o.value === v) ? null : `"${String(v)}" is not an option of ${c.key}`;
    if (typeof v !== "number" || !Number.isFinite(v)) return `${c.key} must be a number`;
    if (v < c.min! - 1e-9 || v > c.max! + 1e-9) return `${c.key} = ${v} is outside [${c.min}, ${c.max}]`;
    const step = c.step || 1;
    const k = (v - c.min!) / step;
    if (Math.abs(k - Math.round(k)) > 1e-6) return `${c.key} = ${v} is not on the slider step ${step}`;
    return null;
  };

  config.levels.forEach((lv, i) => {
    const L = i + 1;
    if (!lv.title || !lv.goal) err("Level needs title and goal", L);
    if (typeof lv.check !== "function") return err("Level needs a check(state, derived, answer) function", L);
    if (!lv.hints?.length) warn("No hints", L);
    if (!lv.explain) warn("No explanation shown after solving", L);
    for (const k of lv.lock || []) if (!controls.has(k) && !actionIds.has(k)) err(`lock refers to unknown control/action "${k}"`, L);
    for (const k of lv.hide || []) if (!readoutKeys.has(k)) err(`hide refers to unknown readout "${k}"`, L);
    if (readoutKeys.size && !Array.isArray(lv.show)) err('Level needs "show": the readout keys this step shows (at most 3, can be empty)', L);
    for (const k of lv.show || []) if (!readoutKeys.has(k)) err(`show refers to unknown readout "${k}"`, L);
    if ((lv.show || []).length > 3) err(`show at most 3 readouts per step (found ${lv.show!.length})`, L);
    for (const k of lv.hide || []) if (lv.show && !lv.show.includes(k)) err(`hide "${k}" must also be in show (a hidden readout is shown as "?")`, L);
    for (const k of Object.keys(lv.setup || {})) if (!(k in config.state)) err(`setup sets unknown state key "${k}"`, L);

    const start = { ...config.state, ...(lv.setup || {}) };
    for (const [k, v] of Object.entries(start)) {
      const c = controls.get(k);
      const problem = c && validValue(c, v);
      if (problem) err(`Start state: ${problem}`, L);
    }

    let d0: Record<string, unknown>;
    try {
      d0 = derive(start);
    } catch (e) {
      return err(`model() threw on start state: ${(e as Error).message}`, L);
    }
    for (const r of config.readouts || []) {
      const v = d0[r.key];
      if (v === undefined) err(`Readout "${r.key}" is not produced by state or model()`, L);
      else if (typeof v === "number" && !Number.isFinite(v)) err(`Readout "${r.key}" is not finite (${v})`, L);
    }

    try {
      if (lv.check(start, d0, undefined)) err("Level is already solved at its start state", L);
    } catch (e) {
      // A check that throws on a missing answer is treated as unsolved, but flag it.
      warn(`check() threw on the start state: ${(e as Error).message}`, L);
    }

    const sol = { ...(lv.solution || {}) };
    if (!lv.solution) return err("Level needs a solution object", L);
    const answer = sol.answer;
    delete sol.answer;
    if (lv.ask && answer === undefined) err("Question level needs solution.answer", L);
    if (!lv.ask && answer !== undefined) err("solution.answer given but the level has no ask", L);
    if (!lv.ask && Object.keys(sol).length === 0) err("Goal level solution changes nothing", L);
    for (const [k, v] of Object.entries(sol)) {
      const c = controls.get(k);
      if (!c) err(`Solution sets "${k}", which is not a control`, L);
      else {
        if ((lv.lock || []).includes(k)) err(`Solution changes locked control "${k}"`, L);
        const problem = validValue(c, v);
        if (problem) err(`Solution: ${problem}`, L);
      }
    }
    const end = { ...start, ...sol };
    try {
      // Say what the solution actually produces, so the numbers in the goal, check or solution can be corrected.
      const dEnd = derive(end);
      const shown = Object.entries(dEnd)
        .filter(([, v]) => typeof v === "number" || typeof v === "boolean" || typeof v === "string")
        .slice(0, 14)
        .map(([k, v]) => `${k} = ${typeof v === "number" ? +v.toFixed(4) : v}`)
        .join(", ");
      // A question step must not show its answer: a visible readout in the answer's unit that already reads it.
      // (Goal steps are not checked this way: "change T but keep the pressure at 125 kPa" starts at its target on purpose.)
      if (lv.ask && typeof answer === "number") {
        const at = (r: { digits?: number }, v: number) => v.toFixed(r.digits ?? 2);
        const same = (config.readouts || []).find((r) => {
          const v = d0[r.key];
          if (typeof v !== "number" || !(lv.show || []).includes(r.key) || (lv.hide || []).includes(r.key) || (r.unit || "") !== (lv.ask!.unit || "")) return false;
          return at(r, v) === at(r, answer) || Math.abs(v - answer) <= 0.01 * Math.abs(answer);
        });
        if (same) err(`The readout "${same.label}" is visible and already reads the answer (${at(same, answer)}). List "${same.key}" in "hide", or do not show it in this step`, L);
      }
      if (!lv.check(end, dEnd, answer)) err(`Applying the solution does not pass check(). With the solution applied: ${shown}${answer !== undefined ? `, answer = ${String(answer)}` : ""}. Change the goal/check or the solution so they agree with these values`, L);
    } catch (e) {
      err(`check() threw on the solution: ${(e as Error).message}`, L);
    }
  });

  return { ok: errors.length === 0, errors, warnings };
}
