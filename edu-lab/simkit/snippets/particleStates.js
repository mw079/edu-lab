// kit.particleStates(stage, { x, y, w, h (the container), T (°C), melt, boil, substance, showValues })
// → { update({ T, melt, boil, substance }), show({ state, T }), showValues(bool), values() }
// Physics for derived values: simkit.physics.stateOf(T, melt, boil) → "solid" | "liquid" | "gas"
//   Melting / boiling points in °C: water 0 / 100, ethanol −114 / 78, iron 1538 / 2862, oxygen −219 / −183.
// Always visible: how the particles are arranged and move (regular and vibrating = solid, close and sliding =
// liquid, far apart and flying = gas). The label under the container gives the substance, the temperature and
// the state; show({ state: false }) leaves out the word, show({ T: false }) the temperature.
// Leaves 45 px free below y + h for the label.
// Example state: { T: 20 }
function (stage, kit) {
  const box = kit.particleStates(stage, { x: 330, y: 100, w: 340, h: 320, substance: "water", melt: 0, boil: 100 });
  return {
    update(s, d, info) {
      box.update({ T: s.T });
      box.show({ state: info.solved || !info.hidden.has("state") });
    },
  };
}
