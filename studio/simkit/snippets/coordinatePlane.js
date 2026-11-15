// kit.coordinatePlane(stage, { x, y (top-left of the grid), size, range, m, b, showLine, showEquation, showSlope,
//   points: [{ id, x, y, label, color }] })
// → { update({ m, b, points: { [id]: { x, y } } }), show({ line, equation, slope }), values() }
// Derived values are plain arithmetic: y = s.m * x + s.b, x-intercept = -s.b / s.m,
// slope between two points = (y2 − y1) / (x2 − x1).
// Always visible: the grid with numbered axes, so the y-intercept, the slope and where the line crosses the x-axis
// can all be read from the line. A question step must ask for something that needs a calculation instead.
// The written equation is hidden with show({ equation: false }), the rise/run triangle with show({ slope: false }),
// the line itself with show({ line: false }) (for steps about plotting points).
// The equation is written to the right of the grid: leave 200 px free there. Keep |m| ≤ 5 and |b| ≤ range.
// Direct interaction: with drag: { b: app.link("b"), m: app.link("m") } the student drags the y-intercept point
// (b) and a second ring on the line (slope) (the sliders follow). Pass only the links whose sliders exist.
// Example state: { m: 2, b: 1 }
function (stage, kit, app) {
  const plane = kit.coordinatePlane(stage, { x: 250, y: 50, size: 440, range: 10, drag: { b: app.link("b"), m: app.link("m") } });
  return {
    update(s, d, info) {
      plane.update({ m: s.m, b: s.b });
      plane.show({ equation: info.solved || !info.hidden.has("slope") });
    },
  };
}
