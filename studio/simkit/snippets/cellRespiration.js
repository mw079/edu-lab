// kit.cellRespiration(stage, { x, y (centre), glucose (molecules, 1–5), oxygen (1 = present, 0 = none), showValues })
// → { update({ glucose, oxygen }), show({ values }), values() }
// Physics for derived values: simkit.physics.respiration(glucose, oxygen)
//   → { glycolysis, krebs, chain (ATP made in each step), atp (total), co2, oxygenUsed, lactate, perGlucose }
//   With oxygen, one glucose gives 2 + 2 + 28 = 32 ATP, uses 6 O₂ and gives off 6 CO₂.
//   Without oxygen only glycolysis runs: 2 ATP and 2 lactic acid per glucose.
// Use sliders: glucose 1–5 (step 1), oxygen 0–1 (step 1).
// Always visible: the three steps (the two in the mitochondrion fade without oxygen), the oxygen switch and the
// glucose count. The ATP numbers and bars become "? ATP" with show({ values: false }).
// Occupies x−480 … x+420, y−200 … y+230.
// Direct interaction: with click: { oxygen: app.link("oxygen") } the student clicks the oxygen switch.
// Example state: { glucose: 1, oxygen: 1 }
function (stage, kit, app) {
  const cell = kit.cellRespiration(stage, { x: 520, y: 260, click: { oxygen: app.link("oxygen") } });
  return {
    update(s, d, info) {
      cell.update({ glucose: s.glucose, oxygen: s.oxygen });
      cell.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
