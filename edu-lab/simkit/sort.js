/* simkit.sortBars: a list of numbers as bars, part-way through a bubble sort. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=170, y=90 (top-left), w=660, h=300, values=[5, 2, 8, 1, 9, 3] (3–10 numbers), steps=0
   *         (comparisons made so far), showValues=true (the counters under the bars) }
   * Returns { update({ steps, values }), showValues(bool), values() }
   * values() -> { array, comparisons, swaps, done, next, total }   (see simkit.physics.bubbleSort)
   */
  kit.sortBars = function (stage, opts) {
    const o = Object.assign({ x: 170, y: 90, w: 660, h: 300, values: [5, 2, 8, 1, 9, 3], steps: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-sort" });
    const sol = () => kit.physics.bubbleSort(o.values, o.steps);

    function draw() {
      g.textContent = "";
      const v = sol();
      const n = v.array.length;
      const slot = o.w / n;
      const max = Math.max(...o.values, 1);
      kit.el("line", { x1: o.x, y1: o.y + o.h, x2: o.x + o.w, y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      v.array.forEach((value, i) => {
        const bh = (value / max) * (o.h - 40);
        const compared = v.next && (i === v.next[0] || i === v.next[1]);
        kit.el("rect", { x: o.x + i * slot + slot * 0.15, y: o.y + o.h - bh, width: slot * 0.7, height: bh, rx: 6, fill: v.done ? kit.colors.green : compared ? kit.colors.orange : kit.colors.blue }, g);
        kit.el("text", { x: o.x + (i + 0.5) * slot, y: o.y + o.h - bh - 10, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: String(value) }, g);
      });
      if (v.next) {
        const x1 = o.x + (v.next[0] + 0.5) * slot;
        const x2 = o.x + (v.next[1] + 0.5) * slot;
        kit.el("path", { d: `M ${x1} ${o.y + o.h + 10} L ${x1} ${o.y + o.h + 20} L ${x2} ${o.y + o.h + 20} L ${x2} ${o.y + o.h + 10}`, fill: "none", stroke: kit.colors.orange, "stroke-width": 3 }, g);
        kit.el("text", { x: (x1 + x2) / 2, y: o.y + o.h + 42, "text-anchor": "middle", class: "simkit-tick", fill: kit.colors.orange, style: "font-weight: 600", text: "compared next" }, g);
      }
      const status = v.done ? "sorted" : "sorting";
      kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 76, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `${status} · comparisons: ${v.comparisons} · swaps: ${v.swaps}` : status }, g);
    }

    draw();

    return {
      update(next) {
        if (next.values) o.values = next.values.slice(0, 10);
        if (next.steps != null) o.steps = next.steps;
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values: sol,
    };
  };
})();
