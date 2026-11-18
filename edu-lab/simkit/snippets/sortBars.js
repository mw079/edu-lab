// kit.sortBars(stage, { x, y, w, h, values: [3–10 numbers], steps (comparisons made so far), showValues })
// → { update({ steps, values }), showValues(bool), values() }
// Physics for derived values: simkit.physics.bubbleSort(values, steps)
//   → { array, comparisons, swaps, done (true/false), next: [i, j] or null, total (comparisons the whole sort needs) }
//   e.g. in the model: done = simkit.physics.bubbleSort([5, 2, 8, 1, 9, 3], s.steps).done ? 1 : 0
// Use one slider "steps" (0 to the total, step 1) so the student walks through the sort; keep the list of
// numbers fixed in the scene (the same list in the model). Bubble sort compares neighbours and swaps them when
// the left one is larger. Always visible: the bars with their numbers and the pair compared next (orange).
// The counters under the bars are hidden with showValues(false). Leaves 90 px free below y + h.
// Example state: { steps: 4 }
function (stage, kit) {
  const list = [5, 2, 8, 1, 9, 3];
  const bars = kit.sortBars(stage, { x: 170, y: 80, w: 660, h: 300, values: list });
  return {
    update(s, d, info) {
      bars.update({ steps: s.steps });
      bars.showValues(info.solved || !info.hidden.has("swaps"));
    },
  };
}
