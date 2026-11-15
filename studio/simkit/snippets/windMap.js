// kit.windMap(stage, { x, y (centre), w, high, low (hPa), distance (km between the centres), showValues })
// → { update({ high, low, distance }), show({ speed }), showValues(bool), values() }   values() → { speed, difference }
// Physics for derived values: simkit.physics.windSpeed(high, low, distance) → km/h
//   (= 500 × (high − low) ÷ distance; 1020 and 1000 hPa 500 km apart give 20 km/h)
// Always visible: both pressures, the distance, and arrows drifting from the high to the low (faster for
// stronger wind). The written wind speed is replaced by "?" with show({ speed: false }).
// Pressures 980–1040 hPa, distance 200–1000 km. Occupies x ± w/2, y−130 … y+170.
// Example state: { high: 1020, low: 1000, distance: 500 }
function (stage, kit) {
  const map = kit.windMap(stage, { x: 500, y: 250, w: 760 });
  return {
    update(s, d, info) {
      map.update({ high: s.high, low: s.low, distance: s.distance });
      map.show({ speed: info.solved || !info.hidden.has("speed") });
    },
  };
}
