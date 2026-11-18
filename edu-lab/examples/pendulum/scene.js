function (stage, kit, app) {
  // Pendulum on the left (the bob can be dragged to set the release angle), angle–time graph on the right.
  let points = [];
  const pend = kit.pendulum(stage, { x: 280, y: 70, drag: { angle: app.link("angle") },
    onSample: (t, a) => { points.push([t, a]); graph.set("a", points); } });
  const graph = kit.plot(stage, { x: 540, y: 120, w: 420, h: 300, title: "Angle", xLabel: "t (s)", yLabel: "θ (°)",
    xRange: [0, 6], yRange: [-30, 30], series: [{ id: "a", color: kit.colors.purple }] });
  return {
    update(s) { pend.update({ L: s.L, angle: s.angle, mass: s.m }); },
    reset() { points = []; graph.clear(); },
    stop() { pend.stop(); },
    play() { points = []; graph.clear(); return pend.play({ duration: 6 }); },
  };
}
