// kit.dnaStrand(stage, { x, y (centre), template: "ATGCCA" (2–8 letters), bases: [0, …], rna, showMatches })
// → { update({ template, bases: [ … ] }), show({ matches }), values() }
// The new strand is one state key per base, each a number: 0 = empty, 1 = A, 2 = T (written U when rna: true),
// 3 = G, 4 = C. Give each a slider from 0 to 4 with step 1. A pairs with T (U in RNA), G pairs with C.
// Physics for derived values: simkit.physics.basePairs(template, [s.b1, s.b2, …])
//   → { matches: [true/false, …], correct (how many pairs are right), complete (true/false), bonds }
//   Hydrogen bonds: A–T has 2, G–C has 3.
// Always visible: the template strand and whatever the new strand holds. Bonds for right pairs, crosses for
// wrong ones and the count are removed with show({ matches: false }).
// Direct interaction: with click: { bases: [app.link("b1"), app.link("b2"), …] } the student clicks a base of the
// new strand to change it (empty → A → T → G → C → empty).
// Example state: { b1: 2, b2: 1, b3: 0, b4: 0, b5: 0, b6: 0 }
function (stage, kit, app) {
  const keys = ["b1", "b2", "b3", "b4", "b5", "b6"];
  const dna = kit.dnaStrand(stage, { x: 540, y: 240, template: "ATGCCA", click: { bases: keys.map((k) => app.link(k)) } });
  return {
    update(s, d, info) {
      dna.update({ bases: keys.map((k) => s[k]) });
    },
  };
}
