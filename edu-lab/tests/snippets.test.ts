import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { catalog, snippet } from "../server/catalog.ts";
import { readFileSync } from "node:fs";
import { simkitSource } from "../server/lesson.ts";

const LAYOUT_CHECK = readFileSync("server/layout-check.js", "utf8");

// Every catalogue snippet is shown to the model as a pattern to copy, so each must run without errors.
test("every catalogue snippet draws cleanly (no errors, no overlaps) and runs its actions", { timeout: 120_000 }, async () => {
  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  try {
    for (const { id } of catalog()) {
      const src = snippet(id);
      const state = src.match(/Example state: (\{[^}]*\})/)?.[1];
      assert.ok(state, `${id}: snippet needs an "Example state: {…}" comment`);
      const code = src.split("\n").filter((l) => !l.startsWith("//")).join("\n");
      const page = await browser.newPage({ reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      // Only the files the snippet uses, as in a real lesson: a missing dependency shows up as an error here.
      await page.setContent(`<div class="stage" style="width:1000px;height:560px"></div><script>${simkitSource(code)}</script>`);
      const result = await page.evaluate(
        async ([code, stateSrc, layoutSrc]) => {
          const scene = new Function(`return (${code})`)();
          const s = new Function(`return (${stateSrc})`)();
          const kit = (window as any).simkit;
          // A stand-in for the lesson page's app: every link is enabled and accepts any value.
          // (Built from a string: the test runner's compiler would otherwise add helpers the page does not have.)
          const app = new Function("return { link: function (key) { var f = function () {}; f.key = key; f.enabled = function () { return true; }; return f; } }")();
          const view = scene(kit.stage(document.querySelector(".stage"), { width: 1000, height: 560 }), kit, app);
          view.update(s, s, { level: 0, solved: false, hidden: new Set() });
          if (view.reset) view.reset(s);
          const layout = (0, eval)(layoutSrc);
          const methods = Object.keys(view).filter((k) => !["update", "reset", "stop"].includes(k));
          for (const m of methods) {
            const p = view[m](s, s);
            if (view.stop) view.stop();
            await Promise.race([p, new Promise((r) => setTimeout(r, 300))]);
          }
          return { methods, layout, shapes: document.querySelectorAll("svg *").length };
        },
        [code, state, LAYOUT_CHECK] as const
      );
      assert.deepEqual(errors, [], `${id}: ${errors.join("; ")}`);
      assert.ok(result.shapes > 5, `${id}: draws something`);
      assert.deepEqual(result.layout, [], `${id}: layout problems`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test("the circuit switches between series and parallel when a step changes its layout", { timeout: 30_000 }, async () => {
  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    await page.setContent(`<div class="stage" style="width:1000px;height:560px"></div><script>${simkitSource()}</script>`);
    // Passed as a string: the test runner's compiler would otherwise add helpers the page does not have.
    const r = (await page.evaluate(`(() => {
      const kit = window.simkit;
      const c = kit.circuit(kit.stage(document.querySelector(".stage"), { width: 1000, height: 560 }), {
        layout: "series", V: 12, parts: [{ id: "R1", R: 6 }, { id: "R2", R: 6 }], flow: false,
      });
      const vertical = () => document.querySelectorAll('[transform*="rotate(90)"]').length;
      const series = { current: c.values().current, vertical: vertical() };
      c.update({ layout: "parallel" });
      return { series, parallel: { current: c.values().current, vertical: vertical() } };
    })()`)) as { series: unknown; parallel: unknown };
    assert.deepEqual(r.series, { current: 1, vertical: 0 }); // 12 V / 12 Ω, parts drawn along the top wire
    assert.deepEqual(r.parallel, { current: 4, vertical: 2 }); // 12 V / 3 Ω, parts drawn as vertical branches
  } finally {
    await browser.close();
  }
});

// Components with direct interaction: grabbing (or clicking) the object must call the linked control.
test("draggable and clickable components call their links", { timeout: 120_000 }, async () => {
  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  try {
    const ids = ["pendulum", "numberLine", "lever", "lens", "scatterPlot", "binaryBits",
      "springMass", "cartTrack", "projectile", "rightTriangle", "fractionBars", "logicGate", "barChart", "charges", "coordinatePlane", "protractor", "incline", "refraction", "wave", "orbit",
      "membrane", "dnaStrand", "mitosis", "predatorPrey", "plateBoundary", "waterCycle", "vectorSum", "unitCircle",
      "phScale", "gravityPair", "solarSystem", "starLife", "tippingPoint", "codonChain", "robotGrid", "cuboidNet", "ratioLine", "samplingBox",
      "cellRespiration", "heartLungs", "foodWeb", "landUse", "buffer", "oceanGyre", "feedbackLoop", "earthquake", "heatEngine", "openSets", "shapeBuilder", "axisTrick", "confidenceIntervals", "pulley", "gearTrain",
      "magnetCoil", "electromagnet", "mirror", "circularMotion", "periodicTable", "equilibrium", "enzyme", "cellParts", "rockCycle", "transformShape"];
    for (const id of ids) {
      const src = snippet(id);
      const state = src.match(/Example state: (\{[^}]*\})/)![1];
      const code = src.split("\n").filter((l) => !l.startsWith("//")).join("\n");
      const page = await browser.newPage({ viewport: { width: 1000, height: 560 }, reducedMotion: "reduce" });
      await page.setContent(`<body style="margin:0"><div class="stage" style="width:1000px;height:560px"></div><script>${simkitSource(code)}</script>`);
      // The stand-in app records every value a link receives; update() is called again as the real app would.
      await page.evaluate(`(() => {
        const kit = window.simkit;
        const s = ${state};
        window.__calls = [];
        const app = { link: function (key) { var f = function (v) { window.__calls.push([key, v]); }; f.key = key; f.enabled = function () { return true; }; return f; } };
        const view = (${code})(kit.stage(document.querySelector(".stage"), { width: 1000, height: 560 }), kit, app);
        view.update(s, s, { level: 0, solved: false, hidden: new Set() });
      })()`);
      const handle = page.locator(`svg [style*="cursor: grab"], svg [style*="cursor: pointer"]`).first();
      const box = await handle.boundingBox();
      assert.ok(box, `${id}: has something to grab`);
      const x = box!.x + box!.width / 2;
      const y = box!.y + box!.height / 2;
      const clickable = (await handle.evaluate((el) => (el as SVGElement).style.cursor)) === "pointer";
      if (clickable) await page.mouse.click(x, y);
      else {
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 40, y - 30);
        await page.mouse.up();
      }
      const calls = (await page.evaluate(`window.__calls`)) as [string, unknown][];
      assert.ok(calls.length > 0, `${id}: the link was called`);
      assert.ok(calls.every(([, v]) => typeof v === "number" && Number.isFinite(v)), `${id}: links get numbers (${JSON.stringify(calls.slice(0, 3))})`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
