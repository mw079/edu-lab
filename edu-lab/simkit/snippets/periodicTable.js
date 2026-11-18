// kit.periodicTable(stage, { x, y (top left), z (the selected element, 1–20),
//   trend ("none", "radius", "electronegativity" or "ionization": cells shaded light → dark), showValues })
// → { update({ z, trend }), show({ values }), values() }
// Physics for derived values: simkit.physics.periodic(z)
//   → { z, symbol, name, group, period, valence (outer electrons), shells (e.g. [2, 4]), radius (pm),
//       electronegativity (null for noble gases), ionization (first ionisation energy, kJ/mol), kind }
//   Trends: across a period the radius gets smaller and electronegativity and ionisation energy get larger;
//   down a group the radius gets larger and the other two smaller.
//   Examples: C → group 14, period 2, 4 valence electrons, 76 pm, 2.55, 1086 kJ/mol; Na → 166 pm, 0.93, 496 kJ/mol.
// Use a slider for z: 1–20 (step 1). The trend is fixed per lesson (pass it in the scene), or use a slider 0–3 and map it.
// Always visible: the table (symbols, numbers, groups, periods), the selected element's card, shells, group, period and
// valence electrons. Radius, electronegativity and ionisation energy become "?" with show({ values: false })
// (the shading of a trend stays: it shows the pattern, not the number).
// Occupies x … x+930, y … y+490: use it alone on the stage.
// Direct interaction: with click: { z: app.link("z") } the student clicks an element to select it.
// Example state: { z: 6 }
function (stage, kit, app) {
  const table = kit.periodicTable(stage, { x: 40, y: 30, trend: "none", click: { z: app.link("z") } });
  return {
    update(s, d, info) {
      table.update({ z: s.z });
      table.show({ values: info.solved || !info.hidden.has("radius") });
    },
  };
}
