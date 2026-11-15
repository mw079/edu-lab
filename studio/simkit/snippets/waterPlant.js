// kit.waterPlant(stage, { x, y, w, h (the tank), light (0–100 % lamp brightness), co2 (0–0.2 % CO₂),
//   temp (°C), showValues })
// → { update({ light, co2, temp }), showValues(bool), values() }   values() → { rate, limiting }
// Physics for derived values: simkit.physics.photosynthesis(light, co2, temp) → { rate (bubbles per minute), limiting }
//   rate = min(0.4 × light, 400 × co2) × temperature factor (1 at 30 °C, 0 at 10 °C and 50 °C);
//   limiting is "light", "co2" or "temperature"
// Always visible: the lamp's brightness and the stream of oxygen bubbles (faster = higher rate). The three
// settings are labelled unless showValues(false). The rate as a number is never shown on the picture.
// Leaves 130 px free to the left of x for the lamp and 150 px to the right for the labels.
// Example state: { light: 60, co2: 0.04, temp: 25 }
function (stage, kit) {
  // Tank on the left, rate–light graph on the right.
  const plant = kit.waterPlant(stage, { x: 190, y: 120, w: 260, h: 340 });
  const graph = kit.plot(stage, { x: 620, y: 120, w: 340, h: 300, title: "Rate", xLabel: "light (%)", yLabel: "bubbles/min",
    xRange: [0, 100], yRange: [0, 40], series: [{ id: "curve", color: kit.colors.green }, { id: "now", color: kit.colors.red }] });
  return {
    update(s, d, info) {
      plant.update({ light: s.light, co2: s.co2, temp: s.temp });
      const rate = (light) => kit.physics.photosynthesis(light, s.co2, s.temp).rate;
      const show = info.solved || !info.hidden.has("rate");
      graph.set("curve", show ? [0, 20, 40, 60, 80, 100].map((l) => [l, rate(l)]) : []);
      graph.set("now", show ? [[s.light, 0], [s.light, rate(s.light)]] : []);
    },
  };
}
