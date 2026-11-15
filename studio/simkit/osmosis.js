/* simkit.osmosisCell: a cell in a solution; water moves toward the side with more dissolved solute. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=270 (centre of the dish), w=520, h=340, inside=0.3 (solute concentration in the cell, mol/L),
   *         outside=0.3 (in the solution), showValues=true (concentration labels), showArrows=true }
   * The cell swells when water moves in and shrinks when it moves out.
   * Returns { update({ inside, outside }), show({ arrows, values }), showValues(bool), values() }
   * values() -> { water: "in" | "out" | "none", solution: "hypotonic" | "isotonic" | "hypertonic", size }
   */
  kit.osmosisCell = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 270, w: 520, h: 340, inside: 0.3, outside: 0.3, showValues: true, showArrows: true }, opts);
    const g = stage.layer({ class: "simkit-osmosis" });
    const R0 = 80;
    kit.el("rect", { x: o.x - o.w / 2, y: o.y - o.h / 2, width: o.w, height: o.h, rx: 24, fill: "#dceefb", stroke: kit.colors.steel, "stroke-width": 5 }, g);
    const outDots = kit.el("g", null, g);
    const cell = kit.el("circle", { cx: o.x, cy: o.y, fill: "#fdf3d7", stroke: kit.colors.orange, "stroke-width": 5 }, g);
    const inDots = kit.el("g", null, g);
    const arrows = kit.el("g", null, g);
    const outLabel = kit.el("text", { x: o.x, y: o.y + o.h / 2 + 32, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.blueDark }, g);
    const inLabel = kit.el("text", { x: o.x, y: o.y - o.h / 2 - 16, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.orange }, g);
    const spots = Array.from({ length: 90 }, (_, i) => [(0.5 + i * 0.7548776662) % 1, (0.5 + i * 0.569840291) % 1]);
    const sol = () => kit.physics.osmosis(o.inside, o.outside);
    let radius = R0;

    function draw() {
      const v = sol();
      kit.set(cell, { r: radius.toFixed(1) });
      outDots.textContent = "";
      inDots.textContent = "";
      // Solute outside: dots across the dish (those under the cell are covered by it).
      const nOut = kit.clamp(Math.round(o.outside * 100), 0, spots.length);
      for (let i = 0; i < nOut; i++) kit.el("circle", { cx: o.x - o.w / 2 + 16 + spots[i][0] * (o.w - 32), cy: o.y - o.h / 2 + 16 + spots[i][1] * (o.h - 32), r: 5, fill: kit.colors.purple }, outDots);
      // Solute inside the cell stays the same amount, so it looks denser when the cell shrinks.
      const nIn = kit.clamp(Math.round(o.inside * 40), 0, 40);
      for (let i = 0; i < nIn; i++) {
        const a = i * 2.399963;
        const rr = radius * 0.85 * Math.sqrt((i + 0.5) / 40);
        kit.el("circle", { cx: o.x + rr * Math.cos(a), cy: o.y + rr * Math.sin(a), r: 5, fill: kit.colors.purple }, inDots);
      }
      arrows.textContent = "";
      if (o.showArrows && v.water !== "none")
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          const r1 = radius + (v.water === "in" ? 62 : 10);
          const r2 = radius + (v.water === "in" ? 10 : 62);
          kit.arrowShape(arrows, o.x + r1 * Math.cos(a), o.y + r1 * Math.sin(a), o.x + r2 * Math.cos(a), o.y + r2 * Math.sin(a), { color: kit.colors.blue, width: 6, head: 14 });
        }
      kit.set(outLabel, { text: o.showValues ? `solution outside: ${kit.fmt(o.outside, 2)} mol/L` : "solution outside" });
      kit.set(inLabel, { text: o.showValues ? `inside the cell: ${kit.fmt(o.inside, 2)} mol/L at the start` : "cell" });
    }

    stage.onFrame((dt) => {
      const target = R0 * Math.cbrt(sol().size);
      if (Math.abs(target - radius) < 0.2) return;
      radius += (target - radius) * Math.min(1, dt * 2.5);
      draw();
    });
    radius = R0 * Math.cbrt(sol().size);
    draw();

    return {
      update(next) {
        if (next.inside != null) o.inside = next.inside;
        if (next.outside != null) o.outside = next.outside;
        draw();
      },
      /** show({ arrows: false }) hides the water arrows; show({ values: false }) the two concentrations. */
      show(which) {
        if (which.arrows != null) o.showArrows = which.arrows;
        if (which.values != null) o.showValues = which.values;
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
