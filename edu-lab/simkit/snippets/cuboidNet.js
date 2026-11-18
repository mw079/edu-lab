// kit.cuboidNet(stage, { x, y (centre of the base), unit (px per length unit), l, w, h (1–5), fold (0 = flat net,
//   100 = closed box), showValues })
// → { update({ l, w, h, fold }), show({ values }), values() }
// Physics for derived values: simkit.physics.cuboid(l, w, h) → { surface, volume, base (l × w), front (l × h), side (w × h) }
//   surface = 2 × (l × w + l × h + w × h), volume = l × w × h
// Use sliders: l, w, h 1–5 (step 1) and fold 0–100 (step 10 or 25).
// Always visible: the six faces (base and lid blue, front and back green, the two sides orange) in a slanted 3-D
// view, flat or partly folded, and the three edge lengths. The area written on each face (only while the net is
// nearly flat) and the totals become hidden with show({ values: false }).
// Occupies about x ± 420, y−330 … y+170 for sizes up to 5 (use unit: 34 if l or h go above 4).
// Direct interaction: with drag: { fold: app.link("fold") } the student lifts the lid to fold the net into a box.
// Example state: { l: 3, w: 2, h: 2, fold: 0 }
function (stage, kit, app) {
  const net = kit.cuboidNet(stage, { x: 480, y: 300, drag: { fold: app.link("fold") } });
  return {
    update(s, d, info) {
      net.update({ l: s.l, w: s.w, h: s.h, fold: s.fold });
      net.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
