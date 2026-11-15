/* simkit.dotPlot: numbers as stacked dots on a number line, with the mean and the median marked. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=120, y=380 (left end of the number line), w=760, min=0, max=10, values=[] (up to 30 numbers),
   *         unit="" , showMean=true, showMedian=true }
   * Returns { update({ values }), show({ mean, median }), values() }
   * values() -> { mean, median, min, max, range }   (see simkit.physics.stats)
   */
  kit.dotPlot = function (stage, opts) {
    const o = Object.assign({ x: 120, y: 380, w: 760, min: 0, max: 10, values: [], showMean: true, showMedian: true }, opts);
    const g = stage.layer({ class: "simkit-dotplot" });
    const X = (v) => o.x + ((kit.clamp(v, o.min, o.max) - o.min) / (o.max - o.min)) * o.w;
    const span = o.max - o.min;
    const step = span <= 20 ? 1 : span <= 50 ? 5 : 10;
    kit.el("line", { x1: o.x - 20, y1: o.y, x2: o.x + o.w + 20, y2: o.y, stroke: kit.colors.ink, "stroke-width": 3 }, g);
    for (let v = Math.ceil(o.min / step) * step; v <= o.max + 1e-9; v += step) {
      kit.el("line", { x1: X(v), y1: o.y, x2: X(v), y2: o.y + 10, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      kit.el("text", { x: X(v), y: o.y + 30, "text-anchor": "middle", class: "simkit-tick", text: kit.fmt(v, 0) }, g);
    }
    const dynamic = kit.el("g", null, g);
    const sol = () => kit.physics.stats(o.values);
    const num = (v) => kit.fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 2);

    function draw() {
      dynamic.textContent = "";
      const v = sol();
      const stack = {};
      o.values.slice(0, 30).forEach((n) => {
        if (typeof n !== "number" || !Number.isFinite(n)) return;
        const key = X(n).toFixed(0);
        stack[key] = (stack[key] || 0) + 1;
        kit.el("circle", { cx: X(n), cy: o.y - 16 - (stack[key] - 1) * 28, r: 12, fill: kit.colors.blue, stroke: "#fff", "stroke-width": 2 }, dynamic);
      });
      if (!o.values.length) return;
      // Mean: a balance point under the line. Median: a dashed line through the dots.
      if (o.showMean) {
        const mx = X(v.mean);
        kit.el("polygon", { points: `${mx},${o.y + 40} ${mx - 14},${o.y + 64} ${mx + 14},${o.y + 64}`, fill: kit.colors.red }, dynamic);
        kit.el("text", { x: mx, y: o.y + 86, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.redDark, text: `mean ${num(v.mean)}` }, dynamic);
      }
      if (o.showMedian) {
        const dx = X(v.median);
        kit.el("line", { x1: dx, y1: o.y - 6, x2: dx, y2: o.y - 250, stroke: kit.colors.purple, "stroke-width": 3, "stroke-dasharray": "7 6" }, dynamic);
        kit.el("text", { x: dx, y: o.y - 262, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple, text: `median ${num(v.median)}` }, dynamic);
      }
    }

    draw();

    return {
      update(next) {
        if (next.values) o.values = next.values.slice();
        draw();
      },
      /** show({ mean: false }) or show({ median: false }) removes that marker and its number. */
      show(which) {
        if (which.mean != null) o.showMean = which.mean;
        if (which.median != null) o.showMedian = which.median;
        draw();
      },
      values: sol,
    };
  };
})();
