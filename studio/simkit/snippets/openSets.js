// kit.openSets(stage, { x, y (centre), sets: [0, …] (six values), showCheck })
// → { update({ sets: [ … ] }), show({ check }), values() }
// A topology on the three points a, b, c: the student chooses which subsets are called "open". One state key per
// subset, each 0 or 1, in this order: {a}, {b}, {c}, {a, b}, {a, c}, {b, c}. The empty set and {a, b, c} are
// always open. Give each a slider from 0 to 1 with step 1.
// Physics for derived values: simkit.physics.topology([s.s1, s.s2, s.s3, s.s4, s.s5, s.s6])
//   → { count (open sets, including ∅ and the whole set), isTopology (true/false), missing (the first union or
//       intersection of two open sets that is not open, or null), open (their names) }
//   A topology needs: every union of open sets is open, and every intersection of two open sets is open.
//   Examples: only {a} chosen → a topology with 3 open sets; {a} and {b} without {a, b} → not one;
//   {a, b} and {b, c} without {b} → not one; all six chosen → the discrete topology with 8 open sets.
// Always visible: the eight cards with their points (open ones are filled; the number of open sets is never
// written, it can be counted). The verdict and the missing set are removed with show({ check: false }): use it
// when a step asks whether the family is a topology, e.g. show({ check: info.solved || info.hidden.size === 0 }).
// Occupies x−410 … x+410, y−170 … y+210.
// Direct interaction: with click: { sets: [app.link("s1"), …] } the student clicks a card to choose or drop it.
// Example state: { s1: 1, s2: 1, s3: 0, s4: 0, s5: 0, s6: 0 }
function (stage, kit, app) {
  const keys = ["s1", "s2", "s3", "s4", "s5", "s6"];
  const space = kit.openSets(stage, { x: 500, y: 230, click: { sets: keys.map((k) => app.link(k)) } });
  return {
    update(s, d, info) {
      space.update({ sets: keys.map((k) => s[k]) });
      space.show({ check: info.solved || info.hidden.size === 0 });
    },
  };
}
