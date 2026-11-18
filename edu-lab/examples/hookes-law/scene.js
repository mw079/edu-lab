function (stage, kit, app) {
  // Initial values match the opening setup (k = 20 N/m, m = 1 kg, stretch = 0.2 m),
  // so the block and spring end are drawn at the 20 cm mark from the start.
  const spring = kit.springMass(stage, {
    x: 120,
    y: 280,
    k: 20,
    mass: 1,
    displacement: 0.2,
    drag: { displacement: app.link("x") },
  });
  return {
    update(s) {
      spring.update({ k: s.k, mass: s.m, displacement: s.x });
    },
    reset(s) {
      spring.stop();
      spring.update({ k: s.k, mass: s.m, displacement: s.x });
    },
    stop() {
      spring.stop();
    },
    play(s) {
      return spring.play({ amplitude: s.x, duration: 6 });
    },
  };
}
