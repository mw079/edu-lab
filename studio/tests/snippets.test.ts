import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { catalog, snippet } from "../server/catalog.ts";
import { readFileSync } from "node:fs";
import { simkitSource } from "../server/lesson.ts";

const LAYOUT_CHECK = readFileSync("server/layout-check.js", "utf8");

// Every catalogue snippet is shown to the model as a pattern to copy, so each must run without errors.
test("every catalogue snippet draws cleanly (no errors, no overlaps) and runs its actions", { timeout: 60_000 }, async () => {
  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  try {
    for (const { id } of catalog()) {
      const src = snippet(id);
      const state = src.match(/Example state: (\{[^}]*\})/)?.[1];
      assert.ok(state, `${id}: snippet needs an "Example state: {…}" comment`);
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setContent(`<div class="stage" style="width:1000px;height:560px"></div><script>${simkitSource()}</script>`);
      const result = await page.evaluate(
        async ([code, stateSrc, layoutSrc]) => {
          const scene = new Function(`return (${code})`)();
          const s = new Function(`return (${stateSrc})`)();
          const kit = (window as any).simkit;
          const view = scene(kit.stage(document.querySelector(".stage"), { width: 1000, height: 560 }), kit);
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
        [src.split("\n").filter((l) => !l.startsWith("//")).join("\n"), state, LAYOUT_CHECK] as const
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
