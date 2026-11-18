// kit.oceanGyre(stage, { x, y (centre of the ocean), wind (0–10), north (1 = northern hemisphere, 0 = southern), showValues })
// → { update({ wind, north }), show({ values }), values() }
// Physics for derived values: simkit.physics.gyre(wind, north)
//   → { direction ("clockwise" in the north, "counterclockwise" in the south), speed (= 8 × wind, km per day),
//       lapYears (= 12000 km ÷ speed ÷ 365; null when there is no wind), west ("warm"), east ("cold") }
//   The winds push the water into a loop; the Earth's spin turns it. The current on the ocean's west side comes
//   from the equator and is warm; the one on the east side comes from the pole and is cold.
// Use sliders: wind 0–10 (step 1), north 0–1 (step 1).
// Always visible: the ocean between two coasts, the equator, the loop with its arrows (thicker with more wind)
// and the two wind arrows. The written direction, speed and lap time become "?" with show({ values: false }).
// Occupies x−390 … x+390, y−190 … y+240.
// Direct interaction: with drag: { wind: app.link("wind") } the student stretches the upper wind arrow.
// Example state: { wind: 5, north: 1 }
function (stage, kit, app) {
  const sea = kit.oceanGyre(stage, { x: 500, y: 240, drag: { wind: app.link("wind") } });
  return {
    update(s, d, info) {
      sea.update({ wind: s.wind, north: s.north });
      sea.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
