// kit.tippingPoint(stage, { x, y, w, h (the picture), heating (0–10), startIce (1 = starts with ice, 0 = without),
//   showValues, showGraph })
// → { update({ heating, startIce }), show({ values, graph }), values() }
// Physics for derived values: simkit.physics.tipping(heating, startIce) → { ice (% cover), state, temperature (°C) }
//   Ice reflects sunlight and so keeps itself cold (a reinforcing feedback loop).
//   Starting with ice: ice = 100 − 6 × heating while heating ≤ 7; above 7 it collapses to 0 (the tipping point).
//   Starting without ice: it stays 0 until heating falls below 3, so undoing the heating does not undo the change.
//   temperature = −5 + 2 × heating + 0.1 × (100 − ice)
// Use a slider heating 0–10 (step 1) and startIce as a slider 0–1 (step 1) or fixed per step in "setup".
// Always visible: the ice sheet, sunlight arriving and being reflected from the ice, and the graph of ice cover
// against heating with both paths and the current point. The numbers become "?" with show({ values: false });
// the graph is removed with show({ graph: false }) (use it when a step asks what will happen).
// Leaves 470 px free to the right of x + w for the graph and 60 px below y + h.
// Direct interaction: with drag: { heating: app.link("heating") } the student drags the point along the graph.
// Example state: { heating: 2, startIce: 1 }
function (stage, kit, app) {
  const world = kit.tippingPoint(stage, { x: 80, y: 90, w: 380, h: 300, drag: { heating: app.link("heating") } });
  return {
    update(s, d, info) {
      world.update({ heating: s.heating, startIce: s.startIce });
      world.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
