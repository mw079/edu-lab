// kit.numberLine(stage, { x, y, w, min, max, step, markers: [{ id, value, color, label }] (1–3),
//   distance: [idA, idB], showValues, showDistance, drag: { [markerId]: app.link("key") } })
// → { update({ markers: { [id]: { value } } }), showValues(bool), showDistance(bool), values() }
// Derived values are plain arithmetic, e.g. distance = Math.abs(s.a - s.b), midpoint = (s.a + s.b) / 2.
// Always visible: the ticks with their numbers and where each marker sits. A marker's own number is hidden
// with showValues(false); the distance bracket and its number with showDistance(false). For a step that asks
// for the distance, the design needs a readout "distance" in that step's "hide" (as in the example below).
// Direct interaction: with drag: { a: app.link("a") } the student can drag marker "a" along the line (the slider
// follows). Link each marker to the key of its own slider control.
// Example state: { a: -3, b: 4 }
function (stage, kit, app) {
  const line = kit.numberLine(stage, { x: 100, y: 300, w: 800, min: -10, max: 10,
    markers: [{ id: "a", label: "A", color: kit.colors.red }, { id: "b", label: "B", color: kit.colors.blue }], distance: ["a", "b"],
    drag: { a: app.link("a"), b: app.link("b") } });
  return {
    update(s, d, info) {
      line.update({ markers: { a: { value: s.a }, b: { value: s.b } } });
      line.showDistance(info.solved || !info.hidden.has("distance"));
    },
  };
}
