// kit.codonChain(stage, { x, y (centre), mrna: "AUGGCUUGGUAA" (2–5 codons of three letters), picks: [0, …],
//   showMatches, showTable })
// → { update({ mrna, picks: [ … ] }), show({ matches, table }), values() }
// The student's protein is one state key per codon, each a number: 0 = empty, k = the k-th amino acid in the
// numbered list under the picture (alphabetical: the right ones plus Gly and Ser).
// For "AUGGCUUGGUAA" the list is 1 Ala, 2 Gly, 3 Met, 4 Ser, 5 Stop, 6 Trp and the right picks are 3, 1, 6, 5.
// Give each key a slider from 0 to the length of that list (step 1).
// Physics for derived values: simkit.physics.translate(mrna, [s.a1, s.a2, …])
//   → { codons, protein, choices, answer (the right number per codon), matches, correct, complete }
//   simkit.physics.codon("AUG") → "Met"
// Always visible: the mRNA split into codons and the beads chosen so far. Ticks, crosses and the count are
// removed with show({ matches: false }); the codon chart with show({ table: false }).
// Occupies x ± 470, y−130 … y+260.
// Direct interaction: with click: { picks: [app.link("a1"), app.link("a2"), …] } the student clicks a bead to
// step through the amino acids.
// Example state: { a1: 3, a2: 0, a3: 0, a4: 0 }
function (stage, kit, app) {
  const keys = ["a1", "a2", "a3", "a4"];
  const chain = kit.codonChain(stage, { x: 520, y: 200, mrna: "AUGGCUUGGUAA", click: { picks: keys.map((k) => app.link(k)) } });
  return {
    update(s, d, info) {
      chain.update({ picks: keys.map((k) => s[k]) });
    },
  };
}
