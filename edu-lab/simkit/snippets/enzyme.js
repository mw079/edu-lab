// kit.enzyme(stage, { x, y (top left), temp (°C, 0–80), pH (1–13), bestTemp (default 37), bestPH (default 7),
//   axis ("temp": rate against temperature at this pH, or "pH": rate against pH at this temperature), showRate })
// → { update({ temp, pH, bestTemp, bestPH, axis }), show({ rate }), values() }
// Physics for derived values: simkit.physics.enzyme(temp, pH, bestTemp, bestPH)
//   → { rate (% of the best rate), denatured (true at bestTemp + 10 °C or more, or 3 pH units or more from the best),
//       tempFactor, pHFactor }
//   The rate doubles for every 10 °C up to the best temperature, then falls quickly as the enzyme denatures.
//   Examples (best 37 °C, pH 7): 37 °C → 100 %; 27 °C → 50 %; 50 °C → 7 % (denatured); pH 5 at 37 °C → 17 %.
// Use sliders: temp 0–80 (step 1), pH 1–13 (step 1). Pepsin works best near pH 2: put bestPH in the state and pass
// it in every update (the component keeps the last value it was given).
// Show the axis the step is about: update({ axis: "pH" }) for steps that change the pH, "temp" for the others.
// Always visible: the enzyme and the substrate (fitting or not), the temperature and the pH.
// The curve, the point and the rate are hidden with show({ rate: false }).
// Occupies x … x+880, y … y+410: use it alone on the stage.
// Direct interaction: with drag: { temp: app.link("temp"), pH: app.link("pH") } the student drags the marker along the
// axis shown (temperature or pH).
// Example state: { temp: 30, pH: 7, bestPH: 7 }
function (stage, kit, app) {
  const lab = kit.enzyme(stage, { x: 40, y: 40, drag: { temp: app.link("temp"), pH: app.link("pH") } });
  return {
    update(s, d, info) {
      // Here step 5 (info.level 4: levels count from 0) is about pH; the others about temperature.
      lab.update({ temp: s.temp, pH: s.pH, bestPH: s.bestPH, axis: info.level === 4 ? "pH" : "temp" });
      lab.show({ rate: info.solved || !info.hidden.has("rate") });
    },
  };
}
