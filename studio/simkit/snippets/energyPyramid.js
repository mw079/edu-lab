// kit.energyPyramid(stage, { x, y, w, h, levels: [names, producers first] (2–5), base, efficiency (%), unit, showValues })
// → { update({ base, efficiency }), hideEnergy(level or 0), showValues(bool), values() }   values() → [energy per level]
// Physics for derived values: simkit.physics.trophic(base, efficiencyPct, level) → energy at that level
//   (level 1 = producers; each step up keeps efficiency % — about 10 % in nature)
// Always visible: the pyramid with each level's name at the left and its energy at the right.
// hideEnergy(3) writes "?" for level 3 only (use it in a step that asks for that level); hideEnergy(0) shows all.
// Leaves 170 px free to the left of x for the names and 140 px to the right of x + w for the energies.
// Example state: { base: 10000, efficiency: 10 }
function (stage, kit) {
  const pyramid = kit.energyPyramid(stage, { x: 270, y: 90, w: 440, h: 340, levels: ["grass", "grasshoppers", "frogs", "snakes"] });
  return {
    update(s, d, info) {
      pyramid.update({ base: s.base, efficiency: s.efficiency });
      pyramid.hideEnergy(!info.solved && info.hidden.has("level3") ? 3 : 0);
    },
  };
}
