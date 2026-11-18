// kit.binaryBits(stage, { x, y (centre of the row), bits (1–8), value, showValue, showPlaces,
//   click: { bits: [app.link("b3"), …] } or { value: app.link("value") } })
// → { update({ value }) or update({ bits: [0 or 1, …] highest place first }), show({ value, places }), values() }
// Physics for derived values: simkit.physics.bits(value, count) → [0, 1, 0, 1] (highest place first)
//   With one 0/1 slider per bit, the number is plain arithmetic: value = 8 * s.b3 + 4 * s.b2 + 2 * s.b1 + s.b0.
// Use one slider per bit (min 0, max 1, step 1) so students switch bits on and off, or one slider for the value.
// Always visible: the bits (lit when 1). The place values above them are hidden with show({ places: false })
// and the decimal number under them is replaced by "= ?" with show({ value: false }).
// Direct interaction: with click: { bits: [app.link("b3"), app.link("b2"), …] } (highest place first) the
// student can click a bit to flip it; with one slider for the whole number use click: { value: app.link("value") }.
// Occupies x ± 370 (8 bits), y−80 … y+110.
// Example state: { b3: 0, b2: 1, b1: 0, b0: 1 }
function (stage, kit, app) {
  const row = kit.binaryBits(stage, { x: 500, y: 250, bits: 4,
    click: { bits: [app.link("b3"), app.link("b2"), app.link("b1"), app.link("b0")] } });
  return {
    update(s, d, info) {
      row.update({ bits: [s.b3, s.b2, s.b1, s.b0] });
      row.show({ value: info.solved || !info.hidden.has("value") });
    },
  };
}
