// kit.axisTrick(stage, { x, y (top-left of the chart), w, h, a, b (the two values), labelA, labelB, max (top of
//   the axis), start (where the axis begins), unit, showValues })
// → { update({ a, b, start }), show({ values }), values() }
// A bar chart of two values whose axis does not have to start at 0: the same numbers can look very different.
// Physics for derived values: simkit.physics.axisTrick(a, b, start)
//   → { looks (= (b − start) ÷ (a − start): how many times as tall bar B is drawn), real (= b ÷ a),
//       percentMore (= 100 × (b − a) ÷ a), honest (true when start is 0) }
//   Examples with a 82, b 86: start 0 → looks 1.05 ×; start 80 → looks 3 ×; start 78 → looks 2 ×.
// Use a slider start 0–80 (step 2; keep it below the smaller value). a and b can be fixed in "setup".
// Always visible: the chart with its axis numbers and both bar values. The two comparisons beside it become "?"
// with show({ values: false }).
// Occupies x−70 … x+w+420, y−40 … y+h+40.
// Direct interaction: with drag: { start: app.link("start") } the student drags the bottom of the axis up and down.
// Example state: { a: 82, b: 86, start: 0 }
function (stage, kit, app) {
  const chart = kit.axisTrick(stage, { x: 130, y: 80, labelA: "Brand A", labelB: "Brand B", drag: { start: app.link("start") } });
  return {
    update(s, d, info) {
      chart.update({ a: s.a, b: s.b, start: s.start });
      chart.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
