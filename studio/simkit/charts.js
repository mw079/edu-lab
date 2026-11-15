/* simkit.barChart, simkit.pieChart and simkit.scatterPlot: three ways to show data. */
(function () {
  "use strict";
  const kit = window.simkit;
  const palette = () => [kit.colors.blue, kit.colors.red, kit.colors.green, kit.colors.yellow, kit.colors.purple, kit.colors.orange];
  const num = (v) => kit.fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1);
  const makeItems = (list) => (list || []).slice(0, 6).map((it, i) => ({ id: it.id || `c${i + 1}`, label: it.label || it.id || `item ${i + 1}`, value: it.value == null ? 0 : it.value, color: it.color || palette()[i], shown: true }));
  const setItems = (items, next) => items.forEach((it) => next && next[it.id] && next[it.id].value != null && (it.value = next[it.id].value));

  /**
   * opts: { x=170, y=70 (top-left of the plot area), w=660, h=340, bars: [{ id, label, value, color }] (2–6),
   *         max (top of the axis; default fits the data), yLabel="", showValues=true (number above each bar) }
   * Returns { update({ bars: { [id]: { value } } }), show({ [id]: bool }), showValues(bool), values() }
   * values() -> { [id]: value, total, largest (id) }   A hidden bar is drawn as an empty outline with "?".
   */
  kit.barChart = function (stage, opts) {
    const o = Object.assign({ x: 170, y: 70, w: 660, h: 340, bars: [], yLabel: "", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-barchart" });
    const bars = makeItems(o.bars);

    function draw() {
      g.textContent = "";
      const top = o.max || Math.max(...kit.ticks(0, Math.max(...bars.map((b) => b.value), 1) * 1.1, 5));
      const Y = (v) => o.y + o.h - (kit.clamp(v, 0, top) / top) * o.h;
      for (const t of kit.ticks(0, top, 5)) {
        kit.el("line", { x1: o.x, y1: Y(t), x2: o.x + o.w, y2: Y(t), stroke: t ? kit.colors.line : kit.colors.ink, "stroke-width": t ? 1 : 2 }, g);
        kit.el("text", { x: o.x - 10, y: Y(t) + 4, "text-anchor": "end", class: "simkit-tick", text: num(t) }, g);
      }
      if (o.yLabel) kit.el("text", { x: o.x, y: o.y - 16, class: "simkit-tick", style: "font-weight: 600", text: o.yLabel }, g);
      const slot = o.w / bars.length;
      bars.forEach((b, i) => {
        const bx = o.x + i * slot + slot * 0.2;
        const known = b.shown;
        // A hidden bar is a faint full-height column, so its outline says nothing about the value.
        const y = known ? Y(b.value) : o.y;
        kit.el("rect", { x: bx, y, width: slot * 0.6, height: o.y + o.h - y, rx: 4, fill: known ? b.color : kit.colors.muted, "fill-opacity": known ? 1 : 0.08, stroke: known ? "none" : kit.colors.muted, "stroke-width": 2, "stroke-dasharray": known ? null : "6 5" }, g);
        if (!known) kit.el("text", { x: bx + slot * 0.3, y: o.y + o.h / 2 + 10, "text-anchor": "middle", class: "simkit-label", style: "font-size: 30px", fill: kit.colors.muted, text: "?" }, g);
        else if (o.showValues) kit.el("text", { x: bx + slot * 0.3, y: y - 10, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: num(b.value) }, g);
        kit.el("text", { x: bx + slot * 0.3, y: o.y + o.h + 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: b.label }, g);
      });
    }

    draw();

    return {
      update(next) {
        setItems(bars, next.bars);
        draw();
      },
      /** show({ [id]: false }) replaces that bar by an empty outline with "?". */
      show(which) {
        bars.forEach((b) => which[b.id] != null && (b.shown = which[b.id]));
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values() {
        const out = Object.fromEntries(bars.map((b) => [b.id, b.value]));
        out.total = bars.reduce((sum, b) => sum + b.value, 0);
        out.largest = bars.reduce((best, b) => (b.value > best.value ? b : best), bars[0] || { id: null, value: 0 }).id;
        return out;
      },
    };
  };

  /**
   * opts: { x=320, y=270 (centre), r=170, slices: [{ id, label, value, color }] (2–6), showValues=true
   *         (value and percent in the legend) }
   * Returns { update({ slices: { [id]: { value } } }), show({ percent }), showValues(bool), values() }
   * values() -> { total, percent: { [id]: 0–100 } }
   */
  kit.pieChart = function (stage, opts) {
    const o = Object.assign({ x: 320, y: 270, r: 170, slices: [], showValues: true }, opts);
    const g = stage.layer({ class: "simkit-piechart" });
    const slices = makeItems(o.slices);
    let showPercent = true;
    const sol = () => {
      const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
      return { total, percent: Object.fromEntries(slices.map((s) => [s.id, total ? (100 * Math.max(0, s.value)) / total : 0])) };
    };

    function draw() {
      g.textContent = "";
      const v = sol();
      let a = -Math.PI / 2;
      const p = (angle) => `${(o.x + o.r * Math.cos(angle)).toFixed(1)} ${(o.y + o.r * Math.sin(angle)).toFixed(1)}`;
      slices.forEach((s) => {
        const share = v.percent[s.id] / 100;
        if (share <= 0) return;
        const b = a + share * 2 * Math.PI;
        kit.el("path", { d: share > 0.9999 ? `M ${o.x - o.r} ${o.y} a ${o.r} ${o.r} 0 1 0 ${2 * o.r} 0 a ${o.r} ${o.r} 0 1 0 ${-2 * o.r} 0` : `M ${o.x} ${o.y} L ${p(a)} A ${o.r} ${o.r} 0 ${share > 0.5 ? 1 : 0} 1 ${p(b)} Z`, fill: s.color, stroke: "#fff", "stroke-width": 3 }, g);
        a = b;
      });
      const lx = o.x + o.r + 70;
      slices.forEach((s, i) => {
        const y = o.y - (slices.length - 1) * 18 + i * 36;
        kit.el("rect", { x: lx, y: y - 15, width: 20, height: 20, rx: 4, fill: s.color }, g);
        const parts = [s.label];
        if (o.showValues) parts.push(`: ${num(s.value)}`);
        if (o.showValues && showPercent) parts.push(` (${kit.fmt(v.percent[s.id], 0)}%)`);
        kit.el("text", { x: lx + 30, y: y + 1, class: "simkit-label", fill: kit.colors.ink, text: parts.join("") }, g);
      });
    }

    draw();

    return {
      update(next) {
        setItems(slices, next.slices);
        draw();
      },
      /** show({ percent: false }) leaves the percentages out of the legend (the values stay). */
      show(which) {
        if (which.percent != null) showPercent = which.percent;
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=190, y=60 (top-left of the plot area), w=520, h=360, xRange=[0, 10], yRange=[0, 10], xLabel="",
   *         yLabel="", points=[[x, y], …] (fixed data), extra: { x, y } (one more point the student can move,
   *         drawn in red; optional), showLine=true (line of best fit), showR=true (the correlation r),
   *         drag: { x: app.link("key"), y: app.link("key") } (the student can drag the red point) }
   * Returns { update({ extra: { x, y }, points }), show({ line, r }), values() }
   * values() -> { slope, intercept, r }   (see simkit.physics.correlation; includes the extra point)
   */
  kit.scatterPlot = function (stage, opts) {
    const o = Object.assign({ x: 190, y: 60, w: 520, h: 360, xRange: [0, 10], yRange: [0, 10], xLabel: "", yLabel: "", points: [], extra: null, showLine: true, showR: true }, opts);
    const g = stage.layer({ class: "simkit-scatter" });
    const X = (v) => o.x + ((v - o.xRange[0]) / (o.xRange[1] - o.xRange[0])) * o.w;
    const Y = (v) => o.y + o.h - ((v - o.yRange[0]) / (o.yRange[1] - o.yRange[0])) * o.h;
    const clip = kit.el("clipPath", { id: stage.uid("scatter") }, stage.defs);
    kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h }, clip);
    kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, fill: "#fff", stroke: kit.colors.line, "stroke-width": 1 }, g);
    for (const t of kit.ticks(o.xRange[0], o.xRange[1], 5)) {
      kit.el("line", { x1: X(t), y1: o.y, x2: X(t), y2: o.y + o.h, stroke: kit.colors.grid, "stroke-width": 1 }, g);
      kit.el("text", { x: X(t), y: o.y + o.h + 18, "text-anchor": "middle", class: "simkit-tick", text: num(t) }, g);
    }
    for (const t of kit.ticks(o.yRange[0], o.yRange[1], 5)) {
      kit.el("line", { x1: o.x, y1: Y(t), x2: o.x + o.w, y2: Y(t), stroke: kit.colors.grid, "stroke-width": 1 }, g);
      kit.el("text", { x: o.x - 8, y: Y(t) + 4, "text-anchor": "end", class: "simkit-tick", text: num(t) }, g);
    }
    if (o.xLabel) kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 42, "text-anchor": "middle", class: "simkit-tick", style: "font-weight: 600", text: o.xLabel }, g);
    if (o.yLabel) kit.el("text", { x: o.x, y: o.y - 14, class: "simkit-tick", style: "font-weight: 600", text: o.yLabel }, g);
    const dynamic = kit.el("g", { "clip-path": `url(#${stage.uid("scatter")})` }, g);
    const outside = kit.el("g", null, g);
    const all = () => (o.extra && o.extra.x != null && o.extra.y != null ? [...o.points, [o.extra.x, o.extra.y]] : o.points);
    const sol = () => kit.physics.correlation(all());

    function draw() {
      dynamic.textContent = "";
      outside.textContent = "";
      const v = sol();
      if (o.showLine && all().length > 1) kit.el("line", { x1: X(o.xRange[0]), y1: Y(v.intercept + v.slope * o.xRange[0]), x2: X(o.xRange[1]), y2: Y(v.intercept + v.slope * o.xRange[1]), stroke: kit.colors.purple, "stroke-width": 3 }, dynamic);
      // Points go in the unclipped group, so one on the edge of the plot stays whole (only the line is clipped).
      o.points.forEach(([px, py]) => kit.el("circle", { cx: X(px), cy: Y(py), r: 7, fill: kit.colors.blue, stroke: "#fff", "stroke-width": 2 }, outside));
      if (o.extra && o.extra.x != null) {
        const dx = o.drag && o.drag.x;
        const dy = o.drag && o.drag.y;
        if (kit.linked(dx) || kit.linked(dy)) kit.grip(outside, X(o.extra.x), Y(o.extra.y), 19);
        const dot = kit.el("circle", { cx: X(o.extra.x), cy: Y(o.extra.y), r: 9, fill: kit.colors.red, stroke: "#fff", "stroke-width": 2 }, outside);
        // Dragging the red point moves it in both directions.
        kit.drag(stage, dot, [dx, dy], (p) => {
          if (dx) dx(o.xRange[0] + ((p.x - o.x) / o.w) * (o.xRange[1] - o.xRange[0]));
          if (dy) dy(o.yRange[0] + ((o.y + o.h - p.y) / o.h) * (o.yRange[1] - o.yRange[0]));
        });
      }
      const lx = o.x + o.w + 30;
      if (o.showLine) kit.el("text", { x: lx, y: o.y + 30, class: "simkit-label", fill: kit.colors.purple, text: "line of best fit" }, outside);
      kit.el("text", { x: lx, y: o.y + 62, class: "simkit-label", fill: kit.colors.ink, text: o.showR ? `r = ${kit.fmt(v.r, 2)}` : "r = ?" }, outside);
    }

    draw();

    return {
      update(next) {
        if (next.points) o.points = next.points.slice();
        if (next.extra) o.extra = Object.assign({}, o.extra, next.extra);
        draw();
      },
      /** show({ r: false }) writes "r = ?"; show({ line: false }) removes the line of best fit. */
      show(which) {
        if (which.line != null) o.showLine = which.line;
        if (which.r != null) o.showR = which.r;
        draw();
      },
      values: sol,
    };
  };
})();
