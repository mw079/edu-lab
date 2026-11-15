// kit.rightTriangle(stage, { x, y (the right-angle corner), pxPerUnit, a (vertical side), b (horizontal side),
//   unit, showValues })
// → { update({ a, b }), show({ a, b, c, angle }), showValues(bool), values() }
// values() → { c (hypotenuse), angle (degrees, between b and c), area }
// Derived values are plain arithmetic: c = Math.hypot(s.a, s.b), angle = Math.atan2(s.a, s.b) * 180 / Math.PI,
// sin = a / c, cos = b / c, tan = a / b.
// Always visible: the triangle's shape. Each written value is replaced by "?" with show({ c: false }),
// show({ angle: false }) …; in a step that asks for c, hide c only (a and b are what the student works from).
// With pxPerUnit 40, keep a ≤ 9 and b ≤ 12. Occupies x−110 … x + b·pxPerUnit + 110, y − a·pxPerUnit − 30 … y+40.
// Example state: { a: 3, b: 4 }
function (stage, kit) {
  const tri = kit.rightTriangle(stage, { x: 280, y: 450, pxPerUnit: 40, unit: "m" });
  return {
    update(s, d, info) {
      tri.update({ a: s.a, b: s.b });
      tri.show({ c: info.solved || !info.hidden.has("c") });
    },
  };
}
