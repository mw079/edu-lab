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
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
