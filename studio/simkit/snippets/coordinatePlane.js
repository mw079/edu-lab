// kit.coordinatePlane(stage, { x, y (top-left of the grid), size, range, m, b, showLine, showEquation, showSlope,
//   points: [{ id, x, y, label, color }] })
// → { update({ m, b, points: { [id]: { x, y } } }), show({ line, equation, slope }), values() }
// Derived values are plain arithmetic: y = s.m * x + s.b, x-intercept = -s.b / s.m,
// slope between two points = (y2 − y1) / (x2 − x1).
// Always visible: the grid with numbered axes, so the y-intercept and the slope can be read from the line.
// The written equation is hidden with show({ equation: false }), the rise/run triangle with show({ slope: false }),
// the line itself with show({ line: false }) (for steps about plotting points).
// The equation is written to the right of the grid: leave 200 px free there. Keep |m| ≤ 5 and |b| ≤ range.
// Example state: { m: 2, b: 1 }
function (stage, kit) {
  const plane = kit.coordinatePlane(stage, { x: 250, y: 50, size: 440, range: 10 });
  return {
    update(s, d, info) {
      plane.update({ m: s.m, b: s.b });
      plane.show({ equation: info.solved || !info.hidden.has("slope") });
    },
  };
}
