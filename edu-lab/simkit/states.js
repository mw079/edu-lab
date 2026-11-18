/* simkit.particleStates: particles of a substance as a solid, a liquid or a gas, depending on the temperature. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=330, y=110, w=340, h=320 (the container), T=20 (°C), melt=0, boil=100, substance="water",
   *         showValues=true (temperature and state written under the container) }
   * Solid: particles vibrate in a regular pattern. Liquid: close together, sliding past each other.
   * Gas: far apart, flying through the whole container. Hotter means faster.
   * Returns { update({ T, melt, boil, substance }), show({ state, T }), showValues(bool), values() }
   * values() -> { state: "solid" | "liquid" | "gas" }
   */
  kit.particleStates = function (stage, opts) {
    const o = Object.assign({ x: 330, y: 110, w: 340, h: 320, T: 20, melt: 0, boil: 100, substance: "water", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-states" });
    const shown = { state: o.showValues, T: o.showValues };
    kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 14, fill: "#fff", stroke: kit.colors.steel, "stroke-width": 6 }, g);
    const dotsG = kit.el("g", null, g);
    const label = kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 34, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, g);
    const R = 11;
    const cols = 7;
    const rowsN = 5;
    const gap = 2 * R + 3;
    const left = o.w / 2 - ((cols - 1) * gap) / 2;
    const particles = [];
    for (let r = 0; r < rowsN; r++)
      for (let c = 0; c < cols; c++) {
        const a = (r * cols + c) * 2.399963;
        particles.push({ hx: left + c * gap, hy: o.h - R - 8 - r * gap, x: 0, y: 0, dx: Math.cos(a), dy: Math.sin(a), ph: a, el: kit.el("circle", { r: R, fill: kit.colors.blue, stroke: "#fff", "stroke-width": 1.5 }, dotsG) });
      }
    const state = () => kit.physics.stateOf(o.T, o.melt, o.boil);
    let last = null;
    let time = 0;

    function enter(s) {
      last = s;
      // A gas starts from where the particles are and spreads out; other states return to the pile.
      if (s !== "gas") particles.forEach((p) => ((p.x = p.hx), (p.y = p.hy)));
    }

    function labels() {
      const s = state();
      const parts = [o.substance];
      if (shown.T) parts.push(`at ${kit.fmt(o.T, 0)} °C`);
      kit.set(label, { text: parts.join(" ") + (shown.state ? `: ${s}` : "") });
    }

    stage.onFrame((dt) => {
      time += dt;
      const s = state();
      if (s !== last) enter(s);
      const heat = kit.clamp((o.T + 273) / 300, 0.2, 3);
      for (const p of particles) {
        if (s === "solid") {
          const amp = 1.2 * heat;
          p.x = p.hx + amp * Math.sin(time * 14 + p.ph);
          p.y = p.hy + amp * Math.cos(time * 17 + p.ph * 2);
        } else if (s === "liquid") {
          // Rows slide sideways past each other and the pile wobbles: close together but not in fixed places.
          const row = Math.round((o.h - R - 8 - p.hy) / gap);
          p.x = p.hx + (row % 2 ? 1 : -1) * 16 * Math.sin(time * 0.9 * heat + row) + 3 * Math.sin(time * 5 + p.ph);
          p.y = p.hy + 3 * Math.cos(time * 4 * heat + p.ph * 3);
        } else {
          const speed = 120 * Math.sqrt(heat);
          p.x += p.dx * speed * dt;
          p.y += p.dy * speed * dt;
          const m = R + 5;
          if (p.x < m) (p.x = m), (p.dx = Math.abs(p.dx));
          if (p.x > o.w - m) (p.x = o.w - m), (p.dx = -Math.abs(p.dx));
          if (p.y < m) (p.y = m), (p.dy = Math.abs(p.dy));
          if (p.y > o.h - m) (p.y = o.h - m), (p.dy = -Math.abs(p.dy));
        }
        kit.set(p.el, { cx: (o.x + p.x).toFixed(1), cy: (o.y + p.y).toFixed(1) });
      }
    });

    enter(state());
    particles.forEach((p) => kit.set(p.el, { cx: o.x + p.x, cy: o.y + p.y }));
    labels();

    return {
      update(next) {
        for (const key of ["T", "melt", "boil", "substance"]) if (next[key] != null) o[key] = next[key];
        labels();
      },
      /** show({ state: false }) leaves out the word solid / liquid / gas; show({ T: false }) the temperature. */
      show(which) {
        if (which.state != null) shown.state = which.state;
        if (which.T != null) shown.T = which.T;
        labels();
      },
      showValues(visible) {
        shown.state = shown.T = visible;
        labels();
      },
      values: () => ({ state: state() }),
    };
  };
})();
