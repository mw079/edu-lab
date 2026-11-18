// kit.feedbackLoop(stage, { x, y (top-left), push (°C of first warming, 0.5–2), gain (part of each change that
//   comes back per round, −0.8 … 1.2), rounds (0–10), labels: ["warmer air", "less ice", "more sunlight absorbed"],
//   showValues })
// → { update({ push, gain, rounds }), show({ values }), values() }
// Physics for derived values: simkit.physics.feedback(push, gain, rounds)
//   → { total (= push × (1 + gain + gain² + … ), °C after `rounds` rounds), last (the newest round's addition),
//       limit (= push ÷ (1 − gain) when gain is between −1 and 1, otherwise null), kind ("reinforcing" for
//       gain > 0, "balancing" for gain < 0, "none"), runaway (true when gain ≥ 1) }
//   Examples: push 1, gain 0.5 → 1, 1.5, 1.75, … settles at 2; gain −0.5 → settles at 0.67; gain 1 → grows for ever.
// Use sliders: gain −0.8 … 1.2 (step 0.1), rounds 0–10 (step 1), push 0.5–2 (step 0.5).
// Always visible: the loop of three boxes with "× gain", and a bar for the total after each round (the chart
// ends at 6 °C). The written total and the dashed line where it settles are removed with show({ values: false }).
// Occupies x … x+880, y−30 … y+390.
// Direct interaction: with drag: { gain: app.link("gain") } the student drags the top of the second bar (needs rounds ≥ 1).
// Example state: { push: 1, gain: 0.5, rounds: 4 }
function (stage, kit, app) {
  const loop = kit.feedbackLoop(stage, { x: 60, y: 90, drag: { gain: app.link("gain") } });
  return {
    update(s, d, info) {
      loop.update({ push: s.push, gain: s.gain, rounds: s.rounds });
      loop.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
