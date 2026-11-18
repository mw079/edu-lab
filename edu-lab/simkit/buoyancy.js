/* simkit.buoyancy: a block in a tank of liquid; it floats or sinks depending on the two densities. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=300, y=110, w=400, h=360 (the tank), density=600 (kg/m³, block), fluidDensity=1000, volume=1 (L),
   *         fluidLabel="liquid" (name it, e.g. "water" at 1000), showForces=true (weight and buoyant-force arrows), showValues=true }
   * Returns { update({ density, fluidDensity, volume, fluidLabel }), show({ density, forces }), showValues(bool), values() }
   * values() -> { weight, buoyant (N), floats, submerged (0–1) }   (see simkit.physics.buoyancy)
   */
  kit.buoyancy = function (stage, opts) {
    const o = Object.assign({ x: 300, y: 110, w: 400, h: 360, density: 600, fluidDensity: 1000, volume: 1, fluidLabel: "liquid", showForces: true, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-buoyancy" });
    const shown = { density: o.showValues, forces: o.showForces };
    const surface = o.y + o.h * 0.3;
    const bottom = o.y + o.h - 6;
    const liquid = kit.el("rect", { x: o.x + 3, y: surface, width: o.w - 6, height: bottom - surface + 3 }, g);
    kit.el("path", { d: `M ${o.x} ${o.y} L ${o.x} ${o.y + o.h} L ${o.x + o.w} ${o.y + o.h} L ${o.x + o.w} ${o.y}`, fill: "none", stroke: kit.colors.steel, "stroke-width": 6, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
    const fluidText = kit.el("text", { x: o.x + o.w / 2, y: o.y - 18, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.blueDark }, g);
    const dynamic = kit.el("g", null, g);
    const sol = () => kit.physics.buoyancy(o.density, o.fluidDensity, o.volume);

    function draw() {
      dynamic.textContent = "";
      const v = sol();
      // Denser liquids are drawn darker.
      kit.set(liquid, { fill: kit.colors.blue, "fill-opacity": kit.clamp(0.12 + 0.2 * (o.fluidDensity / 1000), 0.12, 0.6) });
      kit.set(fluidText, { text: shown.density ? `${o.fluidLabel}: ${kit.fmt(o.fluidDensity, 0)} kg/m³` : o.fluidLabel });
      const size = kit.clamp(90 * Math.cbrt(o.volume), 50, 150);
      const cx = o.x + o.w / 2;
      const top = v.floats ? surface - size * (1 - v.submerged) : bottom - size;
      kit.el("rect", { x: cx - size / 2, y: top, width: size, height: size, rx: 6, fill: "#d9a55c", stroke: "#8a6327", "stroke-width": 2 }, dynamic);
      // Block density to the left of the tank, on a line with the block.
      kit.el("text", { x: o.x - 16, y: top + size / 2 + 5, "text-anchor": "end", class: "simkit-label", fill: "#8a6327", text: shown.density ? `block: ${kit.fmt(o.density, 0)} kg/m³` : "block" }, dynamic);
      if (!shown.forces) return;
      const cy = top + size / 2;
      const scale = (F) => kit.clamp(F * 9, 24, 110);
      const fmtN = (F) => `${kit.fmt(F, F < 10 ? 2 : 1)} N`;
      kit.arrowShape(dynamic, cx - 14, cy, cx - 14, cy + scale(v.weight), { color: kit.colors.red, width: 6, head: 14 });
      kit.arrowShape(dynamic, cx + 14, cy, cx + 14, Math.max(o.y + 8, cy - scale(v.buoyant)), { color: kit.colors.green, width: 6, head: 14 });
      // Force labels to the right of the tank, level with the arrow tips' sides.
      kit.el("text", { x: o.x + o.w + 16, y: cy - 16, class: "simkit-label", fill: kit.colors.greenDark, text: `↑ buoyant force ${fmtN(v.buoyant)}` }, dynamic);
      kit.el("text", { x: o.x + o.w + 16, y: cy + 16, class: "simkit-label", fill: kit.colors.redDark, text: `↓ weight ${fmtN(v.weight)}` }, dynamic);
    }

    draw();

    return {
      update(next) {
        for (const key of ["density", "fluidDensity", "volume", "fluidLabel"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ forces: false }) hides the arrows and their numbers; show({ density: false }) hides both densities. */
      show(which) {
        if (which.density != null) shown.density = which.density;
        if (which.forces != null) shown.forces = which.forces;
        draw();
      },
      showValues(visible) {
        shown.density = visible;
        draw();
      },
      values: sol,
    };
  };
})();
