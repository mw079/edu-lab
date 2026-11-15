// kit.scatterPlot(stage, { x, y (top-left of the plot area), w, h, xRange, yRange, xLabel, yLabel,
//   points: [[x, y], …] (fixed data), extra: { x, y } (one movable red point), showLine, showR,
//   drag: { x: app.link("px"), y: app.link("py") } })
// → { update({ extra: { x, y }, points }), show({ line, r }), values() }   values() → { slope, intercept, r }
// Physics for derived values: simkit.physics.correlation([[x, y], …]) → { slope, intercept, r (−1 to 1) }
//   e.g. in the model: r = simkit.physics.correlation([...DATA, [s.px, s.py]]).r   (the same DATA as in the scene)
// Keep the data fixed in the scene and let the student move the one extra point with two sliders, to see how
// a single point (an outlier) changes the line and r. Always visible: all the points on numbered axes.
// The line of best fit is removed with show({ line: false }); r is replaced by "?" with show({ r: false }).
// Direct interaction: with drag: { x: app.link("px"), y: app.link("py") } the student can drag the red point
// (both sliders follow).
// Leaves 60 px free to the left of x, 50 px below y + h and 200 px to the right of x + w.
// Example state: { px: 9, py: 2 }
function (stage, kit, app) {
  const data = [[1, 2], [2, 2.8], [3, 4.1], [4, 4.7], [5, 6.2], [6, 6.8], [7, 8.1]];
  const plot = kit.scatterPlot(stage, { x: 190, y: 60, w: 520, h: 360, xRange: [0, 10], yRange: [0, 10],
    xLabel: "hours of practice", yLabel: "score", points: data,
    drag: { x: app.link("px"), y: app.link("py") } });
  return {
    update(s, d, info) {
      plot.update({ extra: { x: s.px, y: s.py } });
      plot.show({ r: info.solved || !info.hidden.has("r") });
    },
  };
}
