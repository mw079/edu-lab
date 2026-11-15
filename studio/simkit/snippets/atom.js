// kit.atom(stage, { x, y (centre), protons, neutrons, electrons, showName, showCounts })
// → { update({ protons, neutrons, electrons }), showName(bool), showCounts(bool), values() }
// Physics for derived values: simkit.physics.element(protons, electrons) → { symbol, name, shells: [2, 8, …] }
//   mass number = protons + neutrons;  charge = protons − electrons   (elements 1–20 only)
// Always visible: the electrons on their shells. The proton and neutron counts in the nucleus are hidden with
// showCounts(false); the element symbol, name, mass number and charge at the right with showName(false).
// Hide whichever the step asks for. Needs about 210 px around the centre and 250 px to the right for the name.
// Example state: { p: 6, n: 6, e: 6 }
function (stage, kit) {
  const atom = kit.atom(stage, { x: 380, y: 280 });
  return {
    update(s, d, info) {
      atom.update({ protons: s.p, neutrons: s.n, electrons: s.e });
      atom.showName(info.solved || info.hidden.size === 0);
    },
  };
}
