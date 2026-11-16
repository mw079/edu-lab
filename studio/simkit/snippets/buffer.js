// kit.buffer(stage, { x, y (top-left of the first beaker), acid, base (mmol of weak acid HA and its salt A⁻ in
//   100 mL), added (mmol of strong acid, 0–20), pKa (4.76 = acetic acid), showValues, showGraph })
// → { update({ acid, base, added }), show({ values, graph }), values() }
// Physics for derived values: simkit.physics.buffer(acid, base, added, pKa)
//   → { pH, acidNow, baseNow (mmol after the strong acid reacted with A⁻), waterPH (the same acid in plain
//       water), capacity (= base: the mmol of strong acid it can take), exhausted (true/false) }
//   pH = pKa + log10(A⁻ ÷ HA) while A⁻ is left. Examples with acid 10, base 10: added 0 → 4.76; added 5 → 4.28
//   (water: 1.30); added 10 → the buffer is used up and the pH drops to about 2.7.
// Use sliders: acid and base 2–18 (step 2), added 0–20 (step 1).
// Always visible: both beakers, the particles of HA and A⁻ in the buffer (counted in the two lines below), the
// amount added and the graph of pH against acid added (buffer and water). The two pH numbers become "pH ?" with
// show({ values: false }); the graph is removed with show({ graph: false }) (it gives the pH away).
// Occupies x … x+880, y−60 … y+330.
// Direct interaction: with drag: { added: app.link("added") } the student drags the point along the graph.
// Example state: { acid: 10, base: 10, added: 2 }
function (stage, kit, app) {
  const mix = kit.buffer(stage, { x: 70, y: 120, drag: { added: app.link("added") } });
  return {
    update(s, d, info) {
      mix.update({ acid: s.acid, base: s.base, added: s.added });
      mix.show({ values: info.solved || info.hidden.size === 0, graph: info.solved || info.hidden.size === 0 });
    },
  };
}
