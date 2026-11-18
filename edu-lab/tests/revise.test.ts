// Preview → change requests → approve, with a fake model (no API calls) and a temporary data folder.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.EDU_DATA_DIR = mkdtempSync(join(tmpdir(), "edu-lab-data-"));
const { setChatForTests } = await import("../server/llm.ts");
const { assembleLesson } = await import("../server/design.ts");
const p = await import("../server/pipeline.ts");

const momentumDesign = readFileSync("examples/momentum/design.json", "utf8");
const momentumScene = readFileSync("examples/momentum/scene.js", "utf8").trim();

/** A built, previewed lesson (status "built") made from the momentum example. */
function builtLesson() {
  const design = JSON.parse(momentumDesign);
  const d = p.newDraft("Momentum test", "High school");
  Object.assign(d, {
    plan: { title: design.title, audience: "High school", idea: "carts collide", objectives: design.objectives, components: design.components },
    design,
    status: "built",
    stage: "build",
    version: 1,
    check: { ok: true, errors: [], layout: [], levels: [] },
  });
  const dir = join(p.DATA, d.id);
  writeFileSync(join(dir, "design.json"), JSON.stringify(design, null, 2));
  writeFileSync(join(dir, "scene.js"), momentumScene + "\n");
  writeFileSync(join(dir, "lesson.js"), assembleLesson(design, momentumScene));
  p.saveDraft(d);
  return d;
}

/** The model replies with these texts in order; the test fails if it is asked more often. */
function fakeModel(replies: string[]) {
  const asked: string[] = [];
  setChatForTests(async (messages) => {
    const last = messages.at(-1)!.content;
    asked.push(typeof last === "string" ? last : "(parts)");
    if (!replies.length) throw new Error("the fake model ran out of replies");
    return { text: replies.shift()!, reasoning: "", ms: 1, usage: {} };
  });
  return asked;
}

const files = (id: string) => ({
  scene: readFileSync(join(p.DATA, id, "scene.js"), "utf8"),
  design: readFileSync(join(p.DATA, id, "design.json"), "utf8"),
});

test("a picture change redraws only the scene, needs approval again and can be undone", { timeout: 60_000 }, async () => {
  const d = builtLesson();
  const changed = momentumScene.replace("y: 380", "y: 360");
  assert.notEqual(changed, momentumScene);
  const asked = fakeModel(['{"change": "picture"}', "```js\n" + changed + "\n```", '{"issues": []}']);

  await p.reviseLesson(d, { note: "Move the track up a little", was: "built" });
  assert.equal(asked.length, 3, "route, scene, visual review");
  assert.match(asked[1], /keep hiding/);
  assert.match(asked[1], /Move the track up a little/);
  assert.equal(d.status, "built");
  assert.equal(d.version, 2);
  assert.deepEqual(d.notice, { applied: true, text: "The simulation was redrawn and the lesson passed every check." });
  assert.match(files(d.id).scene, /y: 360/);
  assert.equal(files(d.id).design, JSON.stringify(JSON.parse(momentumDesign), null, 2)); // the steps are unchanged
  assert.ok(p.hasPrevious(d.id));
  p.saveDraft(d);

  assert.equal(p.undoRevision(d.id), "ok");
  assert.match(files(d.id).scene, /y: 380/);
  assert.equal(p.getDraft(d.id)!.version, 3);
  assert.equal(p.hasPrevious(d.id), false);
  assert.equal(p.undoRevision(d.id), "nothing");

  assert.equal(p.approveDraft(d.id), "ok");
  assert.equal(p.getDraft(d.id)!.status, "ready");
  assert.equal(p.approveDraft(d.id), "not-built");
});

test("a change that never works leaves the approved lesson as it was", { timeout: 60_000 }, async () => {
  const d = Object.assign(builtLesson(), { status: "ready" as const });
  const before = files(d.id);
  fakeModel(['{"change": "picture"}', "Sorry, no code.", "Still no code.", "No."]);

  await p.reviseLesson(d, { note: "Draw it in 3D", was: "ready" });
  assert.equal(d.status, "ready");
  assert.equal(d.version, 1);
  assert.equal(d.notice?.applied, false);
  assert.match(d.notice!.text, /still fails after 3 attempts/);
  assert.deepEqual(files(d.id), before);
  assert.equal(p.hasPrevious(d.id), false);
  assert.equal(d.revisions?.at(-1)?.applied, false);
});

test("a steps change rewrites the design and keeps the current drawing when it still works", { timeout: 60_000 }, async () => {
  const d = builtLesson();
  const design = JSON.parse(momentumDesign);
  design.levels[2].hints[0] = "Think about which cart is heavier.";
  const asked = fakeModel(['{"change": "steps"}', JSON.stringify(design), '{"issues": []}']);

  await p.reviseLesson(d, { note: "Make the first hint in step 3 gentler", step: 3, was: "built" });
  assert.equal(asked.length, 3, "route, design, visual review: no model call for the scene, the current one still works");
  assert.match(asked[1], /Previous version of the design/);
  assert.match(asked[1], /About step 3/);
  assert.equal(d.notice?.applied, true);
  assert.equal(d.design!.levels[2].hints![0], "Think about which cart is heavier.");
  assert.match(files(d.id).design, /which cart is heavier/);
  assert.equal(files(d.id).scene.trim(), momentumScene);
});

test("a change the visual review objects to (e.g. labels that give an answer away) is not applied", { timeout: 60_000 }, async () => {
  const d = builtLesson();
  const before = files(d.id);
  fakeModel([
    '{"change": "picture"}',
    "```js\n" + momentumScene.replace("y: 380", "y: 360") + "\n```",
    '{"issues": [{"step": 4, "problem": "The new labels show both velocities, which gives the answer away."}]}',
    "I cannot fix that.", // the review's one fix attempt fails
  ]);

  await p.reviseLesson(d, { note: "Label the carts with their speeds", was: "built" });
  assert.equal(d.notice?.applied, false);
  assert.match(d.notice!.text, /visual review found a problem.*step 4: The new labels/);
  assert.deepEqual(files(d.id), before);
  assert.equal(d.version, 1);
  assert.equal(p.hasPrevious(d.id), false);
});

test("a change request interrupted by a server restart leaves the lesson as it was, approved or not", () => {
  for (const from of ["built", "ready"] as const) {
    const d = Object.assign(builtLesson(), { status: "working" as const, stage: "revise" as const });
    d.revisions = [{ at: new Date().toISOString(), note: "x", applied: false, message: "", from }];
    p.saveDraft(d);
    p.recoverInterrupted();
    const after = p.getDraft(d.id)!;
    assert.equal(after.status, from);
    assert.match(after.notice!.text, /restarted/);
  }
  setChatForTests(null);
});
