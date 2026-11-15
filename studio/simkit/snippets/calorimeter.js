// kit.calorimeter(stage, { x, y (top-left of the cup), w, h, mWater (g), tWater (°C), mBlock (g),
//   cBlock (J/(g·°C)), tBlock (°C), metal, showValues })
// → { update({ mWater, tWater, mBlock, cBlock, tBlock, metal }), show({ thermometer }), showValues(bool),
//     drop() → Promise, reset(), stop(), values() }   values() → { final (°C), heat (J) }
// Physics for derived values: simkit.physics.mixTemp(mWater, 4.18, tWater, mBlock, cBlock, tBlock) → { final, heat }
//   final = (m1·c1·T1 + m2·c2·T2) / (m1·c1 + m2·c2). Specific heats: water 4.18, aluminium 0.90, iron 0.45,
//   copper 0.39, lead 0.13.
// Always visible: the masses, the block's starting temperature (all unless showValues(false)) and the
// thermometer in the water. It reads tWater before drop() and the final temperature after it, so the student
// can read the answer by playing; with show({ thermometer: false }) it keeps showing tWater and reads "? °C"
// after the drop: use that in a step that asks them to calculate the final temperature.
// Temperatures 0–100 °C. Leaves 190 px free above y, 170 px to the left of x and 180 px to the right of x + w.
// Example state: { mWater: 200, tWater: 20, mBlock: 100, tBlock: 100 }   actions: [{ id: "drop", label: "Drop the block" }]
function (stage, kit) {
  const cup = kit.calorimeter(stage, { x: 340, y: 210, w: 260, h: 250, metal: "copper", cBlock: 0.39 });
  return {
    update(s, d, info) {
      cup.update({ mWater: s.mWater, tWater: s.tWater, mBlock: s.mBlock, tBlock: s.tBlock });
      cup.show({ thermometer: info.solved || !info.hidden.has("final") });
    },
    reset() { cup.reset(); },
    stop() { cup.stop(); },
    drop() { return cup.drop(); },
  };
}
