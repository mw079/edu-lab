/* simkit.circleFigure: a circle with its radius, an optional sector, and its circumference and area. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=360, y=280 (centre), pxPerUnit=30, r=5 (up to 220 px), angle=360 (degrees of the shaded sector),
   *         unit="cm", showValues=true }
   * Returns { update({ r, angle }), show({ r, angle, circumference, area }), showValues(bool), values() }
   * values() -> { circumference, area, arc (length of the sector's arc), sectorArea }   A hidden value reads "?".
   */
  kit.circleFigure = function (stage, opts) {
    const o = Object.assign({ x: 360, y: 280, pxPerUnit: 30, r: 5, angle: 360, unit: "cm", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-circle" });
    const shown = { r: o.showValues, angle: o.showValues, circumference: o.showValues, area: o.showValues };
    const sol = () => {
      const f = kit.clamp(o.angle, 0, 360) / 360;
      return { circumference: 2 * Math.PI * o.r, area: Math.PI * o.r * o.r, arc: 2 * Math.PI * o.r * f, sectorArea: Math.PI * o.r * o.r * f };
    };

    function draw() {
      g.textContent = "";
      const v = sol();
      const R = kit.clamp(o.r * o.pxPerUnit, 10, 220);
      const whole = o.angle >= 360;
      const a = (kit.clamp(o.angle, 0, 360) * Math.PI) / 180;
      kit.el("circle", { cx: o.x, cy: o.y, r: R, fill: whole ? "#e4edfb" : "#fff", stroke: kit.colors.ink, "stroke-width": 3 }, g);
      if (!whole && o.angle > 0) {
        const ex = o.x + R * Math.cos(a);
        const ey = o.y - R * Math.sin(a);
        kit.el("path", { d: `M ${o.x} ${o.y} L ${o.x + R} ${o.y} A ${R} ${R} 0 ${o.angle > 180 ? 1 : 0} 0 ${ex.toFixed(1)} ${ey.toFixed(1)} Z`, fill: "#e4edfb", stroke: kit.colors.blue, "stroke-width": 3, "stroke-linejoin": "round" }, g);
      }
      kit.el("line", { x1: o.x, y1: o.y, x2: o.x + R, y2: o.y, stroke: kit.colors.red, "stroke-width": 4 }, g);
      kit.el("circle", { cx: o.x, cy: o.y, r: 5, fill: kit.colors.ink }, g);
      const unit = ` ${o.unit}`;
      const val = (key, n, digits, suffix) => (shown[key] ? `${kit.fmt(n, digits)}${suffix}` : "?");
      const whole1 = (n) => (Math.abs(n - Math.round(n)) < 1e-9 ? 0 : 1);
      // All written values sit in a column to the right of the largest circle.
      const lx = o.x + 250;
      const lines = [[kit.colors.red, `radius r = ${val("r", o.r, whole1(o.r), unit)}`]];
      if (!whole) lines.push([kit.colors.blue, `angle θ = ${val("angle", o.angle, 0, "°")}`]);
      lines.push([kit.colors.ink, `circumference = ${val("circumference", v.circumference, 1, unit)}`]);
      lines.push([kit.colors.ink, `area = ${val("area", v.area, 1, `${unit}²`)}`]);
      lines.forEach(([fill, text], i) => kit.el("text", { x: lx, y: o.y - 40 + i * 32, class: "simkit-label", fill, text }, g));
    }

    draw();

    return {
      update(next) {
        if (next.r != null) o.r = Math.max(0.1, next.r);
        if (next.angle != null) o.angle = next.angle;
        draw();
      },
      /** Show or hide single values, e.g. show({ area: false }) when a step asks for the area. */
      show(which) {
        for (const key of ["r", "angle", "circumference", "area"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      showValues(visible) {
        shown.r = shown.angle = shown.circumference = shown.area = visible;
        draw();
      },
      values: sol,
    };
  };
})();
