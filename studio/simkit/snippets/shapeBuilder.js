// kit.shapeBuilder(stage, { x, y (bottom-left corner of the rectangle), unit (px per unit), w (2–10), h (1–6),
//   t (height of the triangle on top, 0–4), showValues })
// → { update({ w, h, t }), show({ values }), values() }
// A shape made of two simple ones: a rectangle with a triangle on top (a house), on a grid of unit squares.
// Physics for derived values: simkit.physics.composite(w, h, t)
//   → { rectangle (= w × h), triangle (= ½ × w × t), area (their sum), perimeter (= w + 2h + 2 × slant),
//       slant (= √((w ÷ 2)² + t²)) }
//   Examples: (6, 4, 3) → 24 + 9 = 33; (6, 4, 4) → perimeter 6 + 8 + 2 × 5 = 24; t = 0 leaves the rectangle.
// Use sliders: w 2–10, h 1–6, t 0–4 (all step 1).
// Always visible: the shape on the grid (squares can be counted) and the lengths w, h and t. The two part
// areas, the total and the perimeter become "?" with show({ values: false }).
// Occupies x−40 … x+10 × unit+330, y−10 × unit … y+30.
// Direct interaction: with drag: { w: app.link("w"), h: app.link("h"), t: app.link("t") } the student drags the
// rectangle's top-right corner and the triangle's peak (pass only the links whose sliders exist).
// Example state: { w: 6, h: 4, t: 3 }
function (stage, kit, app) {
  const shape = kit.shapeBuilder(stage, { x: 110, y: 470, drag: { w: app.link("w"), h: app.link("h"), t: app.link("t") } });
  return {
    update(s, d, info) {
      shape.update({ w: s.w, h: s.h, t: s.t });
      shape.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
