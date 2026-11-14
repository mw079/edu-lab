/* simkit.plot: a small live line plot for telemetry (e.g. position vs time). */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x, y, w, h, title, xLabel, yLabel, xRange:[a,b], yRange:[a,b],
   *         series:[{ id, color, label, dashed }] , autoY=false }
   * Returns { set(id, points), add(id, [x,y]), clear(), setRange({xRange,yRange}), el }
   */
  kit.plot = function (stage, opts) {
    const o = Object.assign(
      { x: 600, y: 40, w: 360, h: 220, title: "", xLabel: "", yLabel: "", xRange: [0, 10], yRange: [0, 10], series: [], autoY: false },
      opts
    );
    const g = stage.layer({ class: "simkit-plot" });
    const pad = { l: 52, r: 14, t: o.title ? 34 : 14, b: 40 };
    const data = new Map(o.series.map((s) => [s.id, []]));
    let axes;
    let lines;

    function sx(v) {
      return o.x + pad.l + ((v - o.xRange[0]) / (o.xRange[1] - o.xRange[0])) * (o.w - pad.l - pad.r);
    }
    function sy(v) {
      return o.y + o.h - pad.b - ((v - o.yRange[0]) / (o.yRange[1] - o.yRange[0])) * (o.h - pad.t - pad.b);
    }

    function drawAxes() {
      if (axes) axes.remove();
      axes = kit.el("g", null, g);
      kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 14, fill: "#fff", stroke: kit.colors.line }, axes);
      if (o.title) kit.el("text", { x: o.x + 16, y: o.y + 22, class: "simkit-title", text: o.title }, axes);
      const x0 = o.x + pad.l;
      const x1 = o.x + o.w - pad.r;
      const y0 = o.y + o.h - pad.b;
      const y1 = o.y + pad.t;
      kit.ticks(o.xRange[0], o.xRange[1], 5).forEach((t) => {
        kit.el("line", { x1: sx(t), x2: sx(t), y1, y2: y0, stroke: kit.colors.grid }, axes);
        kit.el("text", { x: sx(t), y: y0 + 16, "text-anchor": "middle", class: "simkit-tick", text: String(+t.toFixed(4)).replace(/^-/, "−") }, axes);
      });
      kit.ticks(o.yRange[0], o.yRange[1], 4).forEach((t) => {
        kit.el("line", { x1: x0, x2: x1, y1: sy(t), y2: sy(t), stroke: kit.colors.grid }, axes);
        kit.el("text", { x: x0 - 6, y: sy(t) + 4, "text-anchor": "end", class: "simkit-tick", text: String(+t.toFixed(4)).replace(/^-/, "−") }, axes);
      });
      kit.el("line", { x1: x0, x2: x1, y1: y0, y2: y0, stroke: kit.colors.muted }, axes);
      kit.el("line", { x1: x0, x2: x0, y1, y2: y0, stroke: kit.colors.muted }, axes);
      if (o.yRange[0] < 0 && o.yRange[1] > 0) kit.el("line", { x1: x0, x2: x1, y1: sy(0), y2: sy(0), stroke: kit.colors.muted, "stroke-dasharray": "4 4" }, axes);
      if (o.xLabel) kit.el("text", { x: (x0 + x1) / 2, y: o.y + o.h - 6, "text-anchor": "middle", class: "simkit-axis", text: o.xLabel }, axes);
      if (o.yLabel)
        kit.el("text", { x: o.x + 14, y: (y0 + y1) / 2, "text-anchor": "middle", class: "simkit-axis", transform: `rotate(-90 ${o.x + 14} ${(y0 + y1) / 2})`, text: o.yLabel }, axes);
      if (o.series.length > 1) {
        o.series.forEach((s, i) => {
          const lx = x1 - 110;
          const ly = y1 + 4 + i * 18;
          kit.el("line", { x1: lx, x2: lx + 18, y1: ly, y2: ly, stroke: s.color, "stroke-width": 3, "stroke-dasharray": s.dashed ? "6 4" : null }, axes);
          kit.el("text", { x: lx + 24, y: ly + 4, class: "simkit-tick", text: s.label || s.id }, axes);
        });
      }
      if (lines) g.appendChild(lines);
    }

    function drawLines() {
      if (!lines) lines = kit.el("g", null, g);
      lines.textContent = "";
      o.series.forEach((s) => {
        const pts = data.get(s.id) || [];
        if (!pts.length) return;
        kit.el(
          "polyline",
          {
            points: pts.map(([px, py]) => `${sx(px).toFixed(1)},${sy(kit.clamp(py, o.yRange[0], o.yRange[1])).toFixed(1)}`).join(" "),
            fill: "none",
            stroke: s.color || kit.colors.ink,
            "stroke-width": 3,
            "stroke-linejoin": "round",
            "stroke-dasharray": s.dashed ? "6 4" : null,
          },
          lines
        );
      });
    }

    function autoscale() {
      if (!o.autoY) return false;
      let hi = -Infinity;
      let lo = Infinity;
      data.forEach((pts) => pts.forEach(([, v]) => ((hi = Math.max(hi, v)), (lo = Math.min(lo, v)))));
      if (!Number.isFinite(hi)) return false;
      if (hi > o.yRange[1] || lo < o.yRange[0]) {
        const t = kit.ticks(Math.min(lo, o.yRange[0]), Math.max(hi, o.yRange[1]) * 1.1, 4);
        o.yRange = [Math.min(t[0], lo), t[t.length - 1]];
        return true;
      }
      return false;
    }

    drawAxes();
    drawLines();

    return {
      el: g,
      set(id, points) {
        data.set(id, points.slice());
        if (autoscale()) drawAxes();
        drawLines();
      },
      add(id, point) {
        if (!data.has(id)) data.set(id, []);
        data.get(id).push(point);
        if (autoscale()) drawAxes();
        drawLines();
      },
      clear() {
        data.forEach((_, k) => data.set(k, []));
        drawLines();
      },
      setRange(next) {
        Object.assign(o, next);
        drawAxes();
        drawLines();
      },
    };
  };
})();
