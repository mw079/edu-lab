/* simkit.fractionBars: one to three bars of the same length, each cut into equal parts with some shaded. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=170, y=110, w=640, barHeight=70, gap=56, bars: [{ id, n, d, color, label }] (1–3; n of d parts
   *         shaded, d from 1 to 20), showValues=true (the fraction written next to each bar) }
   * All bars stand for the same whole, so equal shaded lengths mean equal fractions.
   * Returns { update({ bars: { [id]: { n, d } } }), show({ [id]: bool }), showValues(bool), values() }
   * values() -> { [id]: n / d }
   */
  kit.fractionBars = function (stage, opts) {
    const o = Object.assign({ x: 170, y: 110, w: 640, barHeight: 70, gap: 56, bars: [], showValues: true }, opts);
    const g = stage.layer({ class: "simkit-fraction" });
    const palette = [kit.colors.blue, kit.colors.red, kit.colors.green];
    const bars = o.bars.slice(0, 3).map((b, i) => ({ id: b.id || `b${i + 1}`, n: b.n ?? 1, d: b.d ?? 2, color: b.color || palette[i], label: b.label || "", shown: o.showValues }));

    function draw() {
      g.textContent = "";
      bars.forEach((b, i) => {
        const y = o.y + i * (o.barHeight + o.gap);
        const d = kit.clamp(Math.round(b.d), 1, 20);
        const n = kit.clamp(Math.round(b.n), 0, d);
        const part = o.w / d;
        for (let k = 0; k < d; k++) kit.el("rect", { x: o.x + k * part, y, width: part, height: o.barHeight, fill: k < n ? b.color : "#fff", "fill-opacity": k < n ? 0.85 : 1, stroke: kit.colors.ink, "stroke-width": 2 }, g);
        if (b.label) kit.el("text", { x: o.x - 18, y: y + o.barHeight / 2 + 6, "text-anchor": "end", class: "simkit-label", fill: b.color, text: b.label }, g);
        // The fraction, written as a stack: numerator, line, denominator.
        const fx = o.x + o.w + 44;
        const cy = y + o.barHeight / 2;
        const style = "font-size: 22px";
        if (b.shown) {
          kit.el("text", { x: fx, y: cy - 8, "text-anchor": "middle", class: "simkit-label", style, fill: kit.colors.ink, text: String(n) }, g);
          kit.el("line", { x1: fx - 16, y1: cy, x2: fx + 16, y2: cy, stroke: kit.colors.ink, "stroke-width": 2 }, g);
          kit.el("text", { x: fx, y: cy + 24, "text-anchor": "middle", class: "simkit-label", style, fill: kit.colors.ink, text: String(d) }, g);
        } else kit.el("text", { x: fx, y: cy + 8, "text-anchor": "middle", class: "simkit-label", style, fill: kit.colors.muted, text: "?" }, g);
      });
    }

    draw();

    return {
      update(next) {
        if (next.bars) bars.forEach((b) => next.bars[b.id] && Object.assign(b, Object.fromEntries(Object.entries(next.bars[b.id]).filter(([key, v]) => v != null && (key === "n" || key === "d")))));
        draw();
      },
      /** Show or hide the written fraction of single bars, e.g. show({ sum: false }). */
      show(which) {
        bars.forEach((b) => which[b.id] != null && (b.shown = which[b.id]));
        draw();
      },
      showValues(visible) {
        bars.forEach((b) => (b.shown = visible));
        draw();
      },
      values: () => Object.fromEntries(bars.map((b) => [b.id, b.n / b.d])),
    };
  };
})();
