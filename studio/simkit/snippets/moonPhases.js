// kit.moonPhases(stage, { x, y (the Earth), R (orbit radius, px), angle (deg), showName, showView })
// → { update({ angle }), show({ name, view }), values() }
// The angle runs counter-clockwise along the orbit: 0 = new moon (between Earth and Sun), 90 = first quarter,
// 180 = full moon, 270 = last quarter.
// Physics for derived values: simkit.physics.moonPhase(angle)
//   → { name ("New moon", "Waxing crescent", …), lit (fraction of the disc that looks lit, 0–1), day (0–29.5) }
// Always visible: where the Moon is on its orbit and which half the Sun lights. The phase name is hidden with
// show({ name: false }); the whole "seen from Earth" picture with show({ view: false }).
// Sunlight comes from the right. Occupies x−470 … x+390, y ± 190: use it alone on the stage.
// Example state: { angle: 135 }
function (stage, kit) {
  const moon = kit.moonPhases(stage, { x: 590, y: 280 });
  return {
    update(s, d, info) {
      moon.update({ angle: s.angle });
      moon.show({ name: info.solved || !info.hidden.has("phase") });
    },
  };
}
