// kit.electromagnet(stage, { x, y (centre of the coil), turns (10–100), current (A, −5…5; the sign swaps N and S),
//   core (1 = iron core, 0 = air), showField })
// → { update({ turns, current, core }), show({ field }), values() }
// Physics for derived values: simkit.physics.electromagnet(turns, current, core)
//   → { field (mT, = 4π×10⁻⁷ × µr × turns × |current| / 0.1 m × 1000, µr = 200 with iron, 1 without),
//       clips (paper clips it holds = field ÷ 10, at most 12), north ("right", "left", "none") }
//   More turns or more current: stronger. The iron core makes it about 200 times stronger. Reversing the current swaps
//   the poles. Examples: 20 turns, 2 A, iron → 100.5 mT, 10 clips; the same without iron → 0.5 mT, 0 clips.
// Use sliders: turns 10–100 (step 10), current −5…5 (step 1), core 0–1 (step 1).
// Always visible: the turns, the core, the current, the poles (N, S), the field lines and the paper clips it holds.
// The field strength becomes "field ? mT" with show({ field: false }).
// Occupies x−200 … x+330, y−110 … y+250.
// Direct interaction: with click: { current: app.link("current") } the student clicks the battery to reverse the current.
// Example state: { turns: 20, current: 2, core: 1 }
function (stage, kit, app) {
  const magnet = kit.electromagnet(stage, { x: 400, y: 190, click: { current: app.link("current") } });
  return {
    update(s, d, info) {
      magnet.update({ turns: s.turns, current: s.current, core: s.core });
      magnet.show({ field: info.solved || !info.hidden.has("field") });
    },
  };
}
