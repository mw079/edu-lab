// kit.landUse(stage, { x, y (top-left of the map), cell, farm, city (squares out of 20; the rest is forest), showValues })
// → { update({ farm, city }), show({ species, carbon }), values() }
// Physics for derived values: simkit.physics.landUse(farm, city)
//   → { forest (= 20 − farm − city), species (= 100 × (forest ÷ 20)^0.25, rounded: 20 → 100, 10 → 84, 5 → 71,
//       1 → 47, 0 → 0), carbon (= 200 × forest + 20 × farm, tonnes), food (= 100 × farm, people fed) }
//   Halving the forest loses far fewer than half the species; the last squares matter most.
// Use sliders: farm 0–20 and city 0–10 (step 1); keep farm + city ≤ 20.
// Always visible: the map of 20 squares and the counts of forest, farms, cities and people fed. The species
// number and bar or the carbon number become "?" with show({ species: false }) / show({ carbon: false }).
// Occupies x … x+800, y … y+340 with cell 84.
// Direct interaction: with click: { farm: app.link("farm"), city: app.link("city") } the student clicks a square
// to change it: forest → farm → city → forest (pass only the links whose sliders exist).
// Example state: { farm: 4, city: 2 }
function (stage, kit, app) {
  const land = kit.landUse(stage, { x: 80, y: 80, click: { farm: app.link("farm"), city: app.link("city") } });
  return {
    update(s, d, info) {
      land.update({ farm: s.farm, city: s.city });
      land.show({ species: info.solved || !info.hidden.has("species") });
    },
  };
}
