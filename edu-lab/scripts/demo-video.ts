// Usage: npm run demo-video [-- "lesson request" --audience "Middle school"]
// Records a demo video of a teacher creating a lesson, from start to approval, with the app running (npm run dev,
// or EDU_LAB_URL). It generates one real lesson (about 8 model calls). Writes ../docs/video/creating-a-lesson.mp4
// (about 55 s at the default DEMO_SPEED of 1.5).
//
// How: Playwright opens a wrapper page that draws the look (grainy gradient, a window with a title bar around the
// real app, an animated cursor with click rings, captions, title cards, gentle zoom) and drives the app in its
// frame like a teacher would. Chrome streams sharp frames (CDP screencast); the waits while the model works are
// compressed to a few seconds. ffmpeg turns the frames into an MP4 and adds music made by demo-music.ts.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type Locator } from "playwright";
import { ROOT } from "../server/env.ts";
import { demoMusic } from "./demo-music.ts";

const args = process.argv.slice(2);
const ai = args.indexOf("--audience");
const audience = ai >= 0 ? args.splice(ai, 2)[1] : "Middle school";
const request = args.join(" ").trim() || "Floating and sinking: why some things float and others sink";
const BASE = (process.env.EDU_LAB_URL || "http://localhost:5173").replace(/\/$/, "");
const OUT = join(ROOT, "..", "docs", "video");
const W = 1920;
const H = 1080;
const WIN = { x: 160, y: 64, w: 1600, h: 900 };
const BAR = 40;
/** Playback speed of the whole video (actions and waits): 1.5 keeps it under a minute. */
const SPEED = Number(process.env.DEMO_SPEED || 1.5);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const WRAPPER = `<!doctype html><html><head><meta charset="utf-8"><style>
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #2a0d07;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; }
#bg { position: absolute; inset: 0;
  background: radial-gradient(120% 95% at 12% 18%, #f7a24a 0%, #ea6a24 32%, #b43a1b 62%, #4a130c 100%); }
#grain { position: absolute; inset: 0; opacity: .28; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"); }
#stage { position: absolute; inset: 0; transition: transform 1s cubic-bezier(.22,1,.36,1), opacity .9s ease; }
#win { position: absolute; left: ${WIN.x}px; top: ${WIN.y}px; width: ${WIN.w}px; height: ${WIN.h}px; border-radius: 14px;
  overflow: hidden; background: #fff; box-shadow: 0 40px 90px rgba(30, 6, 2, .55), 0 0 0 1px rgba(255,255,255,.12); }
#bar { height: ${BAR}px; display: flex; align-items: center; gap: 8px; padding: 0 16px; background: #f4f3f0;
  border-bottom: 1px solid #e4e2dc; font-size: 14px; font-weight: 600; color: #3b3f3c; }
.dot { width: 12px; height: 12px; border-radius: 50%; } .r { background: #ff5f57 } .y { background: #febc2e } .g { background: #28c840 }
#bar .title { margin-left: 14px; } #bar .url { margin-left: 10px; font-weight: 400; color: #8a8f8b; }
#app { display: block; width: 100%; height: ${WIN.h - BAR}px; border: 0; background: #f5f4f1; }
#cursor { position: absolute; left: 0; top: 0; z-index: 20; pointer-events: none; transform: translate(${W / 2}px, ${H / 2}px);
  transition: transform .75s cubic-bezier(.22,1,.36,1), opacity .5s ease; filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
body.titles #cursor { opacity: 0; }
.ring { position: absolute; z-index: 19; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,.95); box-shadow: 0 0 0 5px rgba(255,255,255,.25); pointer-events: none; animation: ring .6s ease-out forwards; }
@keyframes ring { from { transform: scale(.35); opacity: 1 } to { transform: scale(1.35); opacity: 0 } }
#caption { position: absolute; left: 50%; bottom: 26px; transform: translate(-50%, 8px); z-index: 15; padding: 11px 22px;
  border-radius: 999px; background: rgba(24, 10, 6, .62); color: #fff; font-size: 22px; font-weight: 600; letter-spacing: -.01em;
  white-space: nowrap; opacity: 0; transition: opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1); backdrop-filter: blur(6px); }
#caption.on { opacity: 1; transform: translate(-50%, 0); }
#caption .busy { display: inline-block; width: 14px; height: 14px; margin-right: 12px; border-radius: 50%; vertical-align: -1px;
  border: 2.5px solid rgba(255,255,255,.35); border-top-color: #fff; animation: spin .9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }
#note { position: absolute; right: 34px; bottom: 30px; z-index: 15; color: rgba(255,255,255,.72); font-size: 15px; }
.card { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #fff; text-align: center; opacity: 0; transition: opacity .9s ease; pointer-events: none; }
.card.on { opacity: 1; }
.card h1 { margin: 0; font-size: 92px; font-weight: 800; letter-spacing: -.035em; }
.card p { margin: 18px 0 0; font-size: 30px; font-weight: 500; opacity: .92; max-width: 1200px; line-height: 1.35; }
#outro h1 { font-size: 78px; line-height: 1.06; }
#outro p { margin-top: 26px; }
.card .mark { margin-bottom: 22px; padding: 7px 18px; border-radius: 999px; background: rgba(255,255,255,.16); font-size: 20px; font-weight: 700; letter-spacing: .02em; }
body.titles #stage { opacity: 0; transform: scale(.97); }
</style></head><body class="titles">
<div id="bg"></div><div id="grain"></div>
<div id="stage"><div id="win">
  <div id="bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="title">Edu Lab</span><span class="url">for teachers</span></div>
  <iframe id="app"></iframe>
</div></div>
<div id="caption"></div>
<div id="note">A real lesson, generated live · waiting time shortened</div>
<div id="intro" class="card on"><h1>Edu Lab</h1><p>A teacher describes a lesson in one sentence.<br>Edu Lab builds an interactive, checked simulation.</p></div>
<div id="outro" class="card"><div class="mark">Edu Lab</div><h1>Create interactive lessons<br>from one sentence.</h1><p>Edu Lab plans, builds and tests every step.<br>You review, adjust and approve.</p></div>
<div id="cursorWrap"><svg id="cursor" width="30" height="34" viewBox="0 0 30 34"><path d="M3 2 L3 26 L9.5 20 L14 31 L18.5 29 L14 18.5 L23 18.5 Z" fill="#111" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg></div>
</body></html>`;

async function main() {
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json()).catch(() => null);
  if (!health?.ok) throw new Error(`The app is not running at ${BASE} (start it with npm run dev)`);
  if (!health.hasKey) throw new Error("FIREWORKS_API_KEY is not set: the demo generates a real lesson");
  const work = mkdtempSync(join(tmpdir(), "edu-lab-video-"));
  const framesDir = join(work, "frames");
  mkdirSync(framesDir);
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const app = page.frameLocator("#app");
  const lesson = app.frameLocator("iframe.lesson-view");

  // ---- Frames (CDP screencast): every frame while acting, every 15th while waiting for the model.
  const cdp = await page.context().newCDPSession(page);
  await page.setContent(WRAPPER);
  // Headless Chrome captures only what fits its window, which it clamps to this computer's screen. Measure the
  // window's overhead with a tall window, then size it so the capture is exactly W × H.
  {
    const { windowId } = await cdp.send("Browser.getWindowForTarget");
    const tall = H + 300;
    await cdp.send("Browser.setWindowBounds", { windowId, bounds: { width: W, height: tall } });
    const shown = await new Promise<number>((resolve) => {
      cdp.once("Page.screencastFrame", (f) => {
        cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
        resolve(f.metadata.deviceHeight ?? H);
      });
      cdp.send("Page.startScreencast", { format: "jpeg", quality: 50, maxWidth: W, maxHeight: tall });
    });
    await cdp.send("Page.stopScreencast");
    await cdp.send("Browser.setWindowBounds", { windowId, bounds: { width: W, height: H + (tall - shown) } });
  }
  const frames: { file: string; ts: number }[] = [];
  cdp.on("Page.screencastFrame", (f) => {
    const file = join(framesDir, `${String(frames.length).padStart(6, "0")}.jpg`);
    writeFileSync(file, Buffer.from(f.data, "base64"));
    frames.push({ file, ts: f.metadata.timestamp ?? Date.now() / 1000 });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  const cast = async (everyNth: number) => {
    await cdp.send("Page.stopScreencast").catch(() => {});
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: everyNth });
  };
  const fast: { from: number; to: number; seconds: number }[] = []; // frame ranges to compress

  // ---- Helpers for the wrapper page.
  const js = (fn: string) => page.evaluate(fn);
  const caption = async (text: string, busy = false) => {
    await js(`(() => { const c = document.getElementById("caption"); c.classList.remove("on");
      setTimeout(() => { c.innerHTML = ${JSON.stringify(text ? (busy ? '<span class="busy"></span>' : "") : "")} + ${JSON.stringify(text)}; if (${JSON.stringify(text)}) c.classList.add("on"); }, 260); })()`);
    await sleep(700);
  };
  let cursor = { x: W / 2, y: H / 2 };
  const moveTo = async (x: number, y: number) => {
    const d = Math.hypot(x - cursor.x, y - cursor.y);
    cursor = { x, y };
    await js(`document.getElementById("cursor").style.transform = "translate(${x - 3}px, ${y - 2}px)"`);
    await page.mouse.move(x, y);
    await sleep(Math.min(900, 300 + d * 0.6));
  };
  const centre = async (l: Locator) => {
    const b = await l.boundingBox();
    if (!b) throw new Error(`Not on screen: ${l}`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const ring = (x: number, y: number) =>
    js(`(() => { const r = document.createElement("div"); r.className = "ring"; r.style.left = "${x}px"; r.style.top = "${y}px";
      document.body.appendChild(r); setTimeout(() => r.remove(), 700); })()`);
  const click = async (l: Locator, pauseAfter = 500) => {
    await l.scrollIntoViewIfNeeded();
    await sleep(250);
    const p = await centre(l);
    await moveTo(p.x, p.y);
    await ring(p.x, p.y);
    await sleep(120);
    await l.click();
    await sleep(pauseAfter);
  };
  const zoom = async (scale: number, at?: { x: number; y: number }) => {
    const o = at || { x: W / 2, y: H / 2 };
    await js(`(() => { const s = document.getElementById("stage"); s.style.transformOrigin = "${o.x}px ${o.y}px"; s.style.transform = "scale(${scale})"; })()`);
    await sleep(1100);
  };
  /** Wait for the model while the frames are thinned out; the wait becomes `seconds` long in the video. */
  const waitFor = async (text: string, done: Locator, seconds: number) => {
    await zoom(1);
    await caption(text, true);
    await cast(15);
    const from = frames.length;
    const failed = app.getByText(/could not be made|did not pass the checks/);
    for (const end = Date.now() + 420_000; ; ) {
      if (await done.isVisible().catch(() => false)) break;
      if (await failed.isVisible().catch(() => false)) throw new Error(`A stage failed in the app: ${await failed.textContent()}`);
      if (Date.now() > end) throw new Error(`Timed out waiting for: ${text}`);
      await sleep(800);
    }
    await sleep(500);
    fast.push({ from, to: frames.length, seconds });
    await cast(1);
  };

  // ---- The scene.
  await js(`document.getElementById("app").src = ${JSON.stringify(`${BASE}/#/`)}`);
  await app.locator(".lesson-card").first().waitFor({ timeout: 30_000 });
  await sleep(3000); // card pictures
  await cast(1);
  await sleep(3200); // title card
  await js(`document.getElementById("intro").classList.remove("on"); document.body.classList.remove("titles")`);
  await sleep(1600);

  await caption("1 · The teacher describes the lesson in one sentence");
  await click(app.getByRole("link", { name: "+ New lesson" }), 900);
  const box = app.locator("textarea").first();
  await box.waitFor();
  await zoom(1.15, await centre(box));
  await click(box, 200);
  await box.pressSequentially(request, { delay: 38 });
  await sleep(600);
  await click(app.getByRole("button", { name: audience, exact: true }), 700);
  await zoom(1);
  await click(app.getByRole("button", { name: "Plan the lesson" }), 300);

  await waitFor("The model plans the lesson: objectives and a simulation", app.getByRole("button", { name: "Approve and design the steps" }), 3);
  await caption("2 · The teacher reviews the plan and the learning objectives");
  await zoom(1.1, await centre(app.locator(".panel").first()));
  await sleep(4200);
  await zoom(1);
  await click(app.getByRole("button", { name: "Approve and design the steps" }), 300);

  await waitFor("The model writes five steps; code checks that each one can be solved", app.getByRole("button", { name: "Approve and build the lesson" }), 3.5);
  await caption("3 · The teacher reads the five steps");
  const list = await centre(app.locator(".levels").first());
  await moveTo(list.x + 200, list.y);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 170);
    await sleep(900);
  }
  await sleep(800);
  await click(app.getByRole("button", { name: "Approve and build the lesson" }), 300);

  await waitFor("The simulation is drawn, then every step is played in a real browser", lesson.locator("#check-btn"), 3.5);
  await caption("4 · The finished lesson opens as a preview");
  await sleep(2600);
  // Try step 1 like a student who asks for help: hints, then the worked solution, then Check.
  // Zoom towards the task card, but keep the window's left edge and the caption area in view.
  const card = await centre(lesson.locator(".card"));
  await zoom(1.1, { x: Math.min(card.x, WIN.x + WIN.w - 80), y: WIN.y + 80 });
  const hint = lesson.locator("#hint-btn");
  for (let i = 0; i < 4 && (await hint.isVisible().catch(() => false)); i++) {
    const label = (await hint.textContent()) || "";
    await click(hint, 1300);
    if (/solution/i.test(label)) break;
  }
  const setUp = lesson.locator(".hints li.solution button");
  if (await setUp.isVisible().catch(() => false)) await click(setUp, 1400);
  await click(lesson.locator("#check-btn"), 2800);
  await zoom(1);

  await caption("5 · Approve: the lesson joins the overview");
  await click(app.getByRole("button", { name: "Approve", exact: true }), 1800);
  await js(`document.getElementById("app").src = ${JSON.stringify(`${BASE}/#/`)}`);
  await app.locator(".lesson-card").first().waitFor();
  await moveTo(WIN.x + 260, WIN.y + 330);
  await sleep(4200);
  await caption("");
  await js(`document.getElementById("outro").classList.add("on"); document.body.classList.add("titles")`);
  await sleep(4200);
  await cdp.send("Page.stopScreencast");
  await browser.close();

  // ---- Edit: frame durations from their timestamps; compressed waits.
  const durations = frames.map((f, i) => (i + 1 < frames.length ? Math.max(0, frames[i + 1].ts - f.ts) : 1));
  for (const seg of fast) {
    const raw = durations.slice(seg.from, seg.to).reduce((a, b) => a + b, 0);
    for (let i = seg.from; i < seg.to; i++) durations[i] *= raw > 0 ? seg.seconds / raw : 0;
  }
  for (let i = 0; i < durations.length; i++) durations[i] /= SPEED;
  const list2 = ["ffconcat version 1.0", ...frames.flatMap((f, i) => [`file '${f.file}'`, `duration ${durations[i].toFixed(5)}`]), `file '${frames[frames.length - 1].file}'`];
  writeFileSync(join(work, "frames.ffconcat"), list2.join("\n"));
  const silent = join(work, "video.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(work, "frames.ffconcat"), "-vf", `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-movflags", "+faststart", silent]);
  const seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", silent]).toString().trim());
  const music = join(work, "music.wav");
  demoMusic(seconds + 0.5, music);
  const out = join(OUT, "creating-a-lesson.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", silent, "-i", music, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", "volume=0.7", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out]);
  rmSync(work, { recursive: true, force: true });
  console.log(`wrote ${out} (${seconds.toFixed(1)} s, ${frames.length} frames recorded)`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
