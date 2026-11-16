// kit.ratioLine(stage, { x, y (left end of the upper line), w, a, b (the ratio a : b), amount (of the first
//   quantity, 0 … 6 × a), labelA, labelB, showB })
// → { update({ a, b, amount }), show({ b }), values() }
// Physics for derived values: simkit.physics.ratio(a, b, amount) → { y (= amount × b ÷ a), unitRate (b ÷ a), scale }
// Use sliders: a and b 1–9 (step 1), amount from 0 to 6 × the largest a used (step 1 or 0.5).
// Always visible: two number lines, the first quantity above (0, a, 2a, … 6a) and the second below, with a marker
// through both at "amount". show({ b: false }) writes "?" for the matching amount and blanks the lower line
// after its first pair (use it in a step that asks for that amount).
// Set labelA and labelB to the two things compared, in plain words ("cups of flour", "eggs").
// Occupies x−20 … x+w+20, y−60 … y+280.
// Direct interaction: with drag: { amount: app.link("amount") } the student drags the marker along the upper line.
// Example state: { a: 2, b: 3, amount: 4 }
function (stage, kit, app) {
  const lines = kit.ratioLine(stage, { x: 130, y: 170, w: 740, labelA: "cups of flour", labelB: "eggs", drag: { amount: app.link("amount") } });
  return {
    update(s, d, info) {
      lines.update({ a: s.a, b: s.b, amount: s.amount });
      lines.show({ b: info.solved || info.hidden.size === 0 });
    },
  };
}
