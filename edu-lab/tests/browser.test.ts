import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { lessonSourceFromDir } from "../server/design.ts";
import { chromium } from "playwright";
import { browserCheck } from "../server/browser-check.ts";
import { buildLessonHtml, loadLesson } from "../server/lesson.ts";

const js = lessonSourceFromDir("examples/momentum");
const html = buildLessonHtml(js, loadLesson(js).title);

test("momentum lesson: every level starts unsolved and is solvable through the UI", { timeout: 60_000 }, async () => {
  const r = await browserCheck(html, mkdtempSync(join(tmpdir(), "lesson-")));
  assert.deepEqual(r.errors, []);
  assert.equal(r.levels.length, 5);
  for (const l of r.levels) {
    assert.ok(l.startsUnsolved, `level ${l.level} starts unsolved`);
    assert.ok(l.solvedViaUi, `level ${l.level} solved`);
  }
});

test("shell behaviour: steps, wrong answers, hidden controls and readouts, hints, explore", { timeout: 60_000 }, async () => {
  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await page.setContent(html);
    const lesson = (fn: string, ...args: unknown[]) => page.evaluate(([f, a]) => (window as any).__lesson[f as string](...(a as unknown[])), [fn, args] as const);

    // Step 2 and Explore are unreachable until earlier steps are solved.
    assert.equal(await page.isDisabled(".steps .step:nth-child(2)"), true);
    assert.equal(await page.isDisabled(".steps .explore"), true);

    // A wrong attempt gives targeted feedback and does not solve the step.
    await page.click("#check-btn");
    assert.match((await page.textContent(".feedback")) || "", /Red momentum is now 4/);
    assert.equal(await lesson("solved", 0), false);

    // Only the controls this step needs are shown; locked actions are hidden.
    assert.equal(await page.isVisible("#ctl-mA"), true);
    assert.equal(await page.isVisible("#ctl-mB"), false);
    assert.equal(await page.isVisible("[data-action=run]"), false);

    // Hints appear one at a time, then the worked solution.
    await page.click("#hint-btn");
    await page.click("#hint-btn");
    assert.equal(await page.$$eval(".hints li", (els) => els.length), 2);
    assert.equal((await page.textContent("#hint-btn"))?.trim(), "Show solution");

    // Step 4: hidden readouts show "?" and the typed answer is checked.
    await lesson("goTo", 3);
    assert.equal(await page.$$eval(".readout.unknown", (els) => els.length), 1);
    assert.equal(await page.$$eval(".readout", (els) => els.length), 2); // only this step's readouts
    await page.fill("#answer-input", "12");
    await page.click("#check-btn");
    assert.match((await page.textContent(".feedback")) || "", /total momentum/);
    await page.fill("#answer-input", "3");
    await page.click("#check-btn");
    assert.equal(await lesson("solved", 3), true);
    // Check stays available after solving.
    await page.fill("#answer-input", "4");
    await page.click("#check-btn");
    assert.match((await page.textContent(".feedback")) || "", /red cart's speed/);
    assert.equal(await lesson("solved", 3), true);
    await page.fill("#answer-input", "3");
    await page.click("#check-btn");
    assert.match((await page.textContent(".feedback.ok strong")) || "", /Correct!/);
    assert.equal(await page.$$eval(".readout.unknown", (els) => els.length), 0);
    assert.equal(await page.isVisible("#next-btn"), true);

    // After the last step the lesson opens into free exploration with every control.
    for (const i of [0, 1, 2, 4]) {
      await lesson("applySolution", i);
      await page.click("#check-btn");
    }
    await page.click("#next-btn");
    assert.equal(await page.isVisible("#ctl-mB"), true);
    assert.match((await page.textContent(".card")) || "", /Everything is unlocked/);
  } finally {
    await browser.close();
  }
});

test("direct interaction: dragging the pendulum's bob moves its slider, and is blocked when the control is locked", { timeout: 60_000 }, async () => {
  const src = lessonSourceFromDir("examples/pendulum");
  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await page.setContent(buildLessonHtml(src, loadLesson(src).title));
    // Screen position of a point on the stage, and of the bob (the circle with the dark outline).
    const toScreen = (x: number, y: number) =>
      page.evaluate(`(() => { const m = document.querySelector(".stage svg").getScreenCTM(); return { x: ${x} * m.a + m.e, y: ${y} * m.d + m.f }; })()`) as Promise<{ x: number; y: number }>;
    const bob = async () => {
      const box = (await page.locator('.simkit-pendulum circle[stroke="#2b2f2c"]').boundingBox())!;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const dragBobTo = async (angleDeg: number) => {
      const from = await bob();
      const a = (angleDeg * Math.PI) / 180;
      const to = await toScreen(280 + 170 * Math.sin(a), 70 + 170 * Math.cos(a)); // pivot (280, 70), 1 m = 170 px
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2);
      await page.mouse.move(to.x, to.y);
      await page.mouse.up();
    };
    const angle = () => page.inputValue("#ctl-angle");

    // Step 1 asks for 20°: dragging the bob there sets the slider (snapped to its 5° steps) and solves the step.
    assert.equal(await angle(), "5");
    await dragBobTo(21);
    assert.equal(await angle(), "20");
    await page.click("#check-btn");
    assert.equal(await page.evaluate(`window.__lesson.solved(0)`), true);

    // Dragging far outside the slider's range stops at its end.
    await dragBobTo(80);
    assert.equal(await angle(), "30");

    // Step 4 locks the angle: the bob cannot be dragged.
    await page.evaluate(`window.__lesson.goTo(3)`);
    assert.equal(await angle(), "15");
    await dragBobTo(-25);
    assert.equal(await angle(), "15");
    assert.deepEqual(await page.evaluate(`window.__lesson.errors`), []);
  } finally {
    await browser.close();
  }
});

test("motion: app-made value changes travel, state is final at once; labels use the darker text colours", { timeout: 60_000 }, async () => {
  const src = lessonSourceFromDir("examples/pendulum");
  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); // normal motion
    await page.setContent(buildLessonHtml(src, loadLesson(src).title));
    const bobX = `document.querySelector('.simkit-pendulum circle[stroke="#2b2f2c"]').getBoundingClientRect().x`;
    const start = (await page.evaluate(bobX)) as number;
    // "Set it up for me": the state (and so Check) is final immediately, the drawing still shows the old value…
    const right = (await page.evaluate(`(() => { window.__lesson.applySolution(0); return [window.__lesson.isSolvedNow(), ${bobX}]; })()`)) as [boolean, number];
    assert.equal(right[0], true);
    assert.ok(Math.abs(right[1] - start) < 1, "drawing starts from the old value");
    // …and arrives at the new one shortly after.
    await page.waitForTimeout(500);
    assert.ok(((await page.evaluate(bobX)) as number) - start > 20, "drawing reached the new value");
    // Moving the slider is followed at once (no travel).
    await page.evaluate(`(() => { const r = document.querySelector("#ctl-angle"); r.value = "5"; r.dispatchEvent(new Event("input")); })()`);
    assert.ok(Math.abs(((await page.evaluate(bobX)) as number) - start) < 1);
    // Text drawn in an object colour is darkened for contrast.
    const fills = (await page.evaluate(`[...document.querySelectorAll(".stage svg text")].map((t) => t.getAttribute("fill"))`)) as string[];
    assert.ok(!fills.includes("#f08c2e") && !fills.includes("#8a63d2"));
    assert.deepEqual(await page.evaluate(`window.__lesson.errors`), []);
  } finally {
    await browser.close();
  }
});
