// kit.circuit(stage, { x, y, w, h, layout: "series" | "parallel", V (volts),
//   parts: [{ id, type: "resistor" | "bulb", R (ohms), label }] (1–4 parts), showValues })
// → { update({ V, parts: { [id]: { R } } }), showValues(bool), values() }
// Physics for derived values: simkit.physics.circuit(layout, V, [R1, R2, …])
//   → { totalR, current, parts: [{ R, I, V, P }, …] }   (same order as the R list)
// Use showValues(false) in a level that asks the student to calculate a current or voltage.
// Example state: { V: 9, R1: 2, R2: 4 }
function (stage, kit) {
  const circuit = kit.circuit(stage, {
    layout: "series", V: 9, x: 200, y: 110, w: 620, h: 320,
    parts: [{ id: "R1", R: 2, label: "R1" }, { id: "R2", type: "bulb", R: 4, label: "Bulb" }],
  });
  return {
    update(s, d, info) {
      circuit.update({ V: s.V, parts: { R1: { R: s.R1 }, R2: { R: s.R2 } } });
      circuit.showValues(info.solved || !info.hidden.has("I"));
    },
  };
}
