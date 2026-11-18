// kit.gravityPair(stage, { x, y (midpoint between the bodies), pxPerUnit, m1, m2 (in 10^24 kg), r (distance
//   between the centres in 10^8 m), label1, label2 })
// → { update({ m1, m2, r }), show({ m1, m2, r, force }), values() }
// Physics for derived values: simkit.physics.gravity(m1, m2, r) → { force }   in 10^20 N
//   force = 66.74 × m1 × m2 ÷ r²   (Earth 5.97 and Moon 0.0735 at r = 3.84 gives 1.99)
//   Doubling one mass doubles the force; doubling the distance makes it four times smaller.
// Use sliders: m1 and m2 1–10 (step 1), r 1–10 (step 1). Write units in labels as "× 10^24 kg", "× 10^8 m",
// "× 10^20 N".
// Always visible: both bodies, the equal arrows pulling them together, and their names. Each written value can
// be hidden on its own with show({ force: false }), show({ r: false }), show({ m1: false }) …
// Keep r × pxPerUnit under 640. Occupies x ± 400, y−110 … y+170.
// Direct interaction: with drag: { r: app.link("r") } the student drags either body sideways to change the distance.
// Example state: { m1: 6, m2: 1, r: 4 }
function (stage, kit, app) {
  const pair = kit.gravityPair(stage, { x: 500, y: 250, drag: { r: app.link("r") } });
  return {
    update(s, d, info) {
      pair.update({ m1: s.m1, m2: s.m2, r: s.r });
      pair.show({ force: info.solved || !info.hidden.has("force") });
    },
  };
}
