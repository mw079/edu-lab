// kit.greenhouse(stage, { x, y, w, h, co2 (ppm), albedo (fraction of sunlight reflected), showValues })
// → { update({ co2, albedo }), show({ temperature }), showValues(bool), values() }   values() → { temperature }
// Physics for derived values: simkit.physics.greenhouse(co2, albedo) → Earth's average temperature in °C
//   14 °C at 280 ppm and albedo 0.3; +3 °C for each doubling of CO₂; −1 °C for each 0.01 more albedo
//   (280 ppm → 14.0, 420 → 15.8, 560 → 17.0)
// Always visible: the CO₂ level, how many heat rays the atmosphere turns back (more with more CO₂) and how
// many sunlight rays are reflected. The temperature at the right is replaced by "? °C" with show({ temperature: false }).
// CO₂ 150–1200 ppm, albedo 0.1–0.6. Leaves 240 px free to the right of x + w and 40 px below y + h.
// Example state: { co2: 420, albedo: 0.3 }
function (stage, kit) {
  const earth = kit.greenhouse(stage, { x: 90, y: 70, w: 600, h: 370 });
  return {
    update(s, d, info) {
      earth.update({ co2: s.co2, albedo: s.albedo });
      earth.show({ temperature: info.solved || !info.hidden.has("temperature") });
    },
  };
}
