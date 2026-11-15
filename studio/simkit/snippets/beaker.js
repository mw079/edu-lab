// kit.beaker(stage, { x, y, w, h, volume (mL), vMax (mL when full), moles (solute), cMax (mol/L at full
//   colour), color, pH (optional), label, showValues })
// → { update({ volume, moles, pH, label }), showValues(bool), concentration() }   mol/L
// Physics for derived values: simkit.physics.molarity(moles, volumeML) → mol/L   (dilution: c1·V1 = c2·V2)
// Always visible: the liquid level against the mL marks, and how strongly coloured / crowded the solution is.
// The volume and concentration numbers under the beaker are hidden with showValues(false).
// With pH set, the liquid takes the universal-indicator colour for that pH instead (red acid, green neutral,
// purple base). Use two beakers side by side (w 220) to compare solutions.
// Example state: { V: 250, n: 0.1 }
function (stage, kit) {
  const beaker = kit.beaker(stage, { x: 360, y: 110, w: 280, h: 340, vMax: 500, label: "Salt solution" });
  return {
    update(s, d, info) {
      beaker.update({ volume: s.V, moles: s.n });
      beaker.showValues(info.solved || info.hidden.size === 0);
    },
  };
}
