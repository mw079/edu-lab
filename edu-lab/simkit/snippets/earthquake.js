// kit.earthquake(stage, { x, y (top-left), w, distance (km from the earthquake to the station, 60–600),
//   magnitude (3–8), showValues })
// → { update({ distance, magnitude }), show({ distance, lag }), values() }
// Physics for derived values: simkit.physics.quake(distance, magnitude)
//   → { tP (= distance ÷ 6, seconds: P waves travel 6 km/s), tS (= distance ÷ 3: S waves travel 3 km/s),
//       lag (= tS − tP = distance ÷ 6, so distance = 6 × lag), shaking (= 10^(magnitude − 5)),
//       energy (= 10^(1.5 × (magnitude − 5)), about 32 × per magnitude step) }
//   Examples: 300 km → P after 50 s, S after 100 s, lag 50 s; 480 km → lag 80 s.
// Use sliders: distance 60–600 (step 30), magnitude 3–8 (step 1).
// Always visible: the ground with the earthquake and the station, and the station's recording with the P and S
// arrivals marked on a time axis (so the lag can be read off). show({ distance: false }) removes the km marks
// (for "how far away is the station?"); show({ lag: false }) writes "? s".
// Occupies x … x+w, y−10 … y+450.
// Direct interaction: with drag: { distance: app.link("distance") } the student drags the station along the ground.
// Example state: { distance: 300, magnitude: 5 }
function (stage, kit, app) {
  const quake = kit.earthquake(stage, { x: 80, y: 70, w: 840, drag: { distance: app.link("distance") } });
  return {
    update(s, d, info) {
      quake.update({ distance: s.distance, magnitude: s.magnitude });
      quake.show({ lag: info.solved || !info.hidden.has("lag") });
    },
  };
}
