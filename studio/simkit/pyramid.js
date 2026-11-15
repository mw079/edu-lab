/* simkit.energyPyramid: feeding levels of a food chain as a pyramid with the energy at each level. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=230, y=90 (top-left of the pyramid's box), w=440, h=340, levels=["grass", "grasshoppers", "frogs",
   *         "snakes"] (2–5 names, producers first), base=10000 (energy in the producers), efficiency=10 (% passed
   *         on to the next level), unit="kJ", showValues=true }
   * Returns { update({ base, efficiency }), hideEnergy(level or 0), showValues(bool), values() }
   * values() -> [energy at level 1, level 2, …]   (see simkit.physics.trophic)
   */
  kit.energyPyramid = function (stage, opts) {
    const o = Object.assign({ x: 230, y: 90, w: 440, h: 340, levels: ["grass", "grasshoppers", "frogs", "snakes"], base: 10000, efficiency: 10, unit: "kJ", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-pyramid" });
    const names = o.levels.slice(0, 5);
    const n = names.length;
    const colors = [kit.colors.green, kit.colors.yellow, kit.colors.orange, kit.colors.red, kit.colors.purple];
    let hidden = 0;
    const sol = () => names.map((_, i) => kit.physics.trophic(o.base, o.efficiency, i + 1));
    const fmtE = (E) => (E >= 100 ? kit.fmt(E, 0) : E >= 1 ? kit.fmt(E, 1) : kit.fmt(E, 2));

    function draw() {
      g.textContent = "";
      const v = sol();
      const rowH = o.h / n;
      const cx = o.x + o.w / 2;
      names.forEach((name, i) => {
        const yb = o.y + o.h - i * rowH;
        const yt = yb - rowH + 4;
        const wb = o.w * (1 - i / n);
        const wt = o.w * (1 - (i + 1) / n) + (i === n - 1 ? 60 : 0);
        kit.el("polygon", { points: `${cx - wb / 2},${yb} ${cx + wb / 2},${yb} ${cx + wt / 2},${yt} ${cx - wt / 2},${yt}`, fill: colors[i], "fill-opacity": 0.8, stroke: kit.colors.ink, "stroke-width": 2 }, g);
        kit.el("text", { x: o.x - 16, y: (yb + yt) / 2 + 5, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: name }, g);
        const show = o.showValues && hidden !== i + 1;
        kit.el("text", { x: o.x + o.w + 16, y: (yb + yt) / 2 + 5, class: "simkit-label", fill: kit.colors.ink, text: show ? `${fmtE(v[i])} ${o.unit}` : `? ${o.unit}` }, g);
      });
    }

    draw();

    return {
      update(next) {
        if (next.base != null) o.base = next.base;
        if (next.efficiency != null) o.efficiency = next.efficiency;
        draw();
      },
      /** hideEnergy(3) writes "?" for level 3 (1 = producers); hideEnergy(0) shows every level again. */
      hideEnergy(level) {
        hidden = level || 0;
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values: sol,
    };
  };
})();
