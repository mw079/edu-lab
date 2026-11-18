// kit.foodWeb(stage, { x, y, w, h (the chart), predators (% of their normal number, 0–150),
//   names: ["grass", "rabbits", "foxes"], showValues })
// → { update({ predators }), show({ plants, herbivores }), values() }
// A food chain of three levels; every number is in % of its normal value.
// Physics for derived values: simkit.physics.foodChain(predators) → { predators, herbivores, plants }
//   herbivores = 240 − 1.4 × predators;  plants = 150 − 0.5 × herbivores  (a trophic cascade: fewer predators,
//   more plant eaters, fewer plants). Examples: predators 100 → 100 and 100; predators 0 → 240 and 30;
//   predators 50 → 170 and 65.
// Use a slider predators 0–150 (step 10).
// Always visible: the predators' bar, the names and the "eaten by" arrows. A bar and its number are removed
// with show({ plants: false }) or show({ herbivores: false }) (use it when a step asks for that value).
// Leaves 80 px free to the right of x + w and 90 px below y + h.
// Direct interaction: with drag: { predators: app.link("predators") } the student drags the top of the predators' bar.
// Example state: { predators: 100 }
function (stage, kit, app) {
  const chain = kit.foodWeb(stage, { x: 150, y: 70, w: 640, h: 330, names: ["willows", "elk", "wolves"], drag: { predators: app.link("predators") } });
  return {
    update(s, d, info) {
      chain.update({ predators: s.predators });
      chain.show({ plants: info.solved || !info.hidden.has("plants"), herbivores: info.solved || !info.hidden.has("herbivores") });
    },
  };
}
