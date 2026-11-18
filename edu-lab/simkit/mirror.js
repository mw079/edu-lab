/* simkit.mirror: the law of reflection on a flat mirror, and parallel rays meeting at the focus of a concave one. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=400, y=440 (where the ray hits the mirror), angle=40 (angle of incidence from the normal, 0–85),
   *         curved=0 (0 = flat mirror with one ray; 1 = concave mirror with parallel rays meeting at the focus),
   *         focal=15 (cm, 5–25, concave only; 10 px per cm), showReflected=true,
   *         drag: { angle: app.link("key") } (flat mirror: the student swings the incoming ray by its end) }
   * Returns { update({ angle, curved, focal }), show({ reflected }), values() }
   * values() -> { incidence, reflection (deg, equal), focal (cm) }   concave images: simkit.physics.mirror(f, d)
   */
  kit.mirror = function (stage, opts) {
    const o = Object.assign({ x: 400, y: 440, angle: 40, curved: 0, focal: 15, showReflected: true }, opts);
    const g = stage.layer({ class: "simkit-mirror" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const swing = o.drag && o.drag.angle;
    const LEN = 270;
    const dragger = kit.drag(stage, handle, swing, (p) => swing(p.y >= o.y ? 85 : kit.clamp((Math.atan2(o.x - p.x, o.y - p.y) * 180) / Math.PI, 0, 85)));
    const sol = () => ({ incidence: o.angle, reflection: o.angle, focal: o.focal });
    const arc = (from, to, r) => {
      const p = (d) => [o.x + r * Math.sin((d * Math.PI) / 180), o.y - r * Math.cos((d * Math.PI) / 180)];
      const [x1, y1] = p(from);
      const [x2, y2] = p(to);
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 ${to > from ? 1 : 0} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    };

    function flat() {
      const t = (o.angle * Math.PI) / 180;
      // Mirror: a silver line with hatching behind it.
      kit.el("line", { x1: o.x - 260, y1: o.y, x2: o.x + 260, y2: o.y, stroke: kit.colors.steel, "stroke-width": 6 }, pic);
      for (let hx = o.x - 255; hx <= o.x + 255; hx += 18) kit.el("line", { x1: hx, y1: o.y + 4, x2: hx - 12, y2: o.y + 18, stroke: kit.colors.steel, "stroke-width": 2 }, pic);
      kit.el("text", { x: o.x + 270, y: o.y + 6, "text-anchor": "start", class: "simkit-label", fill: kit.colors.ink, text: "mirror" }, pic);
      // Normal.
      kit.el("line", { x1: o.x, y1: o.y, x2: o.x, y2: o.y - LEN - 20, stroke: kit.colors.muted, "stroke-width": 1.5, "stroke-dasharray": "6 6" }, pic);
      kit.el("text", { x: o.x, y: o.y - LEN - 28, "text-anchor": "middle", class: "simkit-tick", text: "normal" }, pic);
      // Incoming ray (from the upper left) and reflected ray (to the upper right).
      const ix = o.x - Math.sin(t) * LEN;
      const iy = o.y - Math.cos(t) * LEN;
      kit.el("line", { x1: ix, y1: iy, x2: o.x, y2: o.y, stroke: kit.colors.orange, "stroke-width": 4 }, pic);
      kit.arrowShape(pic, ix, iy, o.x - Math.sin(t) * LEN * 0.45, o.y - Math.cos(t) * LEN * 0.45, { color: kit.colors.orange, width: 4, head: 14 });
      kit.el("path", { d: arc(-o.angle, 0, 50), fill: "none", stroke: kit.colors.orange, "stroke-width": 2 }, pic);
      // Angle labels sit beside their ray, on the side away from the normal (so no line crosses them).
      kit.el("text", { x: o.x - Math.sin(t) * LEN * 0.62 - Math.cos(t) * 16, y: o.y - Math.cos(t) * LEN * 0.62 + Math.sin(t) * 16 + 5, "text-anchor": "end", class: "simkit-label", fill: kit.colors.orange, text: `i = ${kit.fmt(o.angle, 0)}°` }, pic);
      if (o.showReflected) {
        const rx = o.x + Math.sin(t) * LEN;
        const ry = o.y - Math.cos(t) * LEN;
        kit.el("line", { x1: o.x, y1: o.y, x2: rx, y2: ry, stroke: kit.colors.red, "stroke-width": 4 }, pic);
        kit.arrowShape(pic, o.x + Math.sin(t) * LEN * 0.4, o.y - Math.cos(t) * LEN * 0.4, o.x + Math.sin(t) * LEN * 0.7, o.y - Math.cos(t) * LEN * 0.7, { color: kit.colors.red, width: 4, head: 14 });
        kit.el("path", { d: arc(0, o.angle, 64), fill: "none", stroke: kit.colors.red, "stroke-width": 2 }, pic);
      }
      kit.el("text", { x: o.x + Math.sin(t) * LEN * 0.62 + Math.cos(t) * 16, y: o.y - Math.cos(t) * LEN * 0.62 + Math.sin(t) * 16 + 5, "text-anchor": "start", class: "simkit-label", fill: kit.colors.red, text: o.showReflected ? `r = ${kit.fmt(o.angle, 0)}°` : "r = ?" }, pic);
      handle.textContent = "";
      if (kit.linked(swing)) kit.grip(handle, ix, iy, 22);
      else kit.el("circle", { cx: ix, cy: iy, r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      dragger.refresh();
    }

    function concave() {
      handle.textContent = "";
      dragger.refresh();
      // A shallow concave mirror (part of a circle of radius 2f) facing up; rays come straight down.
      const f = kit.clamp(o.focal, 5, 25) * 10;
      const R = 2 * f;
      const half = 200;
      // How far the mirror rises above its lowest point at a distance dx from the middle (it curves up at the ends).
      const sag = (dx) => R - Math.sqrt(Math.max(0, R * R - dx * dx));
      let d = "";
      for (let dx = -half; dx <= half; dx += 10) d += `${dx === -half ? "M" : "L"} ${o.x + dx} ${(o.y - sag(dx)).toFixed(1)} `;
      kit.el("path", { d, fill: "none", stroke: kit.colors.steel, "stroke-width": 6 }, pic);
      kit.el("line", { x1: o.x, y1: o.y, x2: o.x, y2: o.y - 330, stroke: kit.colors.muted, "stroke-width": 1.5, "stroke-dasharray": "6 6" }, pic);
      const F = { x: o.x, y: o.y - f };
      for (const dx of [-150, -80, 80, 150]) {
        const hy = o.y - sag(dx);
        kit.el("line", { x1: o.x + dx, y1: o.y - 330, x2: o.x + dx, y2: hy, stroke: kit.colors.orange, "stroke-width": 3 }, pic);
        kit.arrowShape(pic, o.x + dx, o.y - 330, o.x + dx, o.y - 250, { color: kit.colors.orange, width: 3, head: 12 });
        if (o.showReflected) {
          // Reflected through the focus (paraxial rule), drawn a little past it.
          const ex = F.x + (F.x - (o.x + dx)) * 0.35;
          const ey = F.y + (F.y - hy) * 0.35;
          kit.el("line", { x1: o.x + dx, y1: hy, x2: ex, y2: ey, stroke: kit.colors.red, "stroke-width": 3 }, pic);
        }
      }
      if (o.showReflected) {
        kit.el("circle", { cx: F.x, cy: F.y, r: 6, fill: kit.colors.ink }, pic);
        kit.el("text", { x: F.x + 16, y: F.y + 5, "text-anchor": "start", class: "simkit-label", fill: kit.colors.ink, text: "F" }, pic);
      }
      kit.el("text", { x: o.x + 230, y: o.y - 30, "text-anchor": "start", class: "simkit-label", fill: kit.colors.ink, text: o.showReflected ? `f = ${kit.fmt(o.focal, 0)} cm` : "f = ? cm" }, pic);
      kit.el("text", { x: o.x + 230, y: o.y - 4, "text-anchor": "start", class: "simkit-tick", text: "concave mirror" }, pic);
    }

    function draw() {
      pic.textContent = "";
      if (o.curved) concave();
      else flat();
    }

    draw();

    return {
      update(next) {
        for (const key of ["angle", "curved", "focal"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ reflected: false }) removes the reflected ray(s) and writes "r = ?" (flat) or "f = ? cm" (concave). */
      show(which) {
        if (which.reflected != null) o.showReflected = which.reflected;
        draw();
      },
      values: sol,
    };
  };
})();
