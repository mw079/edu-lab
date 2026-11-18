// kit.motionTrack(stage, { x, y (left end of the road), w, xMax (m shown), x0, v0 (m/s), a (m/s²), showValues,
//   onSample(t, x, v) })
// → { update({ x0, v0, a }), show({ v, t }), showValues(bool), play({ duration }) → Promise, stop(), reset(), values(t) }
// Physics for derived values: simkit.physics.motion(x0, v0, a, t) → { x, v }   (x = x0 + v0·t + ½·a·t², v = v0 + a·t)
// Always visible: the car's position against the distance marks. The clock and the speed arrow with its label are hidden with
// show({ t: false }) or show({ v: false }). play() runs in real time and stops when the car leaves the road, so
// choose xMax, v0 and a so that the interesting part takes 3–8 s. The road occupies y−180 … y+45.
// Pair with kit.plot through onSample for a position–time or velocity–time graph.
// Example state: { v0: 0, a: 2 }   actions: [{ id: "play", label: "Go" }]
function (stage, kit) {
  // Road at the bottom, velocity–time graph above it.
  let points = [];
  const car = kit.motionTrack(stage, { x: 80, y: 470, w: 840, xMax: 100, onSample: (t, x, v) => { points.push([t, v]); graph.set("v", points); } });
  const graph = kit.plot(stage, { x: 330, y: 40, w: 420, h: 200, title: "Velocity", xLabel: "t (s)", yLabel: "v (m/s)",
    xRange: [0, 10], yRange: [0, 30], series: [{ id: "v", color: kit.colors.purple }] });
  return {
    update(s) { car.update({ v0: s.v0, a: s.a }); },
    reset() { points = []; graph.clear(); car.reset(); },
    stop() { car.stop(); },
    play() { points = []; graph.clear(); return car.play({ duration: 10 }); },
  };
}
