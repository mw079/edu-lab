// A lesson design is what the model writes: plain data plus short JavaScript expressions.
// assembleLesson() turns a design and a scene function into lesson.js for the shell (template/CONTRACT.md).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { loadLesson, validateLesson, type Control, type Issue } from "./lesson.ts";
import { hasMath, mathError, mathHtml, rich } from "./math.ts";

type DesignLevel = {
  title: string;
  goal: string;
  setup?: Record<string, number | string>;
  lock?: string[];
  hide?: string[];
  show?: string[];
  ask?: { label: string; unit?: string };
  hints?: string[];
  check: string; // expression over s (state), d (state + derived) and answer
  feedback?: { when: string; say: string }[]; // first matching `when` wins; `say` may use {key} and {answer}
  solution: Record<string, number | string>;
  solutionText?: string;
  explain?: string;
};

export type Design = {
  title: string;
  subtitle?: string;
  audience?: string;
  objectives: string[];
  components?: string[];
  state: Record<string, number | string>;
  controls: Control[];
  derived?: { key: string; expr: string }[]; // evaluated in order; each may use s, d and earlier keys
  readouts?: { key: string; label: string; unit?: string; digits?: number }[];
  actions?: { id: string; label: string }[]; // each calls view[id](s, d) on the scene
  formulas?: { expr: string; meaning?: string }[];
  debrief?: string;
  levels: DesignLevel[];
};

export type { Issue };

const json = (v: unknown) => JSON.stringify(v ?? null);
const KEY = /^[A-Za-z_$][\w$]*$/;

/** Syntax-check every expression on its own so errors point at the exact field. */
function checkExpressions(design: Design): Issue[] {
  const issues: Issue[] = [];
  const tryExpr = (src: unknown, where: string, level?: number) => {
    if (typeof src !== "string" || !src.trim()) return issues.push({ level, message: `${where} must be a non-empty expression string` });
    try {
      new vm.Script(`(${src})`);
    } catch (e) {
      issues.push({ level, message: `${where} is not a valid JavaScript expression: ${(e as Error).message} — ${src}` });
    }
  };
  for (const [i, x] of (design.derived || []).entries()) {
    if (!KEY.test(x?.key || "")) issues.push({ message: `derived[${i}].key "${x?.key}" is not a valid name` });
    tryExpr(x?.expr, `derived "${x?.key}"`);
  }
  for (const [i, lv] of (design.levels || []).entries()) {
    tryExpr(lv.check, "check", i + 1);
    for (const f of lv.feedback || []) tryExpr(f.when, "feedback.when", i + 1);
  }
  for (const a of design.actions || []) if (!KEY.test(a?.id || "")) issues.push({ message: `action id "${a?.id}" is not a valid name` });
  return issues;
}

/** LaTeX errors, and math where only plain text works (titles, feedback with live numbers, labels). */
export function checkMath(design: Design): Issue[] {
  const issues: Issue[] = [];
  const check = (text: unknown, where: string, level?: number, wholeIsMath = false) => {
    const err = mathError(text, wholeIsMath);
    if (err) issues.push({ level, message: `${where}: invalid LaTeX (${err}) in: ${String(text)}` });
  };
  const plain = (text: unknown, where: string, level?: number) => {
    if (hasMath(text)) issues.push({ level, message: `${where} must be plain text without $…$ math: ${text}` });
  };
  plain(design.title, "title");
  for (const c of design.controls || []) plain(c.label, `control "${c.key}" label`);
  for (const r of design.readouts || []) plain(r.label, `readout "${r.key}" label`);
  for (const f of design.formulas || []) {
    check(f.expr, "formulas.expr (LaTeX without $)", undefined, true);
    check(f.meaning, "formulas.meaning");
  }
  check(design.debrief, "debrief");
  for (const [i, lv] of (design.levels || []).entries()) {
    plain(lv.title, "level title", i + 1);
    plain(lv.ask?.label, "ask.label", i + 1);
    for (const f of lv.feedback || []) plain(f.say, "feedback (shown with live numbers, so plain text only)", i + 1);
    check(lv.goal, "goal", i + 1);
    for (const h of lv.hints || []) check(h, "hint", i + 1);
    check(lv.solutionText, "solutionText", i + 1);
    check(lv.explain, "explain", i + 1);
  }
  return issues;
}

/** Build lesson.js source from a design and the scene function source (`function (stage, kit) { … }`). */
export function assembleLesson(design: Design, sceneSource: string): string {
  const derived = (design.derived || []).map((x) => `    d.${x.key} = (${x.expr});`).join("\n");
  const actions = (design.actions || []).map((a) => `    { id: ${json(a.id)}, label: ${json(a.label)}, run: (view, s, d) => view.${a.id}(s, d) },`).join("\n");
  const levels = design.levels
    .map((lv) => {
      const { check, feedback, ...rest } = lv;
      const data = { ...rest, goal: rich(rest.goal), hints: (rest.hints || []).map(rich), solutionText: rich(rest.solutionText), explain: rich(rest.explain) };
      const fb = (feedback || []).map((f) => `      if (${f.when}) return fill(${json(f.say)}, d, answer);`).join("\n");
      return [
        `  Object.assign(${json(data)}, {`,
        `    check: (s, d, answer) => Boolean(${check}),`,
        `    feedback: (s, d, answer) => {`,
        fb,
        `      return "";`,
        `    },`,
        `  }),`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
  const scene = sceneSource.trim().replace(/;$/, "");
  return `// Generated by Edu Lab: design data + expressions, assembled with a generated scene.
const fill = (text, d, answer) =>
  String(text).replace(/\\{(\\w+)\\}/g, (m, k) => (k === "answer" ? String(answer) : typeof d[k] === "number" ? String(+d[k].toFixed(2)) : k in d ? String(d[k]) : m));

defineLesson({
  title: ${json(design.title)},
  subtitle: ${json(design.subtitle || "")},
  audience: ${json(design.audience || "")},
  objectives: ${json(design.objectives || [])},
  state: ${json(design.state)},
  controls: ${json(design.controls || [])},
  model(s) {
    const d = { ...s };
${derived}
    return d;
  },
  readouts: ${json(design.readouts || [])},
  stage: { width: 1000, height: 560 },
  formulas: ${json((design.formulas || []).map((f) => ({ expr: { html: mathHtml(f.expr) }, meaning: rich(f.meaning) })))},
  debrief: ${json(rich(design.debrief || ""))},
  actions: [
${actions}
  ],
  scene: (${scene}),
  levels: [
${levels}
  ],
});
`;
}

/** A scene that draws nothing, for validating a design's logic before any scene exists. */
export const EMPTY_SCENE = "function (stage, kit) { return {}; }";

/** lesson.js source for an example folder (design.json + scene.js). */
export function lessonSourceFromDir(dir: string): string {
  const design = JSON.parse(readFileSync(join(dir, "design.json"), "utf8")) as Design;
  const scene = existsSync(join(dir, "scene.js")) ? readFileSync(join(dir, "scene.js"), "utf8") : EMPTY_SCENE;
  return assembleLesson(design, scene);
}

/** Structural + logic checks of a design, using an empty scene. */
/**
 * Every step states its whole starting situation. A value left out of "setup" would silently come from the
 * lesson's defaults, which is how a step ends up showing a picture that does not match its task.
 */
export function checkSetups(design: Design): Issue[] {
  const keys = Object.keys(design.state || {});
  const issues: Issue[] = [];
  for (const [i, lv] of (design.levels || []).entries()) {
    const missing = keys.filter((k) => !(lv.setup && k in lv.setup));
    if (missing.length) issues.push({ level: i + 1, message: `setup must give every state key so the step starts in exactly the situation its goal describes; missing: ${missing.join(", ")}` });
  }
  return issues;
}

export function checkDesign(design: Design): { errors: Issue[]; warnings: Issue[] } {
  const errors: Issue[] = [];
  if (!Array.isArray(design.levels) || design.levels.length !== 5) errors.push({ message: `levels must be an array of exactly 5 levels (found ${design.levels?.length ?? 0})` });
  if (!design.state || typeof design.state !== "object") errors.push({ message: "state must be an object" });
  if (!Array.isArray(design.controls)) errors.push({ message: "controls must be an array" });
  if (errors.length) return { errors, warnings: [] };
  errors.push(...checkExpressions(design), ...checkMath(design), ...checkSetups(design));
  if (errors.length) return { errors, warnings: [] };
  try {
    const report = validateLesson(loadLesson(assembleLesson(design, EMPTY_SCENE)));
    return { errors: report.errors, warnings: report.warnings };
  } catch (e) {
    return { errors: [{ message: `The design could not be evaluated: ${(e as Error).message}` }], warnings: [] };
  }
}
