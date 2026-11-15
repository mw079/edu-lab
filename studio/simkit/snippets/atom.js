// kit.atom(stage, { x, y (centre), protons, neutrons, electrons, showName, showCounts })
// → { update({ protons, neutrons, electrons }), show({ protons, neutrons, name }), values() }
// Physics for derived values: simkit.physics.element(protons, electrons) → { symbol, name, shells: [2, 8, …] }
//   mass number = protons + neutrons;  charge = protons − electrons   (elements 1–20 only)
// Always visible: the electrons on their shells. show({ protons: false }) or show({ neutrons: false }) turns
// that count in the nucleus into "?"; show({ name: false }) hides the element symbol, name, mass number and
// charge at the right. Hide everything the step's answer could be read from: e.g. when a step asks for the
// neutrons, hide the neutrons AND the name (it contains the mass number). Needs about 210 px around the centre and 250 px to the right for the name.
// Example state: { p: 6, n: 6, e: 6 }
function (stage, kit) {
  const atom = kit.atom(stage, { x: 380, y: 280 });
  return {
    update(s, d, info) {
      atom.update({ protons: s.p, neutrons: s.n, electrons: s.e });
      const open = info.solved;
      atom.show({
        protons: open || !info.hidden.has("p"),
        neutrons: open || !(info.hidden.has("n") || info.hidden.has("massNumber")),
        name: open || info.hidden.size === 0,
      });
    },
  };
}
