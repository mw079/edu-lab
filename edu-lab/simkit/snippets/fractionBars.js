// kit.fractionBars(stage, { x, y, w, barHeight, gap, bars: [{ id, n, d, color, label }] (1–3), showValues })
// → { update({ bars: { [id]: { n, d } } }), show({ [id]: bool }), showValues(bool), values() }
// Each bar is the same whole cut into d equal parts (1–20) with n of them shaded.
// Derived values are plain arithmetic, e.g. value = s.n / s.d; a sum of a/b + c/d has numerator a*d + c*b
// and denominator b*d.
// Always visible: the bars themselves (parts can be counted). The written fraction beside a bar is replaced
// by "?" with show({ [id]: false }). Leaves 120 px free to the left of x for labels and 80 px to the right
// of x + w for the fractions. Three bars need y ≤ 110.
// Direct interaction: with click: { a: app.link("n1") } the student clicks the parts of bar "a" to shade them (the
// slider follows). Link each bar to the key of its numerator slider.
// Example state: { n1: 1, d1: 2, n2: 2, d2: 4 }
function (stage, kit, app) {
  const bars = kit.fractionBars(stage, { x: 170, y: 140, w: 640,
    bars: [{ id: "a", label: "A", color: kit.colors.blue }, { id: "b", label: "B", color: kit.colors.red }],
    click: { a: app.link("n1"), b: app.link("n2") } });
  return {
    update(s, d, info) {
      bars.update({ bars: { a: { n: s.n1, d: s.d1 }, b: { n: s.n2, d: s.d2 } } });
      bars.show({ b: info.solved || !info.hidden.has("valueB") });
    },
  };
}
