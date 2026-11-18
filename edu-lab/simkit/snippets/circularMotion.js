// kit.circularMotion(stage, { x, y (centre), radius (m, 0.5–3), speed (m/s, 1–10), mass (kg, 0.1–2), showForce })
// → { update({ radius, speed, mass }), show({ force }), spin() → Promise (one turn),
//     release() → Promise (the string is cut: the ball flies off in a straight line along its velocity), values() }
// Physics for derived values: simkit.physics.circular(mass, speed, radius)
//   → { force (N, = m v² / r, towards the centre), accel (m/s², = v² / r), period (s, = 2πr / v), omega (rad/s) }
//   Doubling the speed makes the force four times bigger; doubling the radius halves it.
//   Example: 0.5 kg at 4 m/s on 2 m → 4 N, one turn in 3.14 s.
// Use sliders: radius 0.5–3 (step 0.5), speed 1–10 (step 1), mass 0.1–2 (step 0.1).
// Always visible: the circle, the radius, the mass, the velocity arrow (along the circle) and the time for one turn.
// The force arrow (to the centre) and its value are hidden with show({ force: false }).
// Occupies x−225 … x+640, y−225 … y+225 (the ball can be 3 m = 225 px from the centre).
// Direct interaction: with drag: { radius: app.link("radius") } the student drags the ball in or out.
// Example state: { radius: 1.5, speed: 4, mass: 0.5 }
function (stage, kit, app) {
  const swing = kit.circularMotion(stage, { x: 300, y: 280, drag: { radius: app.link("radius") } });
  return {
    update(s, d, info) {
      swing.update({ radius: s.radius, speed: s.speed, mass: s.mass });
      swing.show({ force: info.solved || !info.hidden.has("force") });
    },
    spin() {
      return swing.spin();
    },
    release() {
      return swing.release();
    },
  };
}
