// kit.binarySearch(stage, { x, y (centre of the row), values: [sorted numbers, up to 16], target, steps, showValues })
// → { update({ target, steps, values }), showValues(bool), values() }
// Physics for derived values: simkit.physics.binarySearch(values, target, steps)
//   → { low, high (positions still possible), mid (checked next, null when finished), found (position or null),
//     checks (made so far), needed (checks the whole search takes) }
//   e.g. in the model: needed = simkit.physics.binarySearch(LIST, s.target, 99).needed
// Use a slider "steps" (0–5, step 1) to walk through the search, and optionally one for the target; keep the
// list fixed in the scene (the same list in the model). Positions start at 0. Always visible: the numbers,
// which ones are ruled out (grey), the one checked next (yellow) and the target. The written counts (checks made,
// numbers still possible) are hidden with showValues(false). Occupies x ± 440, y−110 … y+110.
// Example state: { target: 23, steps: 1 }
function (stage, kit) {
  const list = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  const row = kit.binarySearch(stage, { x: 500, y: 260, values: list });
  return {
    update(s, d, info) {
      row.update({ target: s.target, steps: s.steps });
      row.showValues(info.solved || !info.hidden.has("checks"));
    },
  };
}
