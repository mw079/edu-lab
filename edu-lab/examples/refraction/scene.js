function (stage, kit, app) {
  const ray = kit.refraction(stage, {
    x: 240, y: 70, w: 520, h: 420,
    drag: { angle: app.link("angle") },
  });
  const name = (n) => (n > 1.4 ? "glass" : n > 1.2 ? "water" : "air");
  const draw = (s, info) => {
    ray.update({
      n1: s.n1,
      n2: s.n2,
      angle: s.angle,
      label1: name(s.n1),
      label2: name(s.n2),
    });
    ray.showRefracted(info.solved || !info.hidden.has("theta2"));
  };
  return {
    update(s, d, info) { draw(s, info); },
    reset(s, d, info) { draw(s, info); },
  };
}
