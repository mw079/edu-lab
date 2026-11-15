// kit.punnett(stage, { x, y (top-left of the grid), size, parent1, parent2, letter, dominantColor,
//   recessiveColor, showOffspring })
// → { update({ parent1, parent2 }), showOffspring(bool), values() }
// A parent is its number of dominant alleles (2 = AA, 1 = Aa, 0 = aa), so a slider from 0 to 2 with step 1
// works; the genotype as text ("Aa") is accepted too.
// Physics for derived values: simkit.physics.punnett(parent1, parent2)
//   → { AA, Aa, aa (how many of the 4 boxes), dominant (fraction with the dominant trait, e.g. 0.75), cells }
// Always visible: both parents' genotypes and their alleles along the top and side. The four offspring boxes
// (genotype and flower colour) are hidden with showOffspring(false): use it in a step that asks for a count
// or a probability. Leaves 200 px free to the left of x and 90 px above y for the parent labels.
// Example state: { p1: 1, p2: 1 }
function (stage, kit) {
  const square = kit.punnett(stage, { x: 380, y: 140, size: 320, letter: "P" });
  return {
    update(s, d, info) {
      square.update({ parent1: s.p1, parent2: s.p2 });
      square.showOffspring(info.solved || !info.hidden.has("dominant"));
    },
  };
}
