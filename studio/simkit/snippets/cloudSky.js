// kit.cloudSky(stage, { x, y, w, h, cloud (% cloud cover), day (1 = midday, 0 = night), showValues })
// → { update({ cloud, day }), show({ temperature }), showValues(bool), values() }   values() → { temperature }
// Physics for derived values: simkit.physics.cloudTemperature(cloud, day) → °C near the ground
//   midday: 30 − 0.10 × cloud (clouds block sunlight) · night: 8 + 0.08 × cloud (clouds hold the ground's heat in)
// Use a slider for cloud (0–100) and a slider day (0 or 1, step 1) or a fixed day per step.
// Always visible: the clouds, sun or moon, and the arrows (sunlight down by day, heat up at night; clouds stop
// some). The thermometer is emptied and reads "? °C" with show({ temperature: false }).
// Leaves 150 px free to the right of x + w for the thermometer and 40 px below y + h for the caption.
// Example state: { cloud: 60, day: 1 }
function (stage, kit) {
  const sky = kit.cloudSky(stage, { x: 140, y: 70, w: 560, h: 360 });
  return {
    update(s, d, info) {
      sky.update({ cloud: s.cloud, day: s.day });
      sky.show({ temperature: info.solved || !info.hidden.has("temperature") });
    },
  };
}
