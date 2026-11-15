/* simkit.refraction: a light ray crossing the boundary between two transparent materials. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=120, y=70, w=520, h=420, n1=1 (upper material), n2=1.5 (lower material), angle=30 (deg from the
   *         normal, 0–89), label1="air", label2="glass", showRefracted=true (the ray and angle in material 2),
   *         drag: { angle: app.link("key") } (the student swings the incoming ray) }
   * The ray comes from the upper left, hits the boundary in the middle and continues into the lower material;
   * above the critical angle it is totally reflected instead.
   * Returns { update({ n1, n2, angle, label1, label2 }), showRefracted(bool), values() }
   * values() -> { theta2 (deg or null), tir, critical (deg or null) }
   */
  kit.refraction = function (stage, opts) {
    const o = Object.assign({ x: 120, y: 70, w: 520, h: 420, n1: 1, n2: 1.5, angle: 30, label1: "air", label2: "glass", showRefracted: true }, opts);
    const g = stage.layer({ class: "simkit-refraction" });
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    const len = Math.min(o.w, o.h) / 2 - 24;

    const upper = kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h / 2 }, g);
    const lower = kit.el("rect", { x: o.x, y: cy, width: o.w, height: o.h / 2 }, g);
    kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, fill: "none", stroke: kit.colors.steel, "stroke-width": 2 }, g);
    kit.el("line", { x1: o.x, y1: cy, x2: o.x + o.w, y2: cy, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    kit.el("line", { x1: cx, y1: o.y + 12, x2: cx, y2: o.y + o.h - 12, stroke: kit.colors.muted, "stroke-dasharray": "6 6" }, g);
    const name1 = kit.el("text", { x: o.x + o.w - 14, y: o.y + 28, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink }, g);
    const name2 = kit.el("text", { x: o.x + o.w - 14, y: o.y + o.h - 16, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink }, g);
    const rays = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const swing = o.drag && o.drag.angle;
    // The ray comes from the upper left: the angle is measured from the normal, and never passes the boundary.
    const dragger = kit.drag(stage, handle, swing, (p) => swing(p.y >= cy ? 89 : kit.clamp((Math.atan2(cx - p.x, cy - p.y) * 180) / Math.PI, 0, 89)));
    const a1 = kit.el("text", { class: "simkit-label", fill: kit.colors.orange }, g);
    const a2 = kit.el("text", { class: "simkit-label", fill: kit.colors.red }, g);

    const sol = () => kit.physics.snell(o.n1, o.n2, o.angle);
    // A denser material (higher n) is drawn darker.
    const tint = (n) => `rgba(74, 127, 224, ${kit.clamp((n - 1) * 0.34, 0, 0.5).toFixed(2)})`;
    const arcPath = (fromDeg, toDeg, r) => {
      const p = (d) => [cx + r * Math.sin((d * Math.PI) / 180), cy - r * Math.cos((d * Math.PI) / 180)];
      const [x1, y1] = p(fromDeg);
      const [x2, y2] = p(toDeg);
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 ${toDeg > fromDeg ? 1 : 0} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    };

    function draw() {
      const s = sol();
      const t1 = (o.angle * Math.PI) / 180;
      kit.set(upper, { fill: tint(o.n1) });
      kit.set(lower, { fill: tint(o.n2) });
      kit.set(name1, { text: `${o.label1}  n = ${kit.fmt(o.n1, 2)}` });
      kit.set(name2, { text: `${o.label2}  n = ${kit.fmt(o.n2, 2)}` });
      rays.textContent = "";
      // Incident ray: from the upper left towards the centre.
      const ix = cx - Math.sin(t1) * len;
      const iy = cy - Math.cos(t1) * len;
      kit.arrowShape(rays, ix, iy, cx - Math.sin(t1) * len * 0.45, cy - Math.cos(t1) * len * 0.45, { color: kit.colors.orange, width: 4, head: 14 });
      kit.el("line", { x1: ix, y1: iy, x2: cx, y2: cy, stroke: kit.colors.orange, "stroke-width": 4 }, rays);
      handle.textContent = "";
      if (kit.linked(swing)) kit.grip(handle, ix, iy, 22);
      dragger.refresh();
      kit.el("path", { d: arcPath(-o.angle, 0, 46), fill: "none", stroke: kit.colors.orange, "stroke-width": 2 }, rays);
      // Angle labels sit beside their ray, on the side away from the normal.
      kit.set(a1, { x: cx - Math.sin(t1) * len * 0.7 - Math.cos(t1) * 16, y: cy - Math.cos(t1) * len * 0.7 + Math.sin(t1) * 16 + 5, "text-anchor": "end", text: `θ₁ = ${kit.fmt(o.angle, 0)}°` });
      // Reflected ray: faint normally, full strength at total internal reflection.
      const show2 = o.showRefracted;
      if (show2 || !s.tir)
        kit.el("line", { x1: cx, y1: cy, x2: cx + Math.sin(t1) * len, y2: cy - Math.cos(t1) * len, stroke: kit.colors.orange, "stroke-width": s.tir ? 4 : 2, opacity: s.tir ? 1 : 0.25 }, rays);
      if (show2 && !s.tir) {
        const t2 = (s.theta2 * Math.PI) / 180;
        kit.el("line", { x1: cx, y1: cy, x2: cx + Math.sin(t2) * len, y2: cy + Math.cos(t2) * len, stroke: kit.colors.red, "stroke-width": 4 }, rays);
        kit.el("path", { d: arcPath(180 - s.theta2, 180, 46), fill: "none", stroke: kit.colors.red, "stroke-width": 2 }, rays);
      }
      const t2 = s.tir || !show2 ? 0 : (s.theta2 * Math.PI) / 180;
      kit.set(a2, {
        x: cx + Math.sin(t2) * len * 0.7 + Math.cos(t2) * 16,
        y: cy + Math.cos(t2) * len * 0.7 - Math.sin(t2) * 16 + 5,
        "text-anchor": "start",
        text: !show2 ? "θ₂ = ?" : s.tir ? "total reflection" : `θ₂ = ${kit.fmt(s.theta2, 1)}°`,
      });
    }

    draw();

    return {
      update(next) {
        Object.assign(o, Object.fromEntries(Object.entries(next).filter(([, v]) => v != null)));
        draw();
      },
      showRefracted(visible) {
        o.showRefracted = visible;
        draw();
      },
      values: sol,
    };
  };
})();
