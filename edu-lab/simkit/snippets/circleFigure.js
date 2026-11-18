// kit.circleFigure(stage, { x, y (centre), pxPerUnit, r, angle (degrees of the shaded sector, 360 = whole circle),
//   unit, showValues })
// → { update({ r, angle }), show({ r, angle, circumference, area }), showValues(bool), values() }
// values() → { circumference, area, arc, sectorArea }
// Derived values are plain arithmetic: circumference = 2 * Math.PI * s.r, area = Math.PI * s.r * s.r,
// arc = circumference * s.angle / 360, sectorArea = area * s.angle / 360.
// Always visible: the circle with its radius line (and the sector when angle < 360). Radius, angle,
// circumference and area are written in a column to the right; each is replaced by "?" with
// show({ area: false }), show({ circumference: false }) …
// With pxPerUnit 30 keep r ≤ 7. Leaves 240 px free to the right of x + 250 for the written values.
// Example state: { r: 5 }
function (stage, kit) {
  const circle = kit.circleFigure(stage, { x: 330, y: 280, pxPerUnit: 30, unit: "cm" });
  return {
    update(s, d, info) {
      circle.update({ r: s.r });
      circle.show({ area: info.solved || !info.hidden.has("area") });
    },
  };
}
