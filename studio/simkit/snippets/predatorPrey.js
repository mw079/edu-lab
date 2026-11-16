// kit.predatorPrey(stage, { x, y, w, h (the graph), prey0, pred0 (animals at the start), birth (prey births per
//   animal per year, 0.2–1), hunt (how well predators catch prey, 0.01–0.05), years (time shown, 0–20),
//   preyName, predName, showValues })
// → { update({ prey0, pred0, birth, hunt, years }), show({ values }), values() }
// Physics for derived values: simkit.physics.predatorPrey(prey0, pred0, birth, hunt, years)
//   → { prey, predators (after that many years), preyEq (= 2 ÷ hunt), predEq (= birth ÷ hunt) }
//   The two populations rise and fall in turn around the balance point (preyEq, predEq): more prey feeds more
//   predators, which then eat the prey down, after which the predators starve. Starting exactly at the balance
//   point, nothing changes.
// Use sliders: prey0 20–200 (step 10), pred0 5–50 (step 5), birth 0.2–1 (step 0.1), hunt 0.01–0.05 (step 0.01),
// years 0–20 (step 1).
// Always visible: both curves up to "years" (later years are not drawn, so they cannot be read ahead) and the
// time marker. The two numbers beside the graph become "?" with show({ values: false }).
// Leaves 220 px free to the right of x + w for the legend and 60 px below y + h.
// Direct interaction: with drag: { years: app.link("years") } the student drags the time marker along the graph.
// Example state: { prey0: 60, pred0: 10, birth: 0.5, hunt: 0.02, years: 8 }
function (stage, kit, app) {
  const graph = kit.predatorPrey(stage, { x: 110, y: 60, w: 620, h: 340, drag: { years: app.link("years") } });
  return {
    update(s, d, info) {
      graph.update({ prey0: s.prey0, pred0: s.pred0, birth: s.birth, hunt: s.hunt, years: s.years });
      graph.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
