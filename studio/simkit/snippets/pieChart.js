// kit.pieChart(stage, { x, y (centre), r, slices: [{ id, label, value, color }] (2–6), showValues })
// → { update({ slices: { [id]: { value } } }), show({ percent }), showValues(bool), values() }
// values() → { total, percent: { [id]: 0–100 } }
// Derived values are plain arithmetic, e.g. percentCats = 100 * s.cats / (s.cats + s.dogs + s.fish).
// Always visible: the slices and the legend with each label. The legend also gives each value and its percent;
// show({ percent: false }) leaves the percent out (for a step that asks for it), showValues(false) leaves out
// both. Leaves 300 px free to the right of x + r for the legend.
// Example state: { cats: 8, dogs: 12, fish: 4 }
function (stage, kit) {
  const pie = kit.pieChart(stage, { x: 320, y: 270, r: 170,
    slices: [{ id: "cats", label: "cats" }, { id: "dogs", label: "dogs" }, { id: "fish", label: "fish" }] });
  return {
    update(s, d, info) {
      pie.update({ slices: { cats: { value: s.cats }, dogs: { value: s.dogs }, fish: { value: s.fish } } });
      pie.show({ percent: info.solved || !info.hidden.has("percentDogs") });
    },
  };
}
