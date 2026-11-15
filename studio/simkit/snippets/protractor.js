// kit.protractor(stage, { x, y (the vertex), r, angle (0–180°), showValue, showType, showScale })
// → { update({ angle }), show({ value, type, scale }), values() }   values() → { type, complement, supplement }
// Derived values are plain arithmetic: supplement = 180 - s.angle, complement = 90 - s.angle;
// acute < 90, right = 90, obtuse between 90 and 180, straight = 180.
// Always visible: the two rays and the protractor, so the angle can be read from the scale. The written size
// is hidden with show({ value: false }), the name (acute, right, obtuse …) with show({ type: false }), the
// protractor's numbers with show({ scale: false }) (for estimating).
// Occupies x ± (r + 40), y − r − 40 … y + 50: use it alone on the stage.
// Direct interaction: with drag: { angle: app.link("angle") } the student turns the red ray by its end (the
// slider follows).
// Example state: { angle: 60 }
function (stage, kit, app) {
  const angle = kit.protractor(stage, { x: 500, y: 420, r: 260, drag: { angle: app.link("angle") } });
  return {
    update(s, d, info) {
      angle.update({ angle: s.angle });
      angle.show({ type: info.solved || !info.hidden.has("type") });
    },
  };
}
