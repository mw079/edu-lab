// kit.springMass(stage, { x, y, k (N/m), mass (kg), displacement (m, + right), showForce, onSample(t, x) })
// → { update({ k, mass, displacement }), play({ amplitude, duration }) → Promise, stop(), period() }
// Physics for derived values: simkit.physics.springPeriod(k, m) → seconds;  force F = -k * x;  energy E = 0.5 * k * x * x
// Draws its own wall, floor, ruler in cm from the rest position, the block with its mass and the force arrow
// with its value: do not add another ruler, mass label or force label. Occupies x … x+760, y-110 … y+120.
// Pair with kit.plot through onSample to draw x(t) while it oscillates.
// Example state: { k: 20, m: 1, x: 0.2 }   actions: [{ id: "play", label: "Release" }]
function (stage, kit) {
  // The spring uses the top half of the stage (with its ruler), the graph the bottom half.
  let points = [];
  const spring = kit.springMass(stage, { x: 120, y: 130, onSample: (t, x) => { points.push([t, x]); graph.set("x", points); } });
  const graph = kit.plot(stage, { x: 120, y: 290, w: 800, h: 230, title: "Position", xLabel: "t (s)", yLabel: "x (m)",
    xRange: [0, 6], yRange: [-0.3, 0.3], series: [{ id: "x", color: kit.colors.purple }] });
  return {
    update(s) { spring.update({ k: s.k, mass: s.m, displacement: s.x }); },
    reset() { points = []; graph.clear(); },
    stop() { spring.stop(); },
    play(s) { points = []; graph.clear(); return spring.play({ amplitude: s.x, duration: 6 }); },
  };
}
