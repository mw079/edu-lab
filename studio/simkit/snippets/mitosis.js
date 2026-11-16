// kit.mitosis(stage, { x, y (centre), stage (0–5), pairs (pairs of chromosomes, 1–4), showName, showCount })
// → { update({ stage, pairs }), show({ name, count }), values() }
// Stages: 0 interphase (DNA is copied), 1 prophase (chromosomes become visible as X shapes), 2 metaphase (they
// line up in the middle), 3 anaphase (the copies are pulled apart), 4 telophase (two nuclei form),
// 5 cytokinesis (two cells).
// Physics for derived values: simkit.physics.mitosis(stage, pairs) → { name, cells, chromosomes, perCell }
//   chromosomes in the picture: 2 × pairs up to metaphase, 4 × pairs once the copies separate;
//   perCell = chromosomes ÷ cells, so each new cell again has 2 × pairs.
// Use sliders: stage 0–5 (step 1) and pairs 1–4 (step 1).
// Always visible: the drawing of the cell at that stage (the chromosomes can be counted). The name of the stage
// becomes "?" with show({ name: false }); the chromosome count is hidden with show({ count: false }).
// Direct interaction: with click: { stage: app.link("stage") } the student clicks the cell to move to the next stage.
// Example state: { stage: 2, pairs: 2 }
function (stage, kit, app) {
  const cell = kit.mitosis(stage, { x: 500, y: 240, click: { stage: app.link("stage") } });
  return {
    update(s, d, info) {
      cell.update({ stage: s.stage, pairs: s.pairs });
      cell.show({ count: info.solved || info.hidden.size === 0 });
    },
  };
}
