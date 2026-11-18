// kit.seasons(stage, { x, y (the Sun), a, b (orbit size, px), month (1–12), latitude (deg, negative = south),
//   tilt (deg), showValues })
// → { update({ month, latitude, tilt }), show({ season, daylight }), showValues(bool), values() }
// Physics for derived values: simkit.physics.daylight(month, latitude, tilt)
//   → { daylight (hours of daylight), noonSun (degrees above the horizon at midday), season ("summer", …) }
//   month 6 is the June solstice, 12 the December solstice, 3 and 9 the equinoxes (12 hours everywhere).
//   With tilt 0 every day has 12 hours.
// Always visible: where the Earth is on its orbit, which way its axis leans, and the month and latitude.
// The written season and day length are replaced by "?" with show({ season: false }) / show({ daylight: false }).
// The text column needs 250 px to the right of x + a + 150; with the defaults use it alone on the stage.
// Example state: { month: 6, latitude: 45 }
function (stage, kit) {
  const year = kit.seasons(stage, { x: 370, y: 270, a: 240, b: 110, tilt: 23.5 });
  return {
    update(s, d, info) {
      year.update({ month: s.month, latitude: s.latitude });
      year.show({ daylight: info.solved || !info.hidden.has("daylight") });
    },
  };
}
