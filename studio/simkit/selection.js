/* simkit.naturalSelection: dark and light moths resting on tree bark; the better-hidden colour becomes more common. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=250, y=90, w=500, h=330 (the patch of bark), bark=0.8 (0 = light bark … 1 = dark bark),
   *         startDark=0.1 (fraction of dark moths at the start), generations=0, count=40, showValues=true }
   * Returns { update({ bark, startDark, generations }), showValues(bool), values() }
   * values() -> { dark (fraction 0–1), darkCount, lightCount }   (see simkit.physics.selection)
   */
  kit.naturalSelection = function (stage, opts) {
    const o = Object.assign({ x: 250, y: 90, w: 500, h: 330, bark: 0.8, startDark: 0.1, generations: 0, count: 40, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-selection" });
    const barkRect = kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 10, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    // Bark texture: a few vertical grooves.
    for (let i = 1; i < 9; i++) kit.el("path", { d: `M ${o.x + (i * o.w) / 9} ${o.y + 6} q ${i % 2 ? 10 : -10} ${o.h / 2} 0 ${o.h - 12}`, fill: "none", stroke: "#000", "stroke-opacity": 0.12, "stroke-width": 3 }, g);
    const mothsG = kit.el("g", null, g);
    const label = kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 34, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, g);
    const n = kit.clamp(Math.round(o.count), 4, 60);
    // Evenly scattered resting places; order[i] decides which moths are the dark ones.
    const spots = Array.from({ length: n }, (_, i) => [(0.5 + i * 0.7548776662) % 1, (0.5 + i * 0.569840291) % 1]);
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const sol = () => {
      const dark = kit.physics.selection(o.startDark, o.bark, o.generations);
      const darkCount = Math.round(dark * n);
      return { dark, darkCount, lightCount: n - darkCount };
    };

    function draw() {
      const v = sol();
      const t = kit.clamp(o.bark, 0, 1);
      kit.set(barkRect, { fill: `rgb(${lerp(226, 74, t)}, ${lerp(215, 62, t)}, ${lerp(196, 52, t)})` });
      mothsG.textContent = "";
      spots.forEach(([u, w], i) => {
        const cx = o.x + 30 + u * (o.w - 60);
        const cy = o.y + 26 + w * (o.h - 52);
        const dark = (i * 7) % n < v.darkCount;
        const fill = dark ? "#3d342d" : "#efe6d2";
        const m = kit.el("g", { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${Math.round(u * 80 - 40)})` }, mothsG);
        kit.el("path", { d: "M 0 -4 L -15 -11 L -12 9 Z", fill, stroke: kit.colors.ink, "stroke-width": 1 }, m);
        kit.el("path", { d: "M 0 -4 L 15 -11 L 12 9 Z", fill, stroke: kit.colors.ink, "stroke-width": 1 }, m);
        kit.el("ellipse", { cx: 0, cy: 0, rx: 3, ry: 9, fill: dark ? "#1f1a16" : "#b9ad93" }, m);
      });
      kit.set(label, { text: o.showValues ? `generation ${Math.round(o.generations)}: ${v.darkCount} dark, ${v.lightCount} light` : `generation ${Math.round(o.generations)}` });
    }

    draw();

    return {
      update(next) {
        for (const key of ["bark", "startDark", "generations"]) if (next[key] != null) o[key] = next[key];
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
