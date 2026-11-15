// kit.incline(stage, { x, y (lower-left corner), base (px), angle (deg, 0–45), mass (kg), mu (friction
//   coefficient), g, lengthM (metres the block can slide), showForces, showValues, showComponents })
// → { update({ angle, mass, mu, g }), showForces(bool), showValues(bool), showComponents(bool), slide() → Promise, reset(), stop(), values() }
// Physics for derived values: simkit.physics.incline(m, angleDeg, mu, g)
//   → { weight, normal, parallel, friction, net, a }   (N and m/s²; a = 0 when friction holds the block)
// Always visible: the slope angle and the block's mass. The force arrows (W weight, N normal, f friction) show
// their values unless showValues(false); use that, or showForces(false), in a step that asks for a force.
// showComponents: true adds a dashed arrow "W∥" for the part of the weight along the slope (= parallel);
// use it when a step is about that component.
// Occupies x … x+base+40, y−base·tan(angle)−90 … y+10.
// Example state: { angle: 30, m: 2, mu: 0.2 }   actions: [{ id: "slide", label: "Let go" }]
function (stage, kit) {
  const ramp = kit.incline(stage, { x: 160, y: 480, base: 560, showComponents: true });
  return {
    update(s, d, info) {
      ramp.update({ angle: s.angle, mass: s.m, mu: s.mu });
      ramp.showValues(info.solved || info.hidden.size === 0);
    },
    reset() { ramp.reset(); },
    stop() { ramp.stop(); },
    slide() { return ramp.slide(); },
  };
}
