// Card pictures for the lesson overview: the simulation at the start of step 1, rendered in headless Chrome.
// Cached in data/thumbs/<id>-<hash of the lesson HTML>.png, so any change to the lesson or template refreshes it.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser } from "playwright";
import { launchChrome } from "./chrome.ts";
import { DATA_ROOT } from "./env.ts";

const DIR = join(DATA_ROOT, "thumbs");
let browser: Promise<Browser> | null = null;
let queue: Promise<unknown> = Promise.resolve();

const launch = () =>
  (browser ||= launchChrome().then(
      (b) => {
        b.on("disconnected", () => (browser = null));
        return b;
      },
      (err) => {
        browser = null; // try again on the next request instead of failing every card until a restart
        throw err;
      },
    ));

/** Path to a PNG of the lesson's simulation; rendered once per version of the lesson. */
export function thumbnail(id: string, html: string): Promise<string> {
  const file = join(DIR, `${id}-${createHash("sha1").update(html).digest("hex").slice(0, 10)}.png`);
  if (existsSync(file)) return Promise.resolve(file);
  // One render at a time: the overview asks for every card at once.
  const job = queue.then(async () => {
    if (existsSync(file)) return file;
    const page = await (await launch()).newPage({ viewport: { width: 1000, height: 700 }, deviceScaleFactor: 1.5, reducedMotion: "reduce" });
    try {
      await page.setContent(html, { waitUntil: "load" });
      await page.waitForFunction(() => (window as any).__lesson?.ready === true, null, { timeout: 5000 });
      // Show only the simulation, at its natural 1000 × 560 size.
      await page.addStyleTag({ content: ".top,.card,.readouts{display:none!important} #app{height:auto} .main{display:block;padding:0} .sim{border-radius:0;box-shadow:none} .stage{flex:none;aspect-ratio:1000/560} .stage svg{height:auto}" });
      await page.waitForTimeout(150);
      // Crop to the drawn parts (plus a margin) in the card's 1000 : 560 shape, so the picture is not mostly empty grid.
      const clip = await page.evaluate(() => {
        const svg = document.querySelector(".stage svg")!;
        const s = svg.getBoundingClientRect();
        const boxes = [...svg.children].filter((c) => c.tagName === "g").map((g) => g.getBoundingClientRect()).filter((r) => r.width && r.height);
        if (!boxes.length) return { x: s.x, y: s.y, width: s.width, height: s.height };
        const x0 = Math.min(...boxes.map((r) => r.left)) - 40, x1 = Math.max(...boxes.map((r) => r.right)) + 40;
        const y0 = Math.min(...boxes.map((r) => r.top)) - 40, y1 = Math.max(...boxes.map((r) => r.bottom)) + 40;
        const ratio = s.width / s.height;
        // Fit the whole drawing; a very wide one (a long track) is trimmed by up to 12% on each side, like a photo crop.
        const veryWide = (x1 - x0) / (y1 - y0) > 2.6;
        const w = Math.min(s.width, Math.max((x1 - x0) * (veryWide ? 0.76 : 1), (y1 - y0) * ratio, s.width / 2));
        const h = w / ratio;
        const cx = Math.min(Math.max((x0 + x1) / 2, s.left + w / 2), s.right - w / 2);
        const cy = Math.min(Math.max((y0 + y1) / 2, s.top + h / 2), s.bottom - h / 2);
        return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
      });
      const png = await page.screenshot({ clip });
      mkdirSync(DIR, { recursive: true });
      forgetThumbnails(id);
      writeFileSync(file, png);
      return file;
    } finally {
      await page.close();
    }
  });
  queue = job.catch(() => {});
  return job;
}

/** Remove the cached card pictures of a lesson. */
export function forgetThumbnails(id: string) {
  if (!existsSync(DIR)) return;
  for (const old of readdirSync(DIR)) if (old.startsWith(`${id}-`) && /^[0-9a-f]{10}\.png$/.test(old.slice(id.length + 1))) rmSync(join(DIR, old));
}
