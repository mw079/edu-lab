/* simkit.protractor: an angle between two rays, measured on a protractor. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=420 (the vertex), r=260 (protractor radius), angle=60 (0–180 degrees), showValue=true
   *         (the written size), showType=true (acute / right / obtuse / straight), showScale=true (numbers on
   *         the protractor) }
   * Returns { update({ angle }), show({ value, type, scale }), values() }
   * values() -> { type, complement (90 − angle), supplement (180 − angle) }
   */
  kit.protractor = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 420, r: 260, angle: 60, showValue: true, showType: true, showScale: true }, opts);
    const g = stage.layer({ class: "simkit-protractor" });
    const scaleG = kit.el("g", null, g);
    const dynamic = kit.el("g", null, g);
    const type = (a) => (a === 0 ? "zero angle" : a < 90 ? "acute angle" : a === 90 ? "right angle" : a < 180 ? "obtuse angle" : "straight angle");
    const pt = (deg, r) => [o.x + r * Math.cos((deg * Math.PI) / 180), o.y - r * Math.sin((deg * Math.PI) / 180)];

    function drawScale() {
      scaleG.textContent = "";
      kit.el("path", { d: `M ${o.x - o.r} ${o.y} A ${o.r} ${o.r} 0 0 1 ${o.x + o.r} ${o.y} Z`, fill: "#fff", "fill-opacity": 0.7, stroke: kit.colors.steel, "stroke-width": 2 }, scaleG);
      if (!o.showScale) return;
      for (let d = 0; d <= 180; d += 10) {
        const [x1, y1] = pt(d, o.r);
        const [x2, y2] = pt(d, o.r - (d % 30 ? 10 : 18));
        kit.el("line", { x1, y1, x2, y2, stroke: kit.colors.ink, "stroke-width": d % 30 ? 1 : 2 }, scaleG);
        if (d % 30 === 0) {
          const [tx, ty] = pt(d, o.r - 34);
          kit.el("text", { x: tx, y: ty + (d % 180 ? 5 : -8), "text-anchor": "middle", class: "simkit-tick", text: `${d}°` }, scaleG);
        }
      }
    }

    function draw() {
      dynamic.textContent = "";
      const a = kit.clamp(o.angle, 0, 180);
      const [bx, by] = pt(0, o.r + 30);
      const [ex, ey] = pt(a, o.r + 30);
      const ar = 70;
      const [ax, ay] = pt(a, ar);
      kit.el("path", { d: `M ${o.x} ${o.y} L ${o.x + ar} ${o.y} A ${ar} ${ar} 0 0 0 ${ax.toFixed(1)} ${ay.toFixed(1)} Z`, fill: kit.colors.orange, "fill-opacity": 0.3, stroke: kit.colors.orange, "stroke-width": 2 }, dynamic);
      kit.el("line", { x1: o.x, y1: o.y, x2: bx, y2: by, stroke: kit.colors.ink, "stroke-width": 4, "stroke-linecap": "round" }, dynamic);
      kit.el("line", { x1: o.x, y1: o.y, x2: ex, y2: ey, stroke: kit.colors.red, "stroke-width": 4, "stroke-linecap": "round" }, dynamic);
      kit.el("circle", { cx: o.x, cy: o.y, r: 6, fill: kit.colors.ink }, dynamic);
      const parts = [];
      if (o.showValue) parts.push(`${kit.fmt(a, 0)}°`);
      if (o.showType) parts.push(type(a));
      kit.el("text", { x: o.x, y: o.y + 40, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.orange, text: parts.join(": ") || "?" }, dynamic);
    }

    drawScale();
    draw();

    return {
      update(next) {
        if (next.angle != null) o.angle = next.angle;
        draw();
      },
      /** show({ value: false }) hides the written size, show({ type: false }) the angle's name, show({ scale: false }) the protractor's numbers. */
      show(which) {
        if (which.value != null) o.showValue = which.value;
        if (which.type != null) o.showType = which.type;
        if (which.scale != null && which.scale !== o.showScale) {
          o.showScale = which.scale;
          drawScale();
        }
        draw();
      },
      values: () => ({ type: type(kit.clamp(o.angle, 0, 180)), complement: 90 - o.angle, supplement: 180 - o.angle }),
    };
  };
})();
