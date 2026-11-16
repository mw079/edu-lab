// kit.confidenceIntervals(stage, { x, y (top-left of the chart), w, h, percent (% red in the population),
//   size (per sample, 10–200), level (80, 90, 95 or 99), count (samples, 1–50), showTruth })
// → { update({ percent, size, level, count }), show({ truth }), values() }
// Many samples from the same population; each gives one confidence interval, drawn as a line.
// Physics for derived values: simkit.physics.intervals(percent, size, level, count)
//   → { hits (intervals that contain the real value), misses, coverage (= 100 × hits ÷ count, %),
//       z (1.282, 1.645, 1.96 or 2.576), halfWidth (= z × √(p(1 − p) ÷ size) in % points) }
//   The same numbers always give the same samples. About `level` % of the intervals contain the real value.
//   A higher level or a smaller sample makes every interval wider: 4 times the size halves the width.
// Use sliders: level 80–99 with "options" or as fixed values in "setup" (only 80, 90, 95, 99 are known),
//   size 10–200 (step 10), count 5–50 (step 5), percent 10–90 (step 10).
// Always visible: one line per sample with its middle, and the level, sample size and number of samples.
// show({ truth: false }) removes the real value's line, colours all intervals alike and writes "?" for the counts.
// Occupies x … x+w+320, y−20 … y+h+60.
// Direct interaction: with click: { count: app.link("count") } the student clicks the button to take 5 more samples.
// Example state: { percent: 40, size: 50, level: 95, count: 20 }
function (stage, kit, app) {
  const plot = kit.confidenceIntervals(stage, { x: 100, y: 60, click: { count: app.link("count") } });
  return {
    update(s, d, info) {
      plot.update({ percent: s.percent, size: s.size, level: s.level, count: s.count });
      plot.show({ truth: info.solved || info.hidden.size === 0 });
    },
  };
}
