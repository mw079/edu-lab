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
    reset() {
      track.reset();
    },
    stop() {
      track.stop();
    },
    run(s) {
      return track.runCollision({ e: s.type === "sticky" ? 0 : 1 });
    },
  };
}
