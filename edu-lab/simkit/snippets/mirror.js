// kit.mirror(stage, { x, y (where the ray hits the mirror), angle (angle of incidence from the normal, 0–85),
//   curved (0 = flat mirror, one ray; 1 = concave mirror, parallel rays meeting at the focus F), focal (cm, 5–25),
//   showReflected })
// → { update({ angle, curved, focal }), show({ reflected }), values() }
// Physics for derived values: law of reflection, angle of reflection = angle of incidence (both from the normal).
//   Concave mirror images: simkit.physics.mirror(f, dObject) → { dImg (cm, + = real, in front), m, real, upright }
//   Example: f = 10 cm, object at 30 cm → image at 15 cm, real, upside down, half the size (m = −0.5).
// Use sliders: angle 0–85 (step 5), focal 5–25 (step 5); curved 0–1 (step 1).
// Always visible: the mirror, the normal (dashed), the incoming ray and its angle i. The reflected ray and its angle r
// (flat), or the reflected rays and F (concave), are hidden with show({ reflected: false }).
// Occupies x−260 … x+330, y−300 … y+20.
// Direct interaction: with drag: { angle: app.link("angle") } the student swings the incoming ray by its end (flat mirror).
// Example state: { angle: 40, curved: 0, focal: 15 }
function (stage, kit, app) {
  const mirror = kit.mirror(stage, { x: 400, y: 440, drag: { angle: app.link("angle") } });
  return {
    update(s, d, info) {
      mirror.update({ angle: s.angle, curved: s.curved, focal: s.focal });
      mirror.show({ reflected: info.solved || !info.hidden.has("reflection") });
    },
  };
}
