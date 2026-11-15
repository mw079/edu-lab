// kit.lever(stage, { x, y (top of the pivot), pxPerM, m1 (kg, left load), d1 (m from the pivot), m2 (right load),
//   d2, showValues, drag: { d1: app.link("key"), d2: app.link("key") } })
// → { update({ m1, d1, m2, d2 }), show({ m1, m2 }), showValues(bool), values() }
// Physics for derived values: simkit.physics.lever(m1, d1, m2, d2)
//   → { torque1, torque2 (N·m, = m·9.8·d), net (torque1 − torque2; positive = left side goes down), balanced }
// Always visible: the beam's tilt (level only when m1·d1 = m2·d2) and the ruler on the beam, so both distances
// can be read. A mass is hidden ("? kg") with show({ m1: false }) or show({ m2: false }).
// Direct interaction: with drag: { d2: app.link("d2") } the student can slide the right load along the beam
// (the slider follows); the same for d1. Link only keys that have a slider control.
// Distances from 0 to 2 m, masses up to about 20 kg. Occupies x ± 370, y−150 … y+95.
// Example state: { m1: 4, d1: 1, m2: 2, d2: 1.5 }
function (stage, kit, app) {
  const lever = kit.lever(stage, { x: 500, y: 360, drag: { d1: app.link("d1"), d2: app.link("d2") } });
  return {
    update(s, d, info) {
      lever.update({ m1: s.m1, d1: s.d1, m2: s.m2, d2: s.d2 });
      lever.show({ m2: info.solved || !info.hidden.has("m2") });
    },
  };
}
