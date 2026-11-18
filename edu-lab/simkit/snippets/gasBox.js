// kit.gasBox(stage, { x, y, w, h, n (mol), T (K), V (L), Vmax (L), Pmax (kPa gauge full scale),
//   showGauge, showThermometer, showValues })
// → { update({ n, T, V }), show({ P, V, T }), showValues(bool), pressure() }   pressure in kPa
// Physics for derived values: simkit.physics.gasPressure(n, T, V) → kPa  (n mol, T kelvin, V litres)
// Always visible: the particles and the piston position. A hidden value shows "?" and its instrument stops
// reading (no gauge needle, no mercury). Hide only what the step asks for, e.g. show({ P: !info.hidden.has("P") }).
// Example state: { n: 1, T: 300, V: 20 }
function (stage, kit) {
  const gas = kit.gasBox(stage, { x: 80, y: 110, w: 560, h: 320, Vmax: 40, Pmax: 500 });
  return {
    update(s, d, info) {
      gas.update({ n: s.n, T: s.T, V: s.V });
      gas.show({ P: info.solved || !info.hidden.has("P") }); // hides the number and the gauge needle
    },
  };
}
