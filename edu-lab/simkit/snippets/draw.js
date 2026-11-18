// Basic drawing on the stage (1000 × 560 units, y grows downwards):
//   const g = stage.layer();                       a group to draw into
//   kit.el(tag, attrs, parent) → element           tags: rect, circle, ellipse, line, path, polygon, text, g
//   kit.set(el, attrs)                             change attributes later (attrs.text sets text)
//   kit.colors: ink muted line paper red blue green yellow orange purple steel
//   text classes: "simkit-label" (bold 16px), "simkit-tick" (small grey)
//   stage.animate(seconds, (progress, t) => { … }) → Promise   for a short animation in an action
//   kit.fmt(number, digits), kit.clamp(v, min, max), kit.lerp(a, b, t)
// Example state: { h: 20 }   (a ball held at height h above the ground, dropped by an action)
function (stage, kit) {
  const g = stage.layer();
  const groundY = 500;
  const PX = 20; // pixels per metre
  kit.el("line", { x1: 100, y1: groundY, x2: 900, y2: groundY, stroke: kit.colors.ink, "stroke-width": 3 }, g);
  const ball = kit.el("circle", { cx: 500, r: 18, fill: kit.colors.orange }, g);
  const label = kit.el("text", { x: 540, class: "simkit-label" }, g);
  let current = 0;
  const place = (h) => {
    kit.set(ball, { cy: groundY - 18 - h * PX });
    kit.set(label, { y: groundY - 12 - h * PX, text: `h = ${kit.fmt(h, 1)} m` });
  };
  return {
    update(s) { current = s.h; place(s.h); },
    reset(s) { place(s.h); },
    drop(s) { return stage.animate(1.2, (p) => place(s.h * (1 - p * p))); },
  };
}
