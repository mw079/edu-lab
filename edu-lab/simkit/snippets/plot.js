// kit.plot(stage, { x, y, w, h, title, xLabel, yLabel, xRange: [min, max], yRange: [min, max], autoY,
//   series: [{ id, color, label, dashed }] })
// → { set(id, [[x, y], …]), add(id, [x, y]), clear(), setRange({ xRange, yRange }) }
// Good for showing a relationship: recompute the points in update() from the state.
// Example state: { u: 2, a: 1 }   (velocity–time graph v = u + a t)
function (stage, kit) {
  const graph = kit.plot(stage, { x: 120, y: 40, w: 760, h: 440, title: "Velocity", xLabel: "t (s)", yLabel: "v (m/s)",
    xRange: [0, 10], yRange: [0, 30], series: [{ id: "v", color: kit.colors.blue, label: "v = u + a·t" }] });
  return {
    update(s) {
      const pts = [];
      for (let t = 0; t <= 10; t += 0.5) pts.push([t, s.u + s.a * t]);
      graph.set("v", pts);
    },
  };
}
