// kit.vectorSum(stage, { x, y (the origin), unit (px per grid unit), range, ax, ay, bx, by, labelA, labelB,
//   showSum, showValues })
// → { update({ ax, ay, bx, by }), show({ sum, values }), values() }
// Physics for derived values: simkit.physics.vectorSum(ax, ay, bx, by) → { x, y, magnitude, angle (deg), magA, magB }
//   sum = (ax + bx, ay + by), length = Math.hypot(x, y)
// Always visible: both arrows on a numbered grid and their components (A = (4, 1)). The resultant arrow and the
// dashed copy of B are removed with show({ sum: false }); its numbers are hidden with show({ values: false }).
// Use whole-number sliders from −6 to 6 for ax, ay, bx, by. Leave 300 px free to the right of the grid for the legend.
// Direct interaction: with drag: { ax, ay, bx, by } (one app.link per slider that exists) the student drags the
// tips of A and B on the grid.
// Example state: { ax: 4, ay: 1, bx: 1, by: 3 }
function (stage, kit, app) {
  const vectors = kit.vectorSum(stage, {
    x: 330, y: 280,
    drag: { ax: app.link("ax"), ay: app.link("ay"), bx: app.link("bx"), by: app.link("by") },
  });
  return {
    update(s, d, info) {
      vectors.update({ ax: s.ax, ay: s.ay, bx: s.bx, by: s.by });
      vectors.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
