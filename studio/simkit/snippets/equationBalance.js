// kit.equationBalance(stage, { x, y, w, reaction, coefficients: [one per species, left side first], showCounts })
// → { update({ coefficients, reaction }), showCounts(bool), values() }
// Reactions: "water" H₂ + O₂ → H₂O (balanced by 2, 1, 2) · "ammonia" N₂ + H₂ → NH₃ (1, 3, 2) ·
//   "methane" CH₄ + O₂ → CO₂ + H₂O (1, 2, 1, 2) · "rust" Fe + O₂ → Fe₂O₃ (4, 3, 2) · "magnesium" Mg + O₂ → MgO (2, 1, 2)
// Physics for derived values: simkit.physics.balance(reaction, [a, b, c]) → { left: { H: 4, O: 2 }, right: { … }, balanced }
//   e.g. in the model: balanced = simkit.physics.balance("water", [s.a, s.b, s.c]).balanced ? 1 : 0
// Use one slider per coefficient (1 to 6, step 1). Always visible: the equation with its coefficients and one
// drawn molecule per unit. The atom counts under each side (green when equal, red when not) are hidden with
// showCounts(false). Occupies x … x+w, y … y+380: use it alone on the stage.
// Example state: { a: 1, b: 1, c: 1 }
function (stage, kit) {
  const eq = kit.equationBalance(stage, { x: 110, y: 90, w: 780, reaction: "water" });
  return {
    update(s) {
      eq.update({ coefficients: [s.a, s.b, s.c] });
    },
  };
}
