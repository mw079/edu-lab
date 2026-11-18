// kit.titration(stage, { x, y (top of the burette), cAcid (mol/L), vAcid (mL), cBase (mol/L), vBase (mL added), showValues })
// → { update({ cAcid, vAcid, cBase, vBase }), show({ pH }), showValues(bool), values() }   values() → { pH, equivalence }
// Physics for derived values: simkit.physics.titration(cAcid, vAcid, cBase, vBase) → { pH, equivalence (mL of base) }
//   Strong acid with strong base: equivalence = cAcid·vAcid / cBase; pH 7 there, rising steeply around it.
// Always visible: how much base has been added (burette scale and "added: … mL") and the flask's colour:
// colourless below pH 8.2, pink above (phenolphthalein). The written pH is hidden with show({ pH: false }).
// The concentrations are not written on the picture. vBase 0–50 mL; use a slider step of 0.5 or 1.
// Occupies x−260 … x+190, y … y+480; pair with kit.plot at the right for the pH curve.
// Example state: { vBase: 10, cAcid: 0.1 }
function (stage, kit) {
  // Burette and flask on the left, pH curve on the right.
  const setup = kit.titration(stage, { x: 300, y: 40, vAcid: 25, cBase: 0.1 });
  const graph = kit.plot(stage, { x: 560, y: 110, w: 380, h: 300, title: "pH", xLabel: "base added (mL)", yLabel: "pH",
    xRange: [0, 50], yRange: [0, 14], series: [{ id: "curve", color: kit.colors.purple }] });
  return {
    update(s, d, info) {
      setup.update({ vBase: s.vBase, cAcid: s.cAcid });
      setup.show({ pH: info.solved || !info.hidden.has("pH") });
      // The curve is drawn up to the amount added so far.
      const points = [];
      for (let v = 0; v <= s.vBase + 1e-9; v += 0.5) points.push([v, kit.physics.titration(s.cAcid, 25, 0.1, v).pH]);
      graph.set("curve", info.solved || !info.hidden.has("pH") ? points : []);
    },
  };
}
