// kit.cartTrack(stage, { y, range: [0, 10], arrows: "momentum" | "velocity" | "none",
//   carts: [{ id: "A", color, label, mass, v, pos }, { id: "B", … }] })   (exactly two carts, A starts on the left)
// → { update({ A: { mass, v, pos }, B: { … } }), showArrows(bool), reset(), stop(),
//     runCollision({ e }) → Promise }   e = 1 elastic (bounce), e = 0 sticky
// Physics for derived values: simkit.physics.collide1D(m1, v1, m2, v2, e) → { v1, v2 } (after the collision)
// Example state: { mA: 2, vA: 2, mB: 2, vB: -2, type: "elastic" }   actions: [{ id: "run", label: "Run collision" }]
function (stage, kit) {
  const track = kit.cartTrack(stage, {
    y: 380,
    carts: [
      { id: "A", color: kit.colors.red, label: "Red cart" },
      { id: "B", color: kit.colors.blue, label: "Blue cart" },
    ],
    arrows: "momentum",
  });
  return {
    update(s, d) {
      track.update({ A: { mass: s.mA, v: s.vA }, B: { mass: s.mB, v: s.vB } });
    },
    reset() { track.reset(); },
    stop() { track.stop(); },
    run(s) { return track.runCollision({ e: s.type === "sticky" ? 0 : 1 }); },
  };
}
