// kit.atwood(stage, { x, y (pulley centre), pxPerM, m1 (kg, left), m2 (kg, right), showValues })
// → { update({ m1, m2 }), show({ m1, m2 }), showValues(bool), play() → Promise, stop(), reset(), values() }
// Physics for derived values: simkit.physics.atwood(m1, m2)
//   → { a (m/s², = |m1 − m2|·9.8 / (m1 + m2)), tension (N, = 2·m1·m2·9.8 / (m1 + m2)), heavier: "m1" | "m2" | "none" }
// Always visible: both masses (size and label) and which one goes down when played. The acceleration and the
// tension are never written. A mass is hidden ("? kg") with show({ m1: false }) or show({ m2: false }).
// play() lets the heavier mass fall 1 m in real time (slower when the masses are nearly equal).
// Occupies x−170 … x+250, y−80 … y+340. Masses 0.5–20 kg.
// Example state: { m1: 3, m2: 2 }   actions: [{ id: "play", label: "Release" }]
function (stage, kit) {
  const machine = kit.atwood(stage, { x: 460, y: 110 });
  return {
    update(s) { machine.update({ m1: s.m1, m2: s.m2 }); },
    reset() { machine.reset(); },
    stop() { machine.stop(); },
    play() { return machine.play(); },
  };
}
