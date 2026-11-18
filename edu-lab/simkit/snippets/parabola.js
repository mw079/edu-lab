// kit.parabola(stage, { x, y (top-left of the grid), size, range, a, b, c, showVertex, showRoots, showEquation })
// → { update({ a, b, c }), show({ vertex, roots, equation }), values() }   draws y = ax² + bx + c
// Physics for derived values: simkit.physics.quadratic(a, b, c)
//   → { vertex: { x, y }, roots: [] | [x] | [x1, x2] (smaller first), discriminant (= b² − 4ac) }
//   e.g. in the model: vertexX = -s.b / (2 * s.a), rootCount = simkit.physics.quadratic(s.a, s.b, s.c).roots.length
// Always visible: the curve on the numbered grid. The equation, the vertex and the x-axis crossings are marked
// and written to the right of the grid; each is hidden with show({ vertex: false }), show({ roots: false }),
// show({ equation: false }). Leave 270 px free to the right of the grid. a must not be 0; keep |a| ≤ 3.
// Example state: { a: 1, b: -2, c: -3 }
function (stage, kit) {
  const curve = kit.parabola(stage, { x: 230, y: 50, size: 440, range: 10 });
  return {
    update(s, d, info) {
      curve.update({ a: s.a, b: s.b, c: s.c });
      curve.show({ roots: info.solved || !info.hidden.has("root2") });
    },
  };
}
