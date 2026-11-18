import assert from "node:assert/strict";
import { test } from "node:test";
import { lessonSourceFromDir } from "../server/design.ts";
import { buildLessonHtml, loadLesson, simkitFiles, validateLesson } from "../server/lesson.ts";
import { extractJson } from "../server/llm.ts";

const momentum = lessonSourceFromDir("examples/momentum");

// A tiny valid lesson used as a base for broken variants.
const tiny = (levelOverrides = "") => `
defineLesson({
  title: "Tiny", objectives: ["x"],
  state: { a: 1 },
  controls: [{ key: "a", label: "A", min: 0, max: 10, step: 1 }],
  model: (s) => ({ double: s.a * 2 }),
  readouts: [{ key: "double", label: "2a" }],
  scene: () => ({}),
  levels: [{ title: "T", goal: "Make 2a = 8", hints: ["h"], explain: "e",
    check: (s, d) => d.double === 8, solution: { a: 4 }, show: ["double"], ${levelOverrides} }],
});`;

test("momentum example passes logic validation", () => {
  const r = validateLesson(loadLesson(momentum));
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
});

test("a correct tiny lesson validates (only the 5-level warning)", () => {
  const r = validateLesson(loadLesson(tiny()));
  assert.equal(r.ok, true);
  assert.ok(r.warnings.some((w) => /5 levels/.test(w.message)));
});

test("wrong solution is caught", () => {
  const r = validateLesson(loadLesson(tiny("solution: { a: 3 }")));
  assert.ok(r.errors.some((e) => /does not pass check/.test(e.message)));
});

test("level that starts solved is caught", () => {
  const r = validateLesson(loadLesson(tiny("setup: { a: 4 }")));
  assert.ok(r.errors.some((e) => /already solved/.test(e.message)));
});

test("solution that moves a locked control is caught", () => {
  const r = validateLesson(loadLesson(tiny('lock: ["a"]')));
  assert.ok(r.errors.some((e) => /locked control "a"/.test(e.message)));
});

test("solution off the slider step or range is caught", () => {
  assert.ok(validateLesson(loadLesson(tiny("solution: { a: 4.5 }"))).errors.some((e) => /step/.test(e.message)));
  assert.ok(validateLesson(loadLesson(tiny("solution: { a: 40 }"))).errors.some((e) => /outside/.test(e.message)));
});

test("unknown hide/lock references are caught", () => {
  const r = validateLesson(loadLesson(tiny('hide: ["nope"], lock: ["ghost"]')));
  assert.ok(r.errors.some((e) => /unknown readout "nope"/.test(e.message)));
  assert.ok(r.errors.some((e) => /unknown control\/action "ghost"/.test(e.message)));
});

test("question level needs an answer that passes", () => {
  const ask = 'ask: { label: "2a?" }, hide: ["double"], check: (s, d, x) => x === 2, solution: { answer: 2 }';
  assert.equal(validateLesson(loadLesson(tiny(ask))).ok, true);
  const wrong = 'ask: { label: "2a?" }, hide: ["double"], check: (s, d, x) => x === 2, solution: { answer: 3 }';
  assert.equal(validateLesson(loadLesson(tiny(wrong))).ok, false);
});

test("a question step whose answer is already on a visible readout is caught", () => {
  const visible = 'ask: { label: "2a?" }, check: (s, d, x) => x === 2, solution: { answer: 2 }';
  assert.ok(validateLesson(loadLesson(tiny(visible))).errors.some((e) => /already reads the answer/.test(e.message)));
  // A readout in another unit that happens to show the same number is not the answer.
  const otherUnit = 'ask: { label: "2a?", unit: "N" }, check: (s, d, x) => x === 2, solution: { answer: 2 }';
  assert.equal(validateLesson(loadLesson(tiny(otherUnit))).ok, true);
});

test("lesson code that never calls defineLesson is rejected", () => {
  assert.throws(() => loadLesson("const x = 1;"), /defineLesson/);
});

test("infinite loops in lesson code time out", () => {
  assert.throws(() => loadLesson("while (true) {}"), /timed out/);
});

test("built HTML is self-contained and cannot be broken out of by </script>", () => {
  const html = buildLessonHtml(momentum.replace("Momentum and Collisions", "A </script><b>x"), "A <b>");
  assert.ok(html.includes("<title>A &lt;b&gt;</title>"));
  assert.ok(!html.includes("A </script><b>"));
  assert.ok(html.includes("window.simkit"));
  assert.ok(!/<script[^>]+src=/.test(html), "no external scripts");
});

test("extractJson handles fences, prose and nested braces in strings", () => {
  assert.deepEqual(extractJson('Sure!\n```json\n{"a": "}{", "b": [1, {"c": 2}]}\n```'), { a: "}{", b: [1, { c: 2 }] });
  assert.deepEqual(extractJson('prefix {"ok": true} suffix'), { ok: true });
  assert.throws(() => extractJson("no json"), /No JSON/);
});

test("each step must say which readouts it shows, at most 3", () => {
  const noShow = tiny().replace('show: ["double"], ', "");
  assert.ok(validateLesson(loadLesson(noShow)).errors.some((e) => /show/.test(e.message)));
  assert.ok(validateLesson(loadLesson(tiny().replace('show: ["double"]', 'show: ["ghost"]'))).errors.some((e) => /unknown readout/.test(e.message)));
});

test("a lesson includes only the simkit files it uses", () => {
  assert.deepEqual(simkitFiles(momentum), ["core.js", "carts.js"]);
  // A component that uses another file's helper brings that file along (slit.js draws with photoelectric's colours).
  assert.deepEqual(simkitFiles("kit.doubleSlit(stage, {})"), ["core.js", "photoelectric.js", "slit.js"]);
  const html = buildLessonHtml(momentum);
  assert.ok(html.includes("simkit/carts.js") && !html.includes("simkit/pendulum.js"));
});
