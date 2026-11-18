// Play a built lesson in headless Chrome: load, solve every level through the UI, take screenshots.
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";

const LAYOUT_CHECK = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "layout-check.js"), "utf8");

type LevelResult = { level: number; startsUnsolved: boolean; solvedViaUi: boolean; feedback: string; screenshots: string[] };
type BrowserReport = { ok: boolean; errors: string[]; layout: string[]; levels: LevelResult[]; screenshots: string[]; stageShots: string[] };

async function launch(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

export async function browserCheck(html: string, outDir: string): Promise<BrowserReport> {
  mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  const errors: string[] = [];
  const levels: LevelResult[] = [];
  const screenshots: string[] = [];
  const stageShots: string[] = []; // the simulation only, at the start of each step (for the visual review)
  const layout = new Set<string>();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, offline: true, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.route("**/*", (route) => route.abort()); // lessons must not use the network
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForFunction(() => (window as any).__lesson?.ready === true, null, { timeout: 5000 }).catch(() => errors.push("Lesson never became ready"));
    // Stage screenshots at the drawing's own 1000 : 560 shape (the page lets the stage grow to fill the window).
    await page.addStyleTag({ content: ".sim{align-self:start} .stage{flex:none;aspect-ratio:1000/560}" }).catch(() => {});

    // Wait for the page instead of sleeping: two animation frames let the redraw reach the screen.
    const settle = () => page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    const shot = async (name: string) => {
      const file = join(outDir, name);
      await page.screenshot({ path: file });
      screenshots.push(file);
      return file;
    };
    if (!(await page.evaluate(() => !!(window as any).__lesson?.levelCount))) return { ok: false, errors, layout: [], levels, screenshots, stageShots };

    const count: number = await page.evaluate(() => (window as any).__lesson.levelCount);
    for (let i = 0; i < count; i++) {
      const files: string[] = [];
      await page.evaluate((n) => (window as any).__lesson.goTo(n), i);
      await settle();
      files.push(await shot(`${String(i + 1).padStart(2, "0")}-start.png`));
      const stageFile = join(outDir, `stage-${i + 1}.png`);
      await page.locator(".stage svg").screenshot({ path: stageFile });
      stageShots.push(stageFile);
      for (const m of (await page.evaluate(LAYOUT_CHECK)) as string[]) layout.add(`level ${i + 1}: ${m}`);
      const startsUnsolved = await page.evaluate(() => !(window as any).__lesson.isSolvedNow(undefined));
      await page.evaluate((n) => (window as any).__lesson.applySolution(n), i);
      await page.click("#check-btn");
      await settle();
      for (const m of (await page.evaluate(LAYOUT_CHECK)) as string[]) layout.add(`level ${i + 1} (solved): ${m}`);
      const solvedViaUi: boolean = await page.evaluate((n) => (window as any).__lesson.solved(n), i);
      const feedback = (await page.textContent(".feedback").catch(() => "")) || "";
      // Exercise each unlocked action (e.g. "Run collision") after solving.
      const actions = await page.$$("[data-action]:visible");
      for (const a of actions) if (await a.isEnabled()) await a.click();
      if (actions.length) await page.waitForTimeout(1200); // let animations run long enough to surface errors
      files.push(await shot(`${String(i + 1).padStart(2, "0")}-solved.png`));
      levels.push({ level: i + 1, startsUnsolved, solvedViaUi, feedback: feedback.trim(), screenshots: files });
    }
    await page.waitForTimeout(800);
    await shot("99-complete.png");
    const lateErrors: string[] = await page.evaluate(() => (window as any).__lesson.errors);
    errors.push(...lateErrors);
  } finally {
    await browser.close();
  }
  const ok = errors.length === 0 && levels.length > 0 && levels.every((l) => l.startsUnsolved && l.solvedViaUi);
  return { ok, errors, layout: dedupe([...layout]), levels, screenshots, stageShots };
}

/** The same layout problem usually appears on every level; report it once with the levels listed. */
function dedupe(messages: string[]): string[] {
  const byText = new Map<string, string[]>();
  for (const m of messages) {
    const [, where, text] = m.match(/^(level \d+(?: \(solved\))?): (.*)$/) || [, "", m];
    byText.set(text, [...(byText.get(text) || []), where]);
  }
  return [...byText].map(([text, where]) => `${text} (${where.length > 2 ? `${where.length} screens` : where.join(", ")})`);
}
