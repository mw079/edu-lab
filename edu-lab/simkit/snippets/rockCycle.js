// kit.rockCycle(stage, { x, y (top left), rock (0 magma, 1 igneous rock, 2 sediment, 3 sedimentary rock,
//   4 metamorphic rock), showNames })
// → { update({ rock }), show({ names, processes }), values() }
// Data for derived values: simkit.physics.rockCycle(rock) → { rock, name, next: [{ process, to, name }], names }
//   Processes: magma —cooling→ igneous; any rock —weathering and erosion→ sediment; sediment —compaction and
//   cementation→ sedimentary; igneous or sedimentary —heat and pressure→ metamorphic; any rock —melting→ magma.
// Use a slider for rock: 0–4 (step 1). A check like s.rock === 4 asks the student to make that rock.
// Always visible: the five stages and the current rock (highlighted, with a sample and a description).
// The processes that can act on the rock (arrows with names) are visible unless show({ processes: false }); hide them
// in a step that asks which or how many processes act on a rock. With show({ names: false }) the other stages show
// "?" (to ask what a process makes).
// Occupies x … x+930, y … y+470: use it alone on the stage.
// Direct interaction: with click: { rock: app.link("rock") } the student clicks a process to apply it.
// Example state: { rock: 1 }
function (stage, kit, app) {
  const cycle = kit.rockCycle(stage, { x: 40, y: 30, click: { rock: app.link("rock") } });
  return {
    update(s, d, info) {
      cycle.update({ rock: s.rock });
      cycle.show({ names: info.solved || !info.hidden.has("name"), processes: info.solved || !info.hidden.has("processCount") });
    },
  };
}
