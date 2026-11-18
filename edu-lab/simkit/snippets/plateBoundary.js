// kit.plateBoundary(stage, { x (the boundary), y (sea level), w, speed (cm per year; + = together, − = apart),
//   years (million years), kind: "ocean-continent" | "ocean-ocean" | "continent-continent", showValues, showFeature })
// → { update({ speed, years, kind }), show({ values, feature }), values() }
// Physics for derived values: simkit.physics.plates(speed, years, kind) → { boundary, feature, distance (km) }
//   distance = |speed| × years × 10   (1 cm per year for 1 million years = 10 km)
//   boundary: "convergent" (speed > 0), "divergent" (speed < 0), "none" (0)
//   feature: mid-ocean ridge, rift valley, trench and volcanoes, trench and island arc, mountain range
// "kind" is a select control with those three values, or fixed per step in "setup".
// Always visible: the two plates in cross-section, the arrows showing their motion, the speed and the time, and
// what forms at the boundary (gap with rising magma, sinking plate with a volcano, or mountains). The written
// name of the boundary is replaced by "?" with show({ feature: false }), the distance with show({ values: false }).
// Occupies x ± w/2, y−190 … y+240.
// Direct interaction: with drag: { speed: app.link("speed") } the student pushes the left plate towards the
// boundary or pulls it away (the slider follows).
// Example state: { speed: 4, years: 20, kind: "ocean-continent" }
function (stage, kit, app) {
  const plates = kit.plateBoundary(stage, { x: 500, y: 260, w: 760, drag: { speed: app.link("speed") } });
  return {
    update(s, d, info) {
      plates.update({ speed: s.speed, years: s.years, kind: s.kind });
      plates.show({ values: info.solved || !info.hidden.has("distance") });
    },
  };
}
