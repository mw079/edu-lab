import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assembleLesson, checkDesign, checkMath, checkSetups, EMPTY_SCENE, type Design } from "../server/design.ts";
import { repairLatex } from "../server/math.ts";
import { loadLesson } from "../server/lesson.ts";

const momentum = (): Design => JSON.parse(readFileSync("examples/momentum/design.json", "utf8"));

test("the momentum design passes the design checks", () => {
  assert.deepEqual(checkDesign(momentum()).errors, []);
});

test("design checks name the broken expression and level", () => {
  const d = momentum();
  d.levels[1].check = "Math.abs(d.pA + 3 * d.pB < 1e-9";
  const { errors } = checkDesign(d);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].level, 2);
  assert.match(errors[0].message, /check is not a valid JavaScript expression/);
});

test("design checks catch wrong solutions, locked controls and level count", () => {
  const d = momentum();
  d.levels[0].solution = { mA: 3, vA: 3 };
  d.levels[2].solution = { mA: 3, vA: 2, mB: 2, vB: -3, type: "elastic" };
  const messages = checkDesign(d).errors.map((e) => `${e.level}: ${e.message}`);
  assert.ok(messages.some((m) => /^1: Applying the solution does not pass/.test(m)), messages.join("\n"));
  assert.ok(messages.some((m) => /^3: Solution changes locked control "type"/.test(m)), messages.join("\n"));
  const short = momentum();
  short.levels.pop();
  assert.match(checkDesign(short).errors[0].message, /exactly 5 levels/);
});

test("assembled feedback fills {key} and {answer}", () => {
  const config = loadLesson(assembleLesson(momentum(), EMPTY_SCENE)) as any;
  const s = { mA: 2, vA: 2, mB: 2, vB: -2, type: "elastic" };
  const d = config.model(s);
  assert.equal(config.levels[0].feedback(s, d), "Red momentum is now 4 kg·m/s.");
  assert.equal(config.levels[3].feedback(s, d, 12), "12 is the total momentum in kg·m/s. Divide by the total mass.");
  assert.equal(config.levels[3].feedback(s, d, 7), "");
});

test("LaTeX in text is rendered, broken LaTeX and math in feedback are reported", () => {
  const d = momentum();
  assert.deepEqual(checkMath(d), []);
  const js = assembleLesson(d, EMPTY_SCENE);
  assert.match(js, /class=\\"katex/);
  d.levels[0].hints = ["Use $\\frac{1}{2$."];
  d.levels[0].feedback = [{ when: "true", say: "Now $p = {pA}$" }];
  const issues = checkMath(d).map((i) => i.message).join("\n");
  assert.match(issues, /hint: invalid LaTeX/);
  assert.match(issues, /feedback .* plain text/);
});

test("JSON escape damage inside math is repaired (\\f from \\frac, tab from \\times)", () => {
  assert.equal(repairLatex("\frac{1}{2} \times 3"), "\\frac{1}{2} \\times 3");
});

test("every level's setup must state the whole starting situation", () => {
  const design = JSON.parse(readFileSync("examples/momentum/design.json", "utf8"));
  assert.deepEqual(checkSetups(design), []);
  delete design.levels[2].setup.type;
  delete design.levels[2].setup.vB;
  const issues = checkSetups(design);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].level, 3);
  assert.match(issues[0].message, /missing: vB, type/);
  assert.ok(checkDesign(design).errors.length > 0);
});
