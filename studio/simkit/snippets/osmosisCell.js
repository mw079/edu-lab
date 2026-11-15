// kit.osmosisCell(stage, { x, y (centre of the dish), w, h, inside (mol/L in the cell), outside (mol/L in the
//   solution), showValues, showArrows })
// → { update({ inside, outside }), show({ arrows, values }), showValues(bool), values() }
// Physics for derived values: simkit.physics.osmosis(inside, outside)
//   → { water: "in" | "out" | "none", solution: "hypotonic" | "isotonic" | "hypertonic" (the solution compared
//     with the cell), size (final cell volume ÷ starting volume = inside / outside, between 0.4 and 2) }
// Always visible: the solute dots inside and outside (denser = more concentrated) and the cell swelling or
// shrinking. The blue water arrows are hidden with show({ arrows: false }), the two written concentrations
// with show({ values: false }). The words hypotonic / hypertonic are never written.
// Concentrations 0.05–0.9 mol/L. Leaves 40 px free above and below the dish for the labels.
// Example state: { inside: 0.3, outside: 0.6 }
function (stage, kit) {
  const dish = kit.osmosisCell(stage, { x: 500, y: 270, w: 520, h: 340 });
  return {
    update(s, d, info) {
      dish.update({ inside: s.inside, outside: s.outside });
      dish.show({ arrows: info.solved || !info.hidden.has("water") });
    },
  };
}
