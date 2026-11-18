// kit.samplingBox(stage, { x, y, percent (% red marbles in the population, 10–90), size (marbles per sample,
//   5–100), count (samples taken so far, 1–60), showTruth, showInterval })
// → { update({ percent, size, count }), show({ truth, interval }), values() }
// Physics for derived values: simkit.physics.sampling(percent, size, count)
//   → { last (% red in the newest sample), mean (average of all sample results), standardError
//       (= √(p(1 − p) ÷ size) in % points), low, high (95 % interval = last ± 1.96 × √(last(100 − last) ÷ size)),
//       contains (does the interval include the real percentage?) }
//   The same numbers always give the same samples. Bigger samples scatter less: 4 times the size halves the spread.
// Use sliders: percent 10–90 (step 10), size 5–100 (step 5), count 1–60 (step 1).
// Always visible: a dot for every sample on a 0–100 % line (the newest ringed), the newest sample's result and
// the average of the samples. The jar's real percentage and its dashed line are hidden with
// show({ truth: false }); the 95 % interval with show({ interval: false }).
// Occupies x … x+830, y−70 … y+320.
// Direct interaction: with click: { count: app.link("count") } the student clicks the jar to take another sample.
// Example state: { percent: 40, size: 20, count: 12 }
function (stage, kit, app) {
  const box = kit.samplingBox(stage, { x: 90, y: 110, click: { count: app.link("count") } });
  return {
    update(s, d, info) {
      box.update({ percent: s.percent, size: s.size, count: s.count });
    },
  };
}
