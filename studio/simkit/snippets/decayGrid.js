// kit.decayGrid(stage, { x, y, size, count (square number, e.g. 100), halfLife, t, unit, showValues })
// → { update({ t, halfLife }), showValues(bool), values() }   values() → { fraction, remaining }
// Physics for derived values: simkit.physics.decay(n0, t, halfLife) → { fraction (= 0.5^(t / halfLife)), remaining }
// Always visible: the grid of nuclei, purple while undecayed and grey once decayed (they can be counted).
// The two written counts are hidden with showValues(false). Time and half-life are not written on the picture.
// Leaves 50 px free above y for the legend. Pair with kit.plot for the decay curve.
// Example state: { t: 10, halfLife: 10 }
function (stage, kit) {
  // Grid on the left, decay curve on the right.
  const grid = kit.decayGrid(stage, { x: 90, y: 130, size: 340, count: 100 });
  const graph = kit.plot(stage, { x: 560, y: 130, w: 380, h: 300, title: "Undecayed nuclei", xLabel: "time (years)", yLabel: "nuclei",
    xRange: [0, 50], yRange: [0, 100], series: [{ id: "curve", color: kit.colors.purple }, { id: "now", color: kit.colors.red }] });
  return {
    update(s) {
      grid.update({ t: s.t, halfLife: s.halfLife });
      const left = (t) => 100 * kit.physics.decay(100, t, s.halfLife).fraction;
      graph.set("curve", Array.from({ length: 51 }, (_, t) => [t, left(t)]));
      graph.set("now", [[s.t, 0], [s.t, left(s.t)]]);
    },
  };
}
