// Usage: npm run export
// Writes the lessons listed in showcase.json as static pages to ../docs (GitHub Pages can serve that folder):
// docs/index.html, docs/lessons/<name>.html (each one self-contained and offline) and docs/thumbs/<name>.png.
// Costs nothing: it only assembles lessons that already exist.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { audienceLevel } from "../server/audience.ts";
import { lessonSourceFromDir } from "../server/design.ts";
import { ROOT } from "../server/env.ts";
import { escapeHtml } from "../server/html.ts";
import { buildLessonHtml } from "../server/lesson.ts";
import { DATA, getDraft } from "../server/pipeline.ts";
import { thumbnail } from "../server/thumbnail.ts";

const OUT = join(ROOT, "..", "docs");
const list = JSON.parse(readFileSync(join(ROOT, "showcase.json"), "utf8")) as { id: string; try: string }[];

// Showcase lessons live in examples/ (committed). A generated lesson in data/ (not committed) also works, but
// then the export only works on this machine; copy its design.json and scene.js to examples/<name>/ to keep it.
function source(id: string): { js: string; title: string; audience?: string } | null {
  const example = join(ROOT, "examples", id);
  if (existsSync(join(example, "design.json"))) {
    const design = JSON.parse(readFileSync(join(example, "design.json"), "utf8"));
    return { js: lessonSourceFromDir(example), title: design.title, audience: design.audience };
  }
  const draft = getDraft(id);
  const generated = join(DATA, id, "lesson.js");
  return draft?.design && existsSync(generated) ? { js: readFileSync(generated, "utf8"), title: draft.design.title, audience: draft.audience } : null;
}

// Check every lesson before deleting the old pages, so a missing lesson never removes a published one.
const lessons = list.map((item) => ({ item, lesson: source(item.id) }));
const missing = lessons.filter((l) => !l.lesson).map((l) => l.item.id);
if (missing.length) {
  console.error(`Not exported: no lesson found for ${missing.join(", ")} (looked in examples/ and data/lessons/). docs/ is unchanged.`);
  process.exit(1);
}
for (const dir of ["lessons", "thumbs"]) {
  rmSync(join(OUT, dir), { recursive: true, force: true });
  mkdirSync(join(OUT, dir), { recursive: true });
}

const cards: string[] = [];
for (const { item, lesson: found } of lessons) {
  const lesson = found!; // checked above
  const html = buildLessonHtml(lesson.js, lesson.title);
  // A readable file name: the id without a generated lesson's random suffix.
  const name = item.id.replace(/-[0-9a-f]{6}$/, "").replace(/-+$/, "");
  writeFileSync(join(OUT, "lessons", `${name}.html`), html.replace('<html lang="en">', '<html lang="en" data-back="../index.html">'));
  copyFileSync(await thumbnail(item.id, html), join(OUT, "thumbs", `${name}.png`));
  cards.push(`<li><a href="lessons/${name}.html"><div class="thumb"><img src="thumbs/${name}.png" alt="" width="1000" height="560" loading="lazy"></div><h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(audienceLevel(lesson.audience))} · ${escapeHtml(item.try)}</p></a></li>`);
  console.log(`wrote ${name}.html  (${Math.round(html.length / 1024)} kB)`);
}

writeFileSync(
  join(OUT, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Edu Lab: example lessons</title>
<style>
${readFileSync(join(ROOT, "template", "tokens.css"), "utf8")}
body { margin: 0; font-family: var(--font); background: var(--bg); color: var(--ink); }
main { max-width: 1152px; margin: 0 auto; padding: 48px 24px 72px; }
h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.lead { margin: 0 0 40px; max-width: 65ch; font-size: 16px; line-height: 1.55; color: var(--muted); }
ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 36px 24px; }
a { display: block; color: inherit; text-decoration: none; }
.thumb { aspect-ratio: 1000 / 560; border-radius: 14px; overflow: hidden; background: var(--paper); box-shadow: var(--shadow); }
.thumb img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 400ms var(--ease-out); }
@media (hover: hover) and (pointer: fine) { a:hover .thumb img { transform: scale(1.03); } }
a:focus-visible { outline: none; }
a:focus-visible .thumb { outline: 2px solid var(--accent); outline-offset: 3px; }
h2 { margin: 12px 0 2px; font-size: 15.5px; font-weight: 600; line-height: 1.35; }
li p { margin: 0; font-size: 14px; line-height: 1.45; color: var(--muted); }
@media (prefers-reduced-motion: reduce) { .thumb img { transition: none; } }
</style>
</head>
<body>
<main>
<h1>Edu Lab</h1>
<p class="lead">Interactive science lessons generated from a teacher's one-sentence request. Each lesson has five steps and then free exploration; where a dashed ring marks an object, it can be dragged. Every page is one self-contained file and no AI runs while it is used.</p>
<ul>
${cards.join("\n")}
</ul>
</main>
</body>
</html>
`,
);
console.log(`wrote index.html with ${cards.length} lessons → ${OUT}`);
process.exit(0);
