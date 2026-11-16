// kit.gearTrain(stage, { x, y (the point where the two gears touch), driver, driven (teeth, 8–32),
//   turns (turns of the driver, 0–4), showValues })
// → { update({ driver, driven, turns }), show({ ratio, outTurns }), values() }
// Physics for derived values: simkit.physics.gears(driver, driven, turns)
//   → { ratio (= driven ÷ driver), outTurns (= turns ÷ ratio), speedTimes (= 1 ÷ ratio),
//       forceTimes (= ratio: the turning force is multiplied), direction ("opposite") }
//   A small gear driving a big one: slower but stronger (a robot that climbs). Big driving small: faster, weaker.
//   Examples: 12 → 24 teeth: ratio 2, the driven gear makes half a turn per turn; 24 → 8: ratio 0.33, three turns.
// Use sliders: driver and driven 8–32 (step 4), turns 0–4 (step 0.25).
// Always visible: both gears with their teeth (written under them), a dot on each that shows how far it turned,
// and the driver's turns. The ratio line becomes "?" with show({ ratio: false }), the driven gear's turns with
// show({ outTurns: false }).
// Occupies x−290 … x+640, y−150 … y+190.
// Direct interaction: with drag: { turns: app.link("turns") } the student turns the driver gear by its dot.
// Example state: { driver: 12, driven: 24, turns: 0.5 }
function (stage, kit, app) {
  const gears = kit.gearTrain(stage, { x: 330, y: 230, drag: { turns: app.link("turns") } });
  return {
    update(s, d, info) {
      gears.update({ driver: s.driver, driven: s.driven, turns: s.turns });
      gears.show({ outTurns: info.solved || !info.hidden.has("outTurns") });
    },
  };
}
