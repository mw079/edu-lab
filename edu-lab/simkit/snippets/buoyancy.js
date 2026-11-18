// kit.buoyancy(stage, { x, y, w, h (the tank), density (kg/m³, block), fluidDensity, volume (L), fluidLabel,
//   showForces, showValues })
// → { update({ density, fluidDensity, volume, fluidLabel }), show({ density, forces }), showValues(bool), values() }
// Physics for derived values: simkit.physics.buoyancy(density, fluidDensity, volumeL)
//   → { weight, buoyant (N), floats (true/false), submerged (fraction under the surface = density / fluidDensity
//     when floating, 1 when sunk) }
// Always visible: how deep the block sits (or that it lies on the bottom). The two densities are written
// unless show({ density: false }); the force arrows and their numbers are hidden with show({ forces: false }).
// The liquid's name is written above the tank (keep y ≥ 50).
// Leaves 230 px free to the left of x for the block's label and 270 px to the right of x + w for the forces.
// Example state: { density: 600, fluidDensity: 1000, volume: 1 }
function (stage, kit) {
  const tank = kit.buoyancy(stage, { x: 300, y: 100, w: 360, h: 360 });
  return {
    update(s, d, info) {
      tank.update({ density: s.density, fluidDensity: s.fluidDensity, volume: s.volume, fluidLabel: s.fluidDensity === 1000 ? "water" : "liquid" });
      tank.show({ forces: info.solved || !info.hidden.has("buoyant") });
    },
  };
}
