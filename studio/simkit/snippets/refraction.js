// kit.refraction(stage, { x, y, w, h, n1 (upper material), n2 (lower material), angle (deg from the normal),
//   label1, label2, showRefracted })
// → { update({ n1, n2, angle, label1, label2 }), showRefracted(bool), values() }
// Physics for derived values: simkit.physics.snell(n1, n2, angleDeg)
//   → { theta2 (deg, null when totally reflected), tir (true/false), critical (deg, null if n1 <= n2) }
// The ray always travels from the upper material (n1) into the lower one (n2). For light leaving glass, set
// n1 = 1.5, n2 = 1 and the labels to match. Always visible: both refractive indices and the angle of incidence.
// The refracted ray and θ₂ are hidden with showRefracted(false): use it in a step that asks for θ₂.
// Direct interaction: with drag: { angle: app.link("angle") } the student swings the incoming ray by its end
// (the slider follows). Pass it only when the lesson has an angle slider.
// Example state: { angle: 30, n1: 1, n2: 1.5 }
function (stage, kit, app) {
  const ray = kit.refraction(stage, { x: 240, y: 70, w: 520, h: 420, drag: { angle: app.link("angle") } });
  return {
    update(s, d, info) {
      ray.update({ n1: s.n1, n2: s.n2, angle: s.angle, label1: s.n1 > 1.2 ? "glass" : "air", label2: s.n2 > 1.2 ? "glass" : "air" });
      ray.showRefracted(info.solved || !info.hidden.has("theta2"));
    },
  };
}
