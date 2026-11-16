// kit.unitCircle(stage, { x, y (centre), r, angle (degrees, anticlockwise from the right), showValues, showGraph })
// → { update({ angle }), show({ values, graph }), values() }
// Physics for derived values: simkit.physics.trig(angleDeg) → { sin, cos, tan (null at 90° and 270°), quadrant }
// Always visible: the angle, the point on the circle, its blue "across" line (cos θ) and red "up" line (sin θ),
// and the sine curve beside the circle with the same point on it. The numbers for sin θ and cos θ are written
// "?" with show({ values: false }); show({ graph: false }) removes the sine curve.
// Use an angle slider from 0 to 360 in steps of 5 or 15. Occupies x−r−30 … x+r+480.
// Direct interaction: with drag: { angle: app.link("angle") } the student drags the point around the circle.
// Example state: { angle: 40 }
function (stage, kit, app) {
  const circle = kit.unitCircle(stage, { x: 250, y: 270, r: 170, drag: { angle: app.link("angle") } });
  return {
    update(s, d, info) {
      circle.update({ angle: s.angle });
      circle.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
