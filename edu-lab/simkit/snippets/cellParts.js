// kit.cellParts(stage, { x, y (top left), kind (1 = plant cell, 0 = animal cell), part (highlighted part 0–7, −1 = none),
//   showNames })
// → { update({ kind, part }), show({ names }), values() }
// Parts: 0 nucleus, 1 cell membrane, 2 cytoplasm, 3 mitochondria, 4 ribosomes, 5 cell wall, 6 chloroplasts,
//   7 permanent vacuole (5–7 are only in plant cells).
// Data for derived values: simkit.physics.cellPart(part, kind)
//   → { name, job, plant, animal, present (does this kind of cell have it?), partsInCell (5 animal, 8 plant) }
//   Jobs: nucleus holds the DNA and controls the cell; mitochondria release energy (respiration); ribosomes make
//   proteins; chloroplasts absorb light for photosynthesis; the cell wall supports; the vacuole keeps the cell firm.
// Use select controls with numeric values, labelled with names: kind 0–1 ("Animal cell", "Plant cell"), part 0–7
// (the part names), so students see names, not numbers. A check like d.part === 6 asks the student to find a part.
// Always visible: the cell and its parts, and what the highlighted part does. With show({ names: false }) the list
// says "part 1" … and the line below "This part: …" (to ask which part does a job).
// Occupies x … x+850, y … y+500: use it alone on the stage.
// Direct interaction: with click: { part: app.link("part") } the student clicks a part in the picture or in the list.
// Example state: { kind: 1, part: 3 }
function (stage, kit, app) {
  const cell = kit.cellParts(stage, { x: 40, y: 30, click: { part: app.link("part") } });
  return {
    update(s, d, info) {
      cell.update({ kind: s.kind, part: s.part });
      cell.show({ names: info.solved || !info.hidden.has("name") });
    },
  };
}
