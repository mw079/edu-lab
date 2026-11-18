/* simkit.decayGrid: a sample of radioactive nuclei; half of those left decay in each half-life. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=320, y=120, size=360, count=100 (a square number up to 400), halfLife=10, t=0, unit="years",
   *         showValues=true (the two counts above the grid) }
   * Returns { update({ t, halfLife }), showValues(bool), values() }
   * values() -> { fraction, remaining }   (see simkit.physics.decay). Which nuclei decay is fixed, so the
   * picture is the same every time.
   */
  kit.decayGrid = function (stage, opts) {
    const o = Object.assign({ x: 320, y: 120, size: 360, count: 100, halfLife: 10, t: 0, unit: "years", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-decay" });
    const side = Math.max(2, Math.round(Math.sqrt(o.count)));
    const n = side * side;
    const cell = o.size / side;
    // A fixed shuffle: order[i] is the turn in which nucleus i decays (highest first).
    const order = Array.from({ length: n }, (_, i) => i).sort((p, q) => ((p * 0.6180339887) % 1) - ((q * 0.6180339887) % 1));
    const rank = [];
    order.forEach((i, k) => (rank[i] = k));
    kit.el("rect", { x: o.x - 10, y: o.y - 10, width: o.size + 20, height: o.size + 20, rx: 12, fill: "#fff", stroke: kit.colors.line, "stroke-width": 2 }, g);
    const dots = Array.from({ length: n }, (_, i) => kit.el("circle", { cx: o.x + ((i % side) + 0.5) * cell, cy: o.y + (Math.floor(i / side) + 0.5) * cell, r: cell * 0.36 }, g));
    kit.el("circle", { cx: o.x, cy: o.y - 36, r: 9, fill: kit.colors.purple }, g);
    const leftLabel = kit.el("text", { x: o.x + 18, y: o.y - 31, class: "simkit-label", fill: kit.colors.purple }, g);
    kit.el("circle", { cx: o.x + o.size / 2 + 20, cy: o.y - 36, r: 9, fill: "#d5d9dc" }, g);
    const goneLabel = kit.el("text", { x: o.x + o.size / 2 + 38, y: o.y - 31, class: "simkit-label", fill: kit.colors.muted }, g);
    const sol = () => kit.physics.decay(n, Math.max(0, o.t), o.halfLife);

    function draw() {
      const v = sol();
      dots.forEach((d, i) => kit.set(d, { fill: rank[i] < v.remaining ? kit.colors.purple : "#d5d9dc" }));
      kit.set(leftLabel, { text: o.showValues ? `undecayed: ${v.remaining}` : "undecayed" });
      kit.set(goneLabel, { text: o.showValues ? `decayed: ${n - v.remaining}` : "decayed" });
    }

    draw();

    return {
      update(next) {
        if (next.t != null) o.t = next.t;
        if (next.halfLife != null) o.halfLife = Math.max(1e-6, next.halfLife);
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
