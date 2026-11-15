// kit.naturalSelection(stage, { x, y, w, h (the bark), bark (0 light … 1 dark), startDark (fraction of dark moths
//   at the start), generations, count, showValues })
// → { update({ bark, startDark, generations }), showValues(bool), values() }   values() → { dark, darkCount, lightCount }
// Physics for derived values: simkit.physics.selection(startDark, bark, generations) → fraction of dark moths (0–1)
//   Each generation the share of dark moths is multiplied by their survival (0.1 + 0.8·bark) against the light
//   moths' (0.9 − 0.8·bark): on dark bark the dark moths spread, on light bark the light ones, at bark 0.5 nothing changes.
// Always visible: the bark's colour and every moth (they can be counted, though well-hidden moths are hard to
// see, which is the point). The written counts are hidden with showValues(false).
// Use a slider for generations (0–10, step 1). Leaves 45 px free below y + h for the label.
// Example state: { bark: 0.8, generations: 3 }
function (stage, kit) {
  const moths = kit.naturalSelection(stage, { x: 250, y: 80, w: 500, h: 340, startDark: 0.1, count: 40 });
  return {
    update(s, d, info) {
      moths.update({ bark: s.bark, generations: s.generations });
      moths.showValues(info.solved || !info.hidden.has("darkCount"));
    },
  };
}
