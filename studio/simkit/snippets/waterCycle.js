// kit.waterCycle(stage, { x, y, w, h, temperature (°C, 0–40), vapour (g of water vapour per m³ of air), showValues })
// → { update({ temperature, vapour }), show({ values }), values() }
// Physics for derived values: simkit.physics.humidity(vapour, temperature)
//   → { saturation (g/m³ the air can hold = 5 × 2^(T/10)), relative (% humidity = 100 × vapour ÷ saturation),
//       dewPoint (°C), condensing (true when relative ≥ 100: clouds and rain) }
// Use sliders: temperature 0–40 (step 5 or 10) and vapour 2–40 (step 1 or 2).
// Always visible: the sea with evaporation arrows (longer when warmer), the thermometer, the vapour amount, and
// whether the sky is clear, a cloud is forming or it rains. The humidity and the saturation value are hidden
// with show({ values: false }).
// Leaves 150 px free to the right of x + w for the thermometer and 60 px below y + h for the captions.
// Direct interaction: with drag: { temperature: app.link("temperature") } the student drags the top of the
// thermometer's red column.
// Example state: { temperature: 20, vapour: 10 }
function (stage, kit, app) {
  const sky = kit.waterCycle(stage, { x: 110, y: 60, w: 620, h: 380, drag: { temperature: app.link("temperature") } });
  return {
    update(s, d, info) {
      sky.update({ temperature: s.temperature, vapour: s.vapour });
      sky.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
