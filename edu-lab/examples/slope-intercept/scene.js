function (stage, kit, app) {
  const plane = kit.coordinatePlane(stage, {
    x: 250,
    y: 50,
    size: 440,
    range: 10,
    drag: { m: app.link("m"), b: app.link("b") },
  });
  return {
    update(s, d, info) {
      plane.update({ m: s.m, b: s.b });
      plane.show({ line: true, equation: true, slope: true });
    },
    reset(s) {
      plane.update({ m: s.m, b: s.b });
      plane.show({ line: true, equation: true, slope: true });
    },
  };
}
