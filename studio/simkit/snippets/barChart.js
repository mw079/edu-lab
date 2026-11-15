// kit.barChart(stage, { x, y (top-left of the plot area), w, h, bars: [{ id, label, value, color }] (2–6), max,
//   yLabel, showValues })
// → { update({ bars: { [id]: { value } } }), show({ [id]: bool }), showValues(bool), values() }
// values() → { [id]: value, total, largest (id) }
// Derived values are plain arithmetic on the state, e.g. total = s.a + s.b + s.c, mean = total / 3.
// Always visible: the bars against the numbered axis and their labels. The number above each bar is hidden
// with showValues(false) (the student reads the axis); show({ [id]: false }) replaces one bar by an empty
// outline with "?" (for a step that asks what that bar should be). Set max so the axis does not rescale.
// Leaves 60 px free to the left of x for the axis numbers and 40 px below y + h for the labels.
// Example state: { cats: 8, dogs: 12, fish: 4 }
function (stage, kit) {
  const chart = kit.barChart(stage, { x: 190, y: 80, w: 620, h: 330, max: 20, yLabel: "number of pets",
    bars: [{ id: "cats", label: "cats" }, { id: "dogs", label: "dogs" }, { id: "fish", label: "fish" }] });
  return {
    update(s, d, info) {
      chart.update({ bars: { cats: { value: s.cats }, dogs: { value: s.dogs }, fish: { value: s.fish } } });
      chart.showValues(info.solved || !info.hidden.has("total"));
    },
  };
}
