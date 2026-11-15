// kit.logicGate(stage, { x, y (centre of the gate), type, a, b, showOutput, showTable })
// → { update({ type, a, b }), show({ output, table }), values() }   values() → { out }
// type is "AND", "OR", "XOR", "NAND", "NOR" or "NOT" (NOT uses only input A). Inputs are 0 or 1.
// Physics for derived values: simkit.physics.gate(type, a, b) → 0 or 1
// Use sliders (min 0, max 1, step 1) for the inputs and, if the gate should change, a select control for the type.
// Always visible: the gate's name and the inputs. The output lamp and the truth table's output column show "?"
// with show({ output: false }); the whole table is removed with show({ table: false }).
// Occupies x−290 … x+500, y ± 110: use it alone on the stage.
// Example state: { a: 1, b: 0, type: "AND" }
function (stage, kit) {
  const gate = kit.logicGate(stage, { x: 330, y: 270 });
  return {
    update(s, d, info) {
      gate.update({ type: s.type, a: s.a, b: s.b });
      gate.show({ output: info.solved || !info.hidden.has("out") });
    },
  };
}
