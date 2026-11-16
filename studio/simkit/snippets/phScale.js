// kit.phScale(stage, { x, y (left end and middle of the colour bar), w, pH (0–14), dilutions (tenfold dilutions
//   with water), showValue, showExamples })
// → { update({ pH, dilutions }), show({ value, examples }), values() }
// Physics for derived values: simkit.physics.ph(pH, dilutions) → { pH, kind ("acid" | "neutral" | "base"),
//   exponent, timesNeutral }
//   Each step of 1 on the scale is 10 times more or less H+: timesNeutral = 10^(7 − pH).
//   Each tenfold dilution moves the pH one step towards 7 (never past it).
// Use sliders: pH 0–14 (step 1) and, if the lesson dilutes, dilutions 0–5 (step 1).
// Always visible: the numbered colour scale, the household examples above it (stomach acid 1, lemon juice 2,
// vinegar 3, coffee 5, pure water 7, baking soda 9, soap 10, bleach 13) and the drop pointing at the sample's
// place. The written pH and concentration become "?" with show({ value: false }); the household names are
// removed with show({ examples: false }) (use it when a step asks where a substance belongs).
// Occupies x−30 … x+w+30, y−110 … y+180.
// Direct interaction: with drag: { pH: app.link("pH") } the student drags the drop along the scale.
// Example state: { pH: 3, dilutions: 0 }
function (stage, kit, app) {
  const scale = kit.phScale(stage, { x: 110, y: 230, w: 780, drag: { pH: app.link("pH") } });
  return {
    update(s, d, info) {
      scale.update({ pH: s.pH, dilutions: s.dilutions });
      scale.show({ value: info.solved || info.hidden.size === 0 });
    },
  };
}
