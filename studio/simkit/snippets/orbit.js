// kit.orbit(stage, { x, y (the star), pxPerAU, a (semi-major axis, AU), e (eccentricity 0–0.8),
//   M (star mass in Suns), showValues, onSample(tYears, rAU, vKmS) })
// → { update({ a, e, M }), showValues(bool), play() → Promise (one full orbit), stop(), values() }
// Physics for derived values: simkit.physics.orbit(a, e, M) → { period (years), rPeri, rAp (AU), vPeri, vAp (km/s) }
//   Kepler's third law: period² = a³ / M
// Always visible: the orbit's shape, a, and the star's mass. The planet's distance and speed are shown next to
// it unless showValues(false). The period is never shown. Keep a·(1+e)·pxPerAU under 300 px (a up to 2.5 at 110).
// Direct interaction: with drag: { a: app.link("a") } the student pulls the planet towards or away from the
// star to resize the orbit (the slider follows). Pass it only when the lesson has a slider for a.
// Example state: { a: 1, e: 0.3, M: 1 }   actions: [{ id: "play", label: "Play one orbit" }]
function (stage, kit, app) {
  const orbit = kit.orbit(stage, { x: 500, y: 280, pxPerAU: 110, drag: { a: app.link("a") } });
  return {
    update(s, d, info) {
      orbit.update({ a: s.a, e: s.e, M: s.M });
      orbit.showValues(info.solved || info.hidden.size === 0);
    },
    stop() { orbit.stop(); },
    play() { return orbit.play(); },
  };
}
