// Geometry checks run inside the lesson page (plain JS, evaluated by Playwright): overlapping labels,
// text on top of other components' shapes, overlapping components, and text cut off at the stage edge.
// Returns messages in stage units that a model can act on.
(() => {
  const svg = document.querySelector(".stage svg");
  if (!svg) return [];
  const vb = svg.viewBox.baseVal;
  // The stage scales to fit its box (letterboxed), so map screen pixels through the SVG's own transform.
  const m = svg.getScreenCTM();
  const toStage = (r) => ({ x: (r.left - m.e) / m.a, y: (r.top - m.f) / m.d, w: r.width / m.a, h: r.height / m.d });
  const area = (r) => r.w * r.h;
  const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const where = (r) => `x≈${Math.round(r.x)}, y≈${Math.round(r.y)}`;
  const visible = (el) => {
    for (let n = el; n && n !== svg; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    }
    return true;
  };
  const layers = [...svg.children].filter((c) => c.tagName === "g");
  const layerName = (g) => (g.getAttribute("class") || "").match(/simkit-(\w+)/)?.[1] || "your drawing";
  const layerOf = (el) => layers.find((g) => g.contains(el));

  const texts = [...svg.querySelectorAll("text")]
    .filter((t) => (t.textContent || "").trim() && visible(t))
    .map((t) => ({ t, r: toStage(t.getBoundingClientRect()), layer: layerOf(t), label: (t.textContent || "").trim().slice(0, 30) }));
  const issues = new Set();

  // The app already shows the title, the goal and the readouts; the stage should only label things.
  const config = (window.__lesson && window.__lesson.config) || {};
  const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const labels = (config.readouts || []).map((r) => norm(r.label)).filter((l) => l.length > 3);
  // Only the scene's own text is judged here: a component's labels (a legend entry, a bar's name) are part of
  // its design and may happen to start with the same word as a readout.
  const fromComponent = (a) => /simkit-(?!vector)/.test((a.layer && a.layer.getAttribute("class")) || "");
  for (const a of texts) {
    if (fromComponent(a)) continue;
    const t = norm(a.t.textContent);
    if (config.title && t === norm(config.title)) issues.add(`Remove the title text "${a.label}" from the stage; the app shows the title.`);
    else if (labels.some((l) => t.startsWith(l))) issues.add(`Remove "${a.label}" from the stage; that value is already shown under the simulation.`);
    else if (t.length > 45) issues.add(`Text "${a.label}…" is too long for the stage; use short labels and leave explanations to the step card.`);
  }
  for (const a of texts) {
    if (a.r.x < -2 || a.r.y < -2 || a.r.x + a.r.w > vb.width + 2 || a.r.y + a.r.h > vb.height + 2)
      issues.add(`Text "${a.label}" is cut off at the edge of the stage (${where(a.r)}); the stage is ${vb.width} × ${vb.height}.`);
  }
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (inter(a.r, b.r) > 0.15 * Math.min(area(a.r), area(b.r)))
        issues.add(`Text "${a.label}" overlaps text "${b.label}" (${where(a.r)}). Move one of them.`);
    }

  // Text from one layer drawn on top of a small shape (block, cart, ball) from another layer.
  const stageArea = vb.width * vb.height;
  const shapes = [...svg.querySelectorAll("rect, circle, ellipse, polygon, path")]
    .filter((s) => visible(s) && layerOf(s))
    .map((s) => ({ s, r: toStage(s.getBoundingClientRect()), layer: layerOf(s) }))
    .filter((x) => area(x.r) > 200 && area(x.r) < 0.05 * stageArea);
  for (const a of texts)
    for (const s of shapes)
      if (s.layer !== a.layer && inter(a.r, s.r) > 0.25 * area(a.r))
        issues.add(`Text "${a.label}" (${layerName(a.layer)}) is drawn on top of a shape from ${layerName(s.layer)} at ${where(s.r)}. Move the text.`);

  // Text crossed by a straight line (ruler, tick, axis, dashed marker) from another layer — e.g. a second ruler
  // drawn over a component's own ruler.
  const lines = [...svg.querySelectorAll("line")]
    .filter((l) => visible(l) && layerOf(l))
    .map((l) => ({ r: toStage(l.getBoundingClientRect()), layer: layerOf(l) }))
    .filter((l) => l.r.w < 4 || l.r.h < 4);
  for (const a of texts)
    for (const l of lines) {
      if (l.layer === a.layer) continue;
      const t = a.r;
      const crossV = l.r.w < 4 && l.r.x > t.x + 2 && l.r.x < t.x + t.w - 2 && Math.min(t.y + t.h, l.r.y + l.r.h) - Math.max(t.y, l.r.y) > 0.4 * t.h;
      const crossH = l.r.h < 4 && l.r.y > t.y + 2 && l.r.y < t.y + t.h - 2 && Math.min(t.x + t.w, l.r.x + l.r.w) - Math.max(t.x, l.r.x) > 0.3 * t.w;
      if (crossV || crossH) issues.add(`Text "${a.label}" (${layerName(a.layer)}) is crossed by a line from ${layerName(l.layer)} at ${where(t)}. Components draw their own rulers and labels; remove duplicates or move the text.`);
    }

  // Two components on top of each other.
  const comps = layers.filter((g) => /simkit-(?!vector)/.test(g.getAttribute("class") || "") && visible(g)).map((g) => ({ g, r: toStage(g.getBoundingClientRect()) }));
  for (let i = 0; i < comps.length; i++)
    for (let j = i + 1; j < comps.length; j++) {
      const a = comps[i], b = comps[j];
      if (inter(a.r, b.r) > 0.08 * Math.min(area(a.r), area(b.r)))
        issues.add(`Component ${layerName(a.g)} (x ${Math.round(a.r.x)}–${Math.round(a.r.x + a.r.w)}, y ${Math.round(a.r.y)}–${Math.round(a.r.y + a.r.h)}) overlaps ${layerName(b.g)} (x ${Math.round(b.r.x)}–${Math.round(b.r.x + b.r.w)}, y ${Math.round(b.r.y)}–${Math.round(b.r.y + b.r.h)}). Give each its own area of the 1000 × 560 stage.`);
    }
  return [...issues];
})()
