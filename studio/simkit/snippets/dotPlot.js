// kit.dotPlot(stage, { x, y (left end of the number line), w, min, max, values: [numbers], showMean, showMedian })
// → { update({ values }), show({ mean, median }), values() }   values() → { mean, median, min, max, range }
// Physics for derived values: simkit.physics.stats([s.v1, s.v2, …]) → { mean, median, min, max, range }
// The state holds one key per number (v1 … v5 below); pass them as an array.
// Always visible: every number as a dot on the line (equal numbers stack). The mean (red balance point under
// the line) and the median (dashed purple line) are hidden with show({ mean: false }) / show({ median: false }).
// Leaves 280 px free above y for stacked dots and 95 px below it. Numbers should be whole or halves.
// Example state: { v1: 2, v2: 3, v3: 3, v4: 5, v5: 9 }
function (stage, kit) {
  const plot = kit.dotPlot(stage, { x: 120, y: 380, w: 760, min: 0, max: 10 });
  return {
    update(s, d, info) {
      plot.update({ values: [s.v1, s.v2, s.v3, s.v4, s.v5] });
      plot.show({ mean: info.solved || !info.hidden.has("mean") });
    },
  };
}
