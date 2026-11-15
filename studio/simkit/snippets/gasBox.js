// kit.gasBox(stage, { x, y, w, h, n (mol), T (K), V (L), Vmax (L), Pmax (kPa gauge full scale),
//   showGauge, showThermometer, showValues })
// → { update({ n, T, V }), showValues(bool), pressure() }   pressure in kPa
// Physics for derived values: simkit.physics.gasPressure(n, T, V) → kPa  (n mol, T kelvin, V litres)
// Always visible: the particles, piston position and thermometer level; V, T and P values unless showValues(false).
// Use showValues(false) in a level that asks the student to predict the pressure.
// Example state: { n: 1, T: 300, V: 20 }
function (stage, kit) {
  const gas = kit.gasBox(stage, { x: 80, y: 110, w: 560, h: 320, Vmax: 40, Pmax: 500 });
  return {
    update(s, d, info) {
      gas.update({ n: s.n, T: s.T, V: s.V });
      gas.showValues(info.solved || !info.hidden.has("P"));
    },
  };
}
