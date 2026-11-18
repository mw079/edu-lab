// kit.heatEngine(stage, { x, y (centre of the engine), hot, cold (kelvin, 100–1000), heat (J taken in), showValues })
// → { update({ hot, cold, heat }), show({ work, waste, efficiency }), values() }
// Physics for derived values: simkit.physics.heatEngine(hot, cold, heat)
//   → { efficiency (= 100 × (1 − cold ÷ hot), %: the best any engine can do), work (= heat × efficiency ÷ 100, J),
//       waste (= heat − work, J) }
//   First law: heat in = work + waste heat. Second law: some heat must always go to the cold side.
//   Examples: 600 K and 300 K → 50 %; 1000 J in → 500 J work, 500 J waste. 900 K and 300 K → 66.7 %.
// Use sliders: hot 300–1000 and cold 100–500 (step 50; keep hot above cold), heat 500–2000 (step 100).
// Always visible: both temperatures, the heat taken in and three arrows whose widths share the heat (so the
// split can be estimated). Single numbers become "?" with show({ work: false }), show({ waste: false }),
// show({ efficiency: false }).
// Occupies x−440 … x+400, y−230 … y+230.
// Direct interaction: with drag: { hot: app.link("hot"), cold: app.link("cold") } the student drags the two
// markers on the thermometer.
// Example state: { hot: 600, cold: 300, heat: 1000 }
function (stage, kit, app) {
  const engine = kit.heatEngine(stage, { x: 560, y: 270, drag: { hot: app.link("hot"), cold: app.link("cold") } });
  return {
    update(s, d, info) {
      engine.update({ hot: s.hot, cold: s.cold, heat: s.heat });
      const open = info.solved || info.hidden.size === 0;
      engine.show({ work: open, waste: open, efficiency: open });
    },
  };
}
