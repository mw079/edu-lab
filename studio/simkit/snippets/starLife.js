// kit.starLife(stage, { x, y (centre of the row), mass (in Suns, 0.5–30), stage (0–4), showNames, showValues })
// → { update({ mass, stage }), show({ names, values }), values() }
// Stages: 0 nebula, 1 main sequence, 2 red giant (red supergiant from 8 Suns), 3 planetary nebula (supernova from
// 8 Suns), 4 what is left: white dwarf (below 8 Suns), neutron star (8 to 20), black hole (20 or more).
// Physics for derived values: simkit.physics.star(mass, stage)
//   → { lifetime (billion years on the main sequence = 10 × mass^−2.5), temperature (K), massive (true/false),
//       fate, stages (the five names), name (of this stage) }
//   Heavier stars are hotter and bluer and live much shorter: 1 Sun 10 billion years, 2 Suns 1.8, 10 Suns 0.03.
// Use sliders: mass with a few steps (for example 1–25, step 1) and stage 0–4 (step 1).
// Always visible: the five pictures in order with the current one highlighted, and the star's mass. The names of
// stages after the current one become "?" with show({ names: false }) (use it when a step asks how the star
// ends); the lifetime becomes "?" with show({ values: false }).
// Occupies x ± 450, y−140 … y+160.
// Direct interaction: with click: { stage: app.link("stage") } the student clicks a picture to go to that stage.
// Example state: { mass: 1, stage: 1 }
function (stage, kit, app) {
  const star = kit.starLife(stage, { x: 500, y: 250, click: { stage: app.link("stage") } });
  return {
    update(s, d, info) {
      star.update({ mass: s.mass, stage: s.stage });
      star.show({ values: info.solved || info.hidden.size === 0 });
    },
  };
}
