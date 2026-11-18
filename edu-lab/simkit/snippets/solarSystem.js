// kit.solarSystem(stage, { x, y (the Sun), planet (1 Mercury, 2 Venus, 3 Earth, 4 Mars, 5 Jupiter, 6 Saturn,
//   7 Uranus, 8 Neptune), years (Earth years passed), showValues })
// → { update({ planet, years }), show({ values }), values() }
// Physics for derived values: simkit.physics.planet(planet, years)
//   → { name, a (distance from the Sun in AU), period (Earth years for one orbit = a^1.5), speed (km/s),
//       orbits (completed in that many years = years ÷ period) }
//   Distances: 0.39, 0.72, 1, 1.52, 5.2, 9.58, 19.2, 30.1 AU. Farther planets move slower and have longer years.
// Use a slider planet 1–8 (step 1) and, to let time pass, years 0–30 (step 1).
// Always visible: the Sun, all eight orbits in order (drawn evenly spaced, not to scale), each planet where it is
// after "years", and the chosen planet's name. Its distance, year length and speed become "?" with
// show({ values: false }).
// Leaves 330 px free to the right of the orbits for the text.
// Direct interaction: with click: { planet: app.link("planet") } the student clicks a planet to choose it.
// Example state: { planet: 3, years: 0 }
function (stage, kit, app) {
  const sky = kit.solarSystem(stage, { x: 300, y: 280, click: { planet: app.link("planet") } });
  return {
    update(s, d, info) {
      sky.update({ planet: s.planet, years: s.years });
      sky.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
