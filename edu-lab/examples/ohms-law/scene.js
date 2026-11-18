function (stage, kit) {
  const circuit = kit.circuit(stage, {
    layout: "series", V: 6, x: 40, y: 110, w: 470, h: 340,
    parts: [
      { id: "R1", type: "resistor", R: 2, label: "R1" },
      { id: "R2", type: "resistor", R: 2, label: "R2" },
    ],
  });
  const graph = kit.plot(stage, {
    x: 560, y: 90, w: 400, h: 380, title: "Ohm's law", xLabel: "V (volts)", yLabel: "I (amps)",
    xRange: [0, 12], yRange: [0, 6],
    series: [{ id: "line", color: kit.colors.blue, label: "I = V / R" },
             { id: "now", color: kit.colors.orange, label: "now" }],
  });
  return {
    update(s, d, info) {
      circuit.update({ V: s.V, parts: { R1: { R: s.R1 }, R2: { R: s.R2 } } });
      circuit.showValues(info.solved || !(info.hidden.has("V1") || info.hidden.has("V2")));
      const pts = [];
      for (let v = 0; v <= 12; v += 0.5) pts.push([v, v / d.totalR]);
      graph.set("line", pts);
      graph.set("now", [[s.V, d.current]]);
    },
    reset(s) {
      circuit.update({ V: s.V, parts: { R1: { R: s.R1 }, R2: { R: s.R2 } } });
      graph.set("now", [[s.V, s.V / (s.R1 + s.R2)]]);
    },
  };
}
