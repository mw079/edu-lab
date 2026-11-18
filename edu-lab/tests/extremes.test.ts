// Every component at the ends of its slider ranges. The other snippet tests draw each component at its example
// state only; lessons use the whole documented range, and the ends are where labels collide or leave the stage.
// The ranges come from each snippet's comment: for every number in the example state, the first "a–b", "a…b" or
// "a to b" written after that key, unless the key's own note closed before it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { chromium } from "playwright";
import { catalog, snippet } from "../server/catalog.ts";
import { simkitSource } from "../server/lesson.ts";

const LAYOUT_CHECK = readFileSync("server/layout-check.js", "utf8");

/** The documented range of each numeric key of the example state. */
export function documentedRanges(src: string, example: string): [string, number, number][] {
  const comment = src
    .split("\n")
    .filter((l) => l.startsWith("//"))
    .join(" ")
    .replace(/−/g, "-");
  const keys = [...example.matchAll(/(\w+)\s*:\s*-?\d/g)].map((m) => m[1]);
  const ranges: [string, number, number][] = [];
  for (const key of keys) {
    // The first mention of the key that is followed by its range. A mention whose own note closes before the range
    // does not count: that range belongs to a later key ("a (axis, AU), e (eccentricity 0–0.8)"); a shared note is
    // fine ("driver, driven (teeth, 8–32)").
    const pattern = new RegExp(`\\b${key}\\b(?=([^;\\n]{0,70}?)(-?\\d+(?:\\.\\d+)?)\\s*(?:–|…|to)\\s*(-?\\d+(?:\\.\\d+)?))`, "g");
    const m = [...comment.matchAll(pattern)].find((x) => !x[1].includes(")") && Number(x[3]) > Number(x[2]));
    if (m) ranges.push([key, Number(m[2]), Number(m[3])]);
  }
  return ranges;
}

test("every component draws cleanly at the ends of its documented slider ranges", { timeout: 300_000 }, async () => {
  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  const problems: string[] = [];
  let states = 0;
  try {
    for (const { id } of catalog()) {
      const src = snippet(id);
      const example = src.match(/Example state: (\{[^}]*\})/)?.[1];
      if (!example) continue;
      const code = src.split("\n").filter((l) => !l.startsWith("//")).join("\n");
      const page = await browser.newPage({ viewport: { width: 1000, height: 560 }, reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setContent(`<div class="stage" style="width:1000px;height:560px"></div><script>${simkitSource(code)}</script>`);
      // Built from strings: the test runner's compiler would otherwise add helpers the page does not have.
      await page.evaluate(`(() => {
        const kit = window.simkit;
        const app = { link: function (k) { var f = function () {}; f.key = k; f.enabled = function () { return true; }; return f; } };
        window.__view = (${code})(kit.stage(document.querySelector(".stage"), { width: 1000, height: 560 }), kit, app);
      })()`);
      const base = (await page.evaluate(`(${example})`)) as Record<string, unknown>;
      const ranges = documentedRanges(src, example).filter(([k]) => k in base);
      const variants: [string, Record<string, unknown>][] = [["example", base]];
      for (const [key, lo, hi] of ranges) variants.push([`${key}=${lo}`, { ...base, [key]: lo }], [`${key}=${hi}`, { ...base, [key]: hi }]);
      if (ranges.length > 1) {
        variants.push(["all at their minimum", { ...base, ...Object.fromEntries(ranges.map(([k, lo]) => [k, lo])) }]);
        variants.push(["all at their maximum", { ...base, ...Object.fromEntries(ranges.map(([k, , hi]) => [k, hi])) }]);
      }
      for (const [name, s] of variants) {
        states++;
        const before = errors.length;
        const r = (await page.evaluate(`(() => {
          const s = ${JSON.stringify(s)};
          try { window.__view.update(s, s, { level: 0, solved: false, hidden: new Set() }); }
          catch (e) { return { thrown: String((e && e.message) || e) }; }
          const bad = [].concat(...[...document.querySelectorAll("svg *")].map((el) => [...el.attributes].filter((a) => /NaN|Infinity/.test(a.value)).map((a) => el.tagName + "." + a.name)));
          const text = [...document.querySelectorAll("svg text")].map((t) => t.textContent).filter((t) => /NaN|undefined|Infinity/.test(t));
          return { bad: bad.slice(0, 2), text: text.slice(0, 2), layout: ${LAYOUT_CHECK} };
        })()`)) as { thrown?: string; bad?: string[]; text?: string[]; layout?: string[] };
        const found = [
          ...(r.thrown ? [`update() throws: ${r.thrown}`] : []),
          ...errors.slice(before).map((e) => `page error: ${e}`),
          ...(r.bad || []).map((b) => `NaN or Infinity in ${b}`),
          ...(r.text || []).map((t) => `text shows "${t}"`),
          ...(r.layout || []),
        ];
        for (const f of found) problems.push(`${id} (${name}): ${f}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  assert.ok(states > 400, `only ${states} states were drawn: the range parsing found too few ranges`);
  assert.deepEqual(problems, []);
});
