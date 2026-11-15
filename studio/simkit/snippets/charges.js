// kit.charges(stage, { x, y (midpoint between the charges), pxPerM, q1, q2 (µC), r (m), showValues })
// → { update({ q1, q2, r }), show({ q1, q2, r, force }), showValues(bool), values() }
// Physics for derived values: simkit.physics.coulomb(q1, q2, r) → { force (N), attract (true/false) }
//   force = 8.99e9 × |q1·q2| × 1e-12 / r²   with q in µC and r in m
// Always visible: the sign of each charge (colour and + / −) and whether the arrows point together or apart.
// Each written value can be hidden with show({ force: false }), show({ r: false }), show({ q1: false }) …
// Keep r between 0.2 and 1.2 m and the charges between −10 and 10 µC. Occupies x ± 420, y−100 … y+115.
// Direct interaction: with drag: { r: app.link("r") } the student drags either charge sideways to change the
// distance (the slider follows).
// Example state: { q1: 2, q2: -3, r: 0.5 }
function (stage, kit, app) {
  const pair = kit.charges(stage, { x: 500, y: 280, drag: { r: app.link("r") } });
  return {
    update(s, d, info) {
      pair.update({ q1: s.q1, q2: s.q2, r: s.r });
      pair.show({ force: info.solved || !info.hidden.has("force") });
    },
  };
}
