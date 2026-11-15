/* simkit.coordinatePlane: x–y grid with a straight line y = mx + b, its slope triangle and optional points. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=280, y=50 (top-left of the square grid), size=440, range=10 (axes from −range to range), m=1, b=0,
   *         showLine=true, showEquation=true, showSlope=true (rise/run triangle), points: [{ id, x, y, label, color }] }
   * Returns { update({ m, b, points: { [id]: { x, y } } }), show({ line, equation, slope }), values() }
   * values() -> { m, b, xIntercept (null for a horizontal line) }
   */
  kit.coordinatePlane = function (stage, opts) {
    const o = Object.assign({ x: 280, y: 50, size: 440, range: 10, m: 1, b: 0, showLine: true, showEquation: true, showSlope: true, points: [] }, opts);
    const g = stage.layer({ class: "simkit-plane" });
    const u = o.size / (2 * o.range);
    const X = (v) => o.x + o.size / 2 + v * u;
    const Y = (v) => o.y + o.size / 2 - v * u;
    const clip = kit.el("clipPath", { id: stage.uid("plane") }, stage.defs);
    kit.el("rect", { x: o.x, y: o.y, width: o.size, height: o.size }, clip);
    kit.el("rect", { x: o.x, y: o.y, width: o.size, height: o.size, fill: "#fff" }, g);
    const step = o.range <= 10 ? 2 : o.range <= 25 ? 5 : 10;
    for (let v = -o.range; v <= o.range; v++) {
      const major = v % step === 0;
      if (o.range > 12 && !major) continue;
      kit.el("line", { x1: X(v), y1: o.y, x2: X(v), y2: o.y + o.size, stroke: v === 0 ? kit.colors.ink : kit.colors.line, "stroke-width": v === 0 ? 2 : major ? 1.2 : 0.6 }, g);
      kit.el("line", { x1: o.x, y1: Y(v), x2: o.x + o.size, y2: Y(v), stroke: v === 0 ? kit.colors.ink : kit.colors.line, "stroke-width": v === 0 ? 2 : major ? 1.2 : 0.6 }, g);
      if (major && v !== 0) {
        kit.el("text", { x: X(v), y: o.y + o.size + 18, "text-anchor": "middle", class: "simkit-tick", text: kit.fmt(v, 0) }, g);
        kit.el("text", { x: o.x - 8, y: Y(v) + 4, "text-anchor": "end", class: "simkit-tick", text: kit.fmt(v, 0) }, g);
      }
    }
    kit.el("text", { x: o.x + o.size + 10, y: Y(0) + 5, class: "simkit-label", fill: kit.colors.ink, text: "x" }, g);
    kit.el("text", { x: X(0), y: o.y - 10, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: "y" }, g);
    const dynamic = kit.el("g", { "clip-path": `url(#${stage.uid("plane")})` }, g);
    const outside = kit.el("g", null, g);
    const points = (o.points || []).map((p, i) => Object.assign({ id: `p${i + 1}`, x: 0, y: 0, label: "", color: kit.colors.red }, p));
    const num = (v) => kit.fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1);

    function draw() {
      dynamic.textContent = "";
      outside.textContent = "";
      if (o.showLine) {
        kit.el("line", { x1: X(-o.range), y1: Y(-o.range * o.m + o.b), x2: X(o.range), y2: Y(o.range * o.m + o.b), stroke: kit.colors.blue, "stroke-width": 4 }, dynamic);
        kit.el("circle", { cx: X(0), cy: Y(o.b), r: 6, fill: kit.colors.blue, stroke: "#fff", "stroke-width": 2 }, dynamic);
        if (o.showSlope && o.m !== 0) {
          // Rise/run triangle from the y-intercept, as wide as fits (run of 1, 2 or 4).
          const run = [4, 2, 1].find((r) => Math.abs(o.b + o.m * r) <= o.range && r <= o.range) || 1;
          const x2 = X(run);
          const y1 = Y(o.b);
          const y2 = Y(o.b + o.m * run);
          kit.el("path", { d: `M ${X(0)} ${y1} L ${x2} ${y1} L ${x2} ${y2}`, fill: "none", stroke: kit.colors.orange, "stroke-width": 3, "stroke-dasharray": "6 5" }, dynamic);
          kit.el("text", { x: (X(0) + x2) / 2, y: y1 + (o.m > 0 ? 20 : -10), "text-anchor": "middle", class: "simkit-tick", fill: kit.colors.orange, style: "font-weight: 600", text: `run ${run}` }, dynamic);
          kit.el("text", { x: x2 + 8, y: (y1 + y2) / 2 + 4, class: "simkit-tick", fill: kit.colors.orange, style: "font-weight: 600", text: `rise ${num(o.m * run)}` }, dynamic);
        }
      }
      points.forEach((p) => {
        kit.el("circle", { cx: X(p.x), cy: Y(p.y), r: 7, fill: p.color, stroke: "#fff", "stroke-width": 2 }, dynamic);
        kit.el("text", { x: X(p.x) + 12, y: Y(p.y) - 10, class: "simkit-label", fill: p.color, text: p.label ? `${p.label} (${num(p.x)}, ${num(p.y)})` : `(${num(p.x)}, ${num(p.y)})` }, dynamic);
      });
      if (o.showEquation && o.showLine) {
        const mPart = o.m === 0 ? "" : `${o.m === 1 ? "" : o.m === -1 ? "−" : num(o.m)}x`;
        const bPart = o.b === 0 ? (mPart ? "" : "0") : mPart ? ` ${o.b > 0 ? "+" : "−"} ${num(Math.abs(o.b))}` : num(o.b);
        kit.el("text", { x: o.x + o.size + 40, y: o.y + 40, class: "simkit-label", style: "font-size: 22px", fill: kit.colors.blueDark, text: `y = ${mPart}${bPart}` }, outside);
      }
    }

    draw();

    return {
      update(next) {
        if (next.m != null) o.m = next.m;
        if (next.b != null) o.b = next.b;
        if (next.points) points.forEach((p) => next.points[p.id] && Object.assign(p, next.points[p.id]));
        draw();
      },
      /** show({ equation: false }) hides the written equation; show({ slope: false }) the triangle; show({ line: false }) the line. */
      show(which) {
        if (which.line != null) o.showLine = which.line;
        if (which.equation != null) o.showEquation = which.equation;
        if (which.slope != null) o.showSlope = which.slope;
        draw();
      },
      values: () => ({ m: o.m, b: o.b, xIntercept: o.m === 0 ? null : -o.b / o.m }),
    };
  };
})();
