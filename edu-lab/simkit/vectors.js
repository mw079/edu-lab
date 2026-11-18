/* simkit.vectorSum and simkit.unitCircle: adding two vectors; sine and cosine on the unit circle. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=380, y=290 (the origin), unit=34 (px per grid unit), range=6, ax=4, ay=1, bx=1, by=3,
   *         labelA="A", labelB="B", showSum=true (the resultant and the dashed tip-to-tail copy of B),
   *         showValues=true (components and length in the legend),
   *         drag: { ax, ay, bx, by } (app.link per component: the student drags the tips of A and B) }
   * Returns { update({ ax, ay, bx, by }), show({ sum, values }), values() }
   * values() -> { x, y, magnitude, angle, magA, magB }   (see simkit.physics.vectorSum)
   */
  kit.vectorSum = function (stage, opts) {
    const o = Object.assign({ x: 380, y: 290, unit: 34, range: 6, ax: 4, ay: 1, bx: 1, by: 3, labelA: "A", labelB: "B", showSum: true, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-vectors" });
    const X = (v) => o.x + v * o.unit;
    const Y = (v) => o.y - v * o.unit;
    const span = o.range * o.unit;
    for (let i = -o.range; i <= o.range; i++) {
      kit.el("line", { x1: X(i), y1: Y(-o.range), x2: X(i), y2: Y(o.range), stroke: i ? kit.colors.line : kit.colors.ink, "stroke-width": i ? 1 : 2 }, g);
      kit.el("line", { x1: X(-o.range), y1: Y(i), x2: X(o.range), y2: Y(i), stroke: i ? kit.colors.line : kit.colors.ink, "stroke-width": i ? 1 : 2 }, g);
      if (i && i % 2 === 0) {
        kit.el("text", { x: X(i), y: Y(-o.range) + 20, "text-anchor": "middle", class: "simkit-tick", text: kit.fmt(i, 0) }, g);
        kit.el("text", { x: X(-o.range) - 10, y: Y(i) + 5, "text-anchor": "end", class: "simkit-tick", text: kit.fmt(i, 0) }, g);
      }
    }
    const arrows = kit.el("g", null, g);
    const legend = kit.el("g", null, g);
    const d = o.drag || {};
    const tip = (kx, ky) => {
      const handle = kit.el("g", null, g);
      const links = [d[kx], d[ky]].filter((l) => typeof l === "function");
      const snap = (v) => kit.clamp(Math.round(v), -o.range, o.range);
      const dragger = kit.drag(stage, handle, links, (p) => {
        if (d[kx]) d[kx](snap((p.x - o.x) / o.unit));
        if (d[ky]) d[ky](snap((o.y - p.y) / o.unit));
      });
      return { handle, dragger, on: () => links.some((l) => kit.linked(l)) };
    };
    const tipA = tip("ax", "ay");
    const tipB = tip("bx", "by");
    const pair = (x, y) => `(${kit.fmt(x, 0)}, ${kit.fmt(y, 0)})`;

    function draw() {
      const s = kit.physics.vectorSum(o.ax, o.ay, o.bx, o.by);
      arrows.textContent = "";
      legend.textContent = "";
      const vec = (x1, y1, x2, y2, color, dashed) => {
        if (x1 === x2 && y1 === y2) return;
        const a = kit.arrowShape(arrows, X(x1), Y(y1), X(x2), Y(y2), { color, width: dashed ? 3 : 5, head: 13 });
        if (dashed) a.querySelector("line").setAttribute("stroke-dasharray", "7 5");
      };
      if (o.showSum) {
        vec(o.ax, o.ay, s.x, s.y, kit.colors.blue, true); // B again, starting at the tip of A
        vec(0, 0, s.x, s.y, kit.colors.green);
      }
      vec(0, 0, o.ax, o.ay, kit.colors.red);
      vec(0, 0, o.bx, o.by, kit.colors.blue);
      for (const [t, x, y] of [[tipA, o.ax, o.ay], [tipB, o.bx, o.by]]) {
        t.handle.textContent = "";
        if (t.on()) kit.grip(t.handle, X(x), Y(y), 22);
        t.dragger.refresh();
      }
      // The legend sits beside the grid, so no label is ever on top of an arrow.
      const lx = o.x + span + 44;
      const row = (i, color, name, x, y, len) => {
        const ly = o.y - span + 40 + i * 64;
        kit.el("line", { x1: lx, y1: ly - 6, x2: lx + 34, y2: ly - 6, stroke: color, "stroke-width": 5, "stroke-linecap": "round" }, legend);
        kit.el("text", { x: lx + 46, y: ly, class: "simkit-label", fill: color, text: o.showValues || name !== "sum" ? `${name === "sum" ? `${o.labelA} + ${o.labelB}` : name} = ${pair(x, y)}` : `${o.labelA} + ${o.labelB} = ?` }, legend);
        kit.el("text", { x: lx + 46, y: ly + 22, class: "simkit-tick", text: o.showValues ? `length ${kit.fmt(len, 2)}` : "" }, legend);
      };
      row(0, kit.colors.red, o.labelA, o.ax, o.ay, s.magA);
      row(1, kit.colors.blue, o.labelB, o.bx, o.by, s.magB);
      if (o.showSum) row(2, kit.colors.green, "sum", s.x, s.y, s.magnitude);
    }

    draw();

    return {
      update(next) {
        for (const key of ["ax", "ay", "bx", "by"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ sum: false }) removes the resultant; show({ values: false }) writes "A + B = ?" and hides the lengths. */
      show(which) {
        if (which.sum != null) o.showSum = which.sum;
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: () => kit.physics.vectorSum(o.ax, o.ay, o.bx, o.by),
    };
  };

  /**
   * opts: { x=270, y=270 (centre), r=170, angle=40 (degrees, anticlockwise from the right), showValues=true
   *         (sin θ and cos θ as numbers), showGraph=true (the sine curve beside the circle),
   *         drag: { angle: app.link("key") } (the student drags the point around the circle) }
   * Returns { update({ angle }), show({ values, graph }), values() }
   * values() -> { sin, cos, tan, quadrant }   (see simkit.physics.trig)
   */
  kit.unitCircle = function (stage, opts) {
    const o = Object.assign({ x: 270, y: 270, r: 170, angle: 40, showValues: true, showGraph: true }, opts);
    const g = stage.layer({ class: "simkit-unitcircle" });
    kit.el("line", { x1: o.x - o.r - 30, y1: o.y, x2: o.x + o.r + 30, y2: o.y, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    kit.el("line", { x1: o.x, y1: o.y - o.r - 30, x2: o.x, y2: o.y + o.r + 30, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    kit.el("circle", { cx: o.x, cy: o.y, r: o.r, fill: "none", stroke: kit.colors.steel, "stroke-width": 2 }, g);
    const dynamic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const turn = o.drag && o.drag.angle;
    const dragger = kit.drag(stage, handle, turn, (p) => turn(((Math.atan2(o.y - p.y, p.x - o.x) * 180) / Math.PI + 360) % 360));
    // Graph of sin θ from 0° to 360°, to the right of the circle.
    const gx = o.x + o.r + 110;
    const gw = 360;
    const amp = 100;
    const gy = o.y - 70;

    function draw() {
      const s = kit.physics.trig(o.angle);
      const a = (((o.angle % 360) + 360) % 360) * (Math.PI / 180);
      const px = o.x + o.r * Math.cos(a);
      const py = o.y - o.r * Math.sin(a);
      dynamic.textContent = "";
      const arcR = 34;
      if (a > 0.01) kit.el("path", { d: `M ${o.x + arcR} ${o.y} A ${arcR} ${arcR} 0 ${a > Math.PI ? 1 : 0} 0 ${(o.x + arcR * Math.cos(a)).toFixed(1)} ${(o.y - arcR * Math.sin(a)).toFixed(1)}`, fill: "none", stroke: kit.colors.ink, "stroke-width": 2 }, dynamic);
      kit.el("line", { x1: o.x, y1: o.y, x2: px, y2: py, stroke: kit.colors.ink, "stroke-width": 3 }, dynamic);
      kit.el("line", { x1: o.x, y1: o.y, x2: px, y2: o.y, stroke: kit.colors.blue, "stroke-width": 6, "stroke-linecap": "round" }, dynamic); // cos θ
      kit.el("line", { x1: px, y1: o.y, x2: px, y2: py, stroke: kit.colors.red, "stroke-width": 6, "stroke-linecap": "round" }, dynamic); // sin θ
      kit.el("circle", { cx: px, cy: py, r: 9, fill: kit.colors.purple, stroke: "#fff", "stroke-width": 2 }, dynamic);
      handle.textContent = "";
      if (kit.linked(turn)) kit.grip(handle, px, py, 24);
      dragger.refresh();
      // Values in a fixed place under the graph (or beside the circle), never on top of the moving lines.
      const lx = gx;
      const ly = o.showGraph ? gy + amp + 90 : o.y - 40;
      const num = (v) => (o.showValues ? kit.fmt(v, 2).replace("-", "−") : "?");
      kit.el("text", { x: lx, y: ly, class: "simkit-label", fill: kit.colors.ink, text: `θ = ${kit.fmt(o.angle, 0)}°` }, dynamic);
      kit.el("text", { x: lx, y: ly + 34, class: "simkit-label", fill: kit.colors.blue, text: `cos θ = ${num(s.cos)}   (across)` }, dynamic);
      kit.el("text", { x: lx, y: ly + 68, class: "simkit-label", fill: kit.colors.red, text: `sin θ = ${num(s.sin)}   (up)` }, dynamic);
      if (!o.showGraph) return;
      kit.el("line", { x1: gx, y1: gy, x2: gx + gw, y2: gy, stroke: kit.colors.ink, "stroke-width": 2 }, dynamic);
      kit.el("line", { x1: gx, y1: gy - amp - 10, x2: gx, y2: gy + amp + 10, stroke: kit.colors.ink, "stroke-width": 2 }, dynamic);
      for (let deg = 0; deg <= 360; deg += 90) {
        kit.el("line", { x1: gx + (deg / 360) * gw, y1: gy + amp + 10, x2: gx + (deg / 360) * gw, y2: gy + amp + 18, stroke: kit.colors.ink, "stroke-width": 2 }, dynamic);
        kit.el("text", { x: gx + (deg / 360) * gw, y: gy + amp + 36, "text-anchor": "middle", class: "simkit-tick", text: `${deg}°` }, dynamic);
      }
      for (const v of [1, -1]) kit.el("text", { x: gx - 10, y: gy - v * amp + 5, "text-anchor": "end", class: "simkit-tick", text: v > 0 ? "1" : "−1" }, dynamic);
      let path = "";
      for (let deg = 0; deg <= 360; deg += 5) path += `${deg ? "L" : "M"} ${(gx + (deg / 360) * gw).toFixed(1)} ${(gy - amp * Math.sin((deg * Math.PI) / 180)).toFixed(1)} `;
      kit.el("path", { d: path, fill: "none", stroke: kit.colors.red, "stroke-width": 3, opacity: 0.45 }, dynamic);
      const cxg = gx + (a / (2 * Math.PI)) * gw;
      kit.el("line", { x1: cxg, y1: gy, x2: cxg, y2: gy - amp * s.sin, stroke: kit.colors.red, "stroke-width": 6, "stroke-linecap": "round" }, dynamic);
      kit.el("circle", { cx: cxg, cy: gy - amp * s.sin, r: 7, fill: kit.colors.purple, stroke: "#fff", "stroke-width": 2 }, dynamic);
    }

    draw();

    return {
      update(next) {
        if (next.angle != null) o.angle = next.angle;
        draw();
      },
      /** show({ values: false }) writes "?" for sin θ and cos θ; show({ graph: false }) removes the sine curve. */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        if (which.graph != null) o.showGraph = which.graph;
        draw();
      },
      values: () => kit.physics.trig(o.angle),
    };
  };
})();
