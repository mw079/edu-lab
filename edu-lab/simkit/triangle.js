/* simkit.rightTriangle: a right-angled triangle with labelled sides and angle. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=300, y=440 (the right-angle corner), pxPerUnit=40, a=3 (vertical side), b=4 (horizontal side),
   *         unit="" (e.g. "m"), showValues=true,
   *         drag: { a: app.link("key"), b: app.link("key") } (the student drags the top corner up and down for a,
   *         the right-hand corner sideways for b) }
   * Returns { update({ a, b }), show({ a, b, c, angle }), showValues(bool), values() }   A hidden value reads "?".
   * values() -> { c (hypotenuse), angle (degrees, between b and c), area }
   */
  kit.rightTriangle = function (stage, opts) {
    const o = Object.assign({ x: 300, y: 440, pxPerUnit: 40, a: 3, b: 4, unit: "", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-triangle" });
    const shown = { a: o.showValues, b: o.showValues, c: o.showValues, angle: o.showValues };
    const sol = () => ({ c: Math.hypot(o.a, o.b), angle: (Math.atan2(o.a, o.b) * 180) / Math.PI, area: (o.a * o.b) / 2 });

    function draw() {
      g.textContent = "";
      const v = sol();
      const A = o.a * o.pxPerUnit;
      const B = o.b * o.pxPerUnit;
      const unit = o.unit ? ` ${o.unit}` : "";
      const val = (key, n, digits) => (shown[key] ? `${kit.fmt(n, digits)}` : "?");
      const whole = (n) => (Math.abs(n - Math.round(n)) < 1e-9 ? 0 : 1);
      kit.el("polygon", { points: `${o.x},${o.y} ${o.x + B},${o.y} ${o.x},${o.y - A}`, fill: "#e4edfb", stroke: kit.colors.ink, "stroke-width": 3, "stroke-linejoin": "round" }, g);
      kit.el("path", { d: `M ${o.x + 18} ${o.y} L ${o.x + 18} ${o.y - 18} L ${o.x} ${o.y - 18}`, fill: "none", stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x - 14, y: o.y - A / 2 + 5, "text-anchor": "end", class: "simkit-label", fill: kit.colors.red, text: `a = ${val("a", o.a, whole(o.a))}${shown.a ? unit : ""}` }, g);
      kit.el("text", { x: o.x + B / 2, y: o.y + 28, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.blue, text: `b = ${val("b", o.b, whole(o.b))}${shown.b ? unit : ""}` }, g);
      // The hypotenuse label sits outside the triangle, pushed away from the slanted side.
      const len = Math.hypot(A, B) || 1;
      kit.el("text", { x: o.x + B / 2 + (A / len) * 16, y: o.y - A / 2 - (B / len) * 16, "text-anchor": "start", class: "simkit-label", fill: kit.colors.purple, text: `c = ${val("c", v.c, whole(v.c) ? 2 : 0)}${shown.c ? unit : ""}` }, g);
      // Angle at the right-hand corner, between b and c.
      const r = Math.min(54, B * 0.4);
      const t = Math.atan2(A, B);
      kit.el("path", { d: `M ${o.x + B - r} ${o.y} A ${r} ${r} 0 0 1 ${o.x + B - r * Math.cos(t)} ${o.y - r * Math.sin(t)}`, fill: "none", stroke: kit.colors.orange, "stroke-width": 2.5 }, g);
      const dragA = o.drag && o.drag.a;
      const dragB = o.drag && o.drag.b;
      kit.el("text", { x: o.x + B + (kit.linked(dragB) ? 30 : 12), y: o.y - 8, "text-anchor": "start", class: "simkit-label", fill: kit.colors.orange, text: `θ = ${val("angle", v.angle, 1)}${shown.angle ? "°" : ""}` }, g);
      // Direct interaction: rings on the two free corners.
      if (kit.linked(dragA)) kit.drag(stage, kit.grip(g, o.x, o.y - A, 20), dragA, (p) => dragA((o.y - p.y) / o.pxPerUnit));
      if (kit.linked(dragB)) kit.drag(stage, kit.grip(g, o.x + B, o.y, 20), dragB, (p) => dragB((p.x - o.x) / o.pxPerUnit));
    }

    draw();

    return {
      update(next) {
        if (next.a != null) o.a = Math.max(0.1, next.a);
        if (next.b != null) o.b = Math.max(0.1, next.b);
        draw();
      },
      /** Show or hide single values, e.g. show({ c: false, angle: false }) when a step asks for the hypotenuse. */
      show(which) {
        for (const key of ["a", "b", "c", "angle"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      showValues(visible) {
        shown.a = shown.b = shown.c = shown.angle = visible;
        draw();
      },
      values: sol,
    };
  };
})();
