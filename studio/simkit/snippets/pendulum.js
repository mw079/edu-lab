// kit.pendulum(stage, { x, y (pivot), pxPerM, L (m), angle (deg from vertical), mass (kg), g, showValues,
//   onSample(t, angleDeg), drag: { angle: app.link("angle") } })
// → { update({ L, angle, mass, g }), showValues(bool), play({ duration }) → Promise, stop(), period() }
// Physics for derived values: simkit.physics.pendulumPeriod(L, g) → seconds   (g defaults to 9.8)
// Always visible: the string length and the release angle (as labels, unless showValues(false)) and the bob.
// The period is never shown. Keep L × pxPerM under 420 px (L up to 2.4 m at 170) and the angle within ±30°,
// and leave L·pxPerM/2 + 60 px free on both sides of x, so the bob stays on the stage.
// Direct interaction: with drag: { angle: app.link("<the angle control's key>") } the student can drag the bob to
// set the release angle (the slider follows). Link only a key that has a slider control.
// Pair with kit.plot through onSample to draw the angle over time. Occupies about x ± L·pxPerM, y−16 … y+L·pxPerM+50.
// Example state: { L: 1.5, angle: 20, m: 1 }   actions: [{ id: "play", label: "Release" }]
function (stage, kit, app) {
  // Pendulum on the left, angle–time graph on the right.
  let points = [];
  const pend = kit.pendulum(stage, { x: 280, y: 70, drag: { angle: app.link("angle") }, onSample: (t, a) => { points.push([t, a]); graph.set("a", points); } });
  const graph = kit.plot(stage, { x: 520, y: 120, w: 440, h: 300, title: "Angle", xLabel: "t (s)", yLabel: "θ (°)",
    xRange: [0, 6], yRange: [-30, 30], series: [{ id: "a", color: kit.colors.purple }] });
  return {
    update(s) { pend.update({ L: s.L, angle: s.angle, mass: s.m }); },
    reset() { points = []; graph.clear(); },
    stop() { pend.stop(); },
    play() { points = []; graph.clear(); return pend.play({ duration: 6 }); },
  };
}
