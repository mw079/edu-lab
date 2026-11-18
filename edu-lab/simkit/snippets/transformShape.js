// kit.transformShape(stage, { x, y (top left), kind (0 translation, 1 reflection, 2 rotation, 3 enlargement),
//   dx, dy (translation), mirror (reflection in 0 the x-axis, 1 the y-axis, 2 the line y = x),
//   turn (rotation: 90, 180 or 270 degrees anticlockwise about the origin), scale (enlargement about the origin, −2…3),
//   shape ([[x, y], …] vertices A, B, C…, default [[1,1],[3,1],[1,3]]), showImage })
// → { update({ kind, dx, dy, mirror, turn, scale, shape }), show({ image }), values() }
// Physics for derived values: simkit.physics.transform(shape, kind, a, b) → image vertices [[x, y], …]
//   a, b = dx, dy (translation), a = mirror (reflection), a = turn (rotation), a = scale (enlargement).
//   Rules: reflect in the x-axis (x, y) → (x, −y); in the y-axis → (−x, y); in y = x → (y, x);
//   rotate 90° → (−y, x); 180° → (−x, −y); 270° → (y, −x); enlarge by k → (kx, ky).
//   Example: A (1, 1) translated by (3, 2) → A′ (4, 3). Coordinates of A′ for checks: simkit.physics.transform([[1,1]], …)[0].
// Use sliders: kind 0–3 (step 1), dx and dy −6…6 (step 1), mirror 0–2 (step 1), turn 90–270 (step 90), scale −2…3 (step 0.5).
// Always visible: the grid, the shape (blue), its corners' coordinates and the transformation's description.
// The image (red) and its coordinates are hidden ("(?, ?)") with show({ image: false }).
// Occupies x … x+920, y … y+460: use it alone on the stage.
// Direct interaction: with drag: { dx: app.link("dx"), dy: app.link("dy") } the student drags the image (translation).
// Example state: { kind: 0, dx: 3, dy: 2, mirror: 0, turn: 90, scale: 2 }
function (stage, kit, app) {
  const grid = kit.transformShape(stage, { x: 40, y: 40, drag: { dx: app.link("dx"), dy: app.link("dy") } });
  return {
    update(s, d, info) {
      grid.update({ kind: s.kind, dx: s.dx, dy: s.dy, mirror: s.mirror, turn: s.turn, scale: s.scale });
      grid.show({ image: info.solved || !info.hidden.has("imageA") });
    },
  };
}
