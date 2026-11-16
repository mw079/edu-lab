// kit.pulley(stage, { x, y (middle of the beam), load (N), ropes (strands that hold the load, 1–4),
//   lift (m the load has been raised, 0–2), showValues })
// → { update({ load, ropes, lift }), show({ effort, pull }), values() }
// Physics for derived values: simkit.physics.pulley(load, ropes, lift)
//   → { effort (= load ÷ ropes, N), advantage (= ropes), pull (= lift × ropes, m of rope pulled),
//       work (= load × lift = effort × pull, J) }
//   More ropes: less force, but more rope to pull; the work stays the same.
//   Examples: 120 N on 2 ropes → 60 N; lifting 1 m needs 2 m of rope; work 120 J either way.
// Use sliders: load 60–240 (step 20), ropes 1–4 (step 1), lift 0–2 (step 0.25).
// Always visible: the ropes that hold the load (they can be counted), the load in newtons and how far it was
// lifted. The pull becomes "? N" with show({ effort: false }), the rope pulled "? m" with show({ pull: false }).
// Occupies x−240 … x+620, y … y+480.
// Direct interaction: with drag: { lift: app.link("lift") } the student pulls the free end of the rope down.
// Example state: { load: 120, ropes: 2, lift: 0.5 }
function (stage, kit, app) {
  const tackle = kit.pulley(stage, { x: 330, y: 50, drag: { lift: app.link("lift") } });
  return {
    update(s, d, info) {
      tackle.update({ load: s.load, ropes: s.ropes, lift: s.lift });
      tackle.show({ effort: info.solved || !info.hidden.has("effort") });
    },
  };
}
