// kit.magnetCoil(stage, { x, y (centre of the coil), turns (5–50), speed (m/s: + into the coil, − out of it, 0 = still),
//   strength (magnet strength 1–3), showReading })
// → { update({ turns, speed, strength }), show({ reading }), run() → Promise (the magnet moves), values() }
// Physics for derived values: simkit.physics.induction(turns, speed, strength)
//   → { emf (mV, = 10 × turns × strength × speed; + = needle right), size, direction ("right", "left", "none") }
//   A bigger voltage needs more turns, a stronger magnet or faster movement; pulling out reverses it; still = 0.
//   Examples: 10 turns, strength 1, 2 m/s → 200 mV; 20 turns, strength 2, −1 m/s → −400 mV.
// Use sliders: turns 5–50 (step 5), speed −4…4 (step 1), strength 1–3 (step 1).
// Always visible: the magnet, the number of turns, the magnet strength and how the magnet moves (arrow and words).
// The needle is hidden and the reading becomes "? mV" with show({ reading: false }).
// Occupies x−340 … x+330, y−100 … y+270.
// Direct interaction: with drag: { speed: app.link("speed") } the student pushes or pulls the magnet sideways; how far
// sets the speed (right = into the coil).
// Example state: { turns: 10, speed: 2, strength: 1 }
function (stage, kit, app) {
  const coil = kit.magnetCoil(stage, { x: 440, y: 200, drag: { speed: app.link("speed") } });
  return {
    update(s, d, info) {
      coil.update({ turns: s.turns, speed: s.speed, strength: s.strength });
      coil.show({ reading: info.solved || !info.hidden.has("emf") });
    },
    run() {
      return coil.run();
    },
  };
}
