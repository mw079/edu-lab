/* simkit.lever: a beam on a pivot with one load on each side; it tips toward the larger turning effect. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=360 (top of the pivot), pxPerM=150, m1=4 (kg, left), d1=1 (m from the pivot), m2=2 (right),
   *         d2=2, showValues=true (masses on the loads),
   *         drag: { d1: app.link("key"), d2: app.link("key") } (the student can slide a load along the beam) }
   * Distances up to 2 m fit on the beam. Returns { update({ m1, d1, m2, d2 }), show({ m1, m2 }), showValues(bool), values() }
   * values() -> { torque1, torque2, net, balanced }   (see simkit.physics.lever)
   */
  kit.lever = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 360, pxPerM: 150, m1: 4, d1: 1, m2: 2, d2: 2, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-lever" });
    const shown = { m1: o.showValues, m2: o.showValues };
    const reach = 2.2 * o.pxPerM;
    kit.el("line", { x1: o.x - reach - 40, y1: o.y + 90, x2: o.x + reach + 40, y2: o.y + 90, stroke: kit.colors.ink, "stroke-width": 3 }, g);
    kit.el("polygon", { points: `${o.x},${o.y} ${o.x - 44},${o.y + 90} ${o.x + 44},${o.y + 90}`, fill: kit.colors.steel }, g);
    const beam = kit.el("g", null, g);
    let tilt = 0; // degrees, positive = left side down

    const sol = () => kit.physics.lever(o.m1, o.d1, o.m2, o.d2);
    const target = () => kit.clamp(sol().net * 0.6, -13, 13);

    const turn = () => kit.set(beam, { transform: `rotate(${(-tilt).toFixed(2)} ${o.x} ${o.y})` });

    function draw() {
      beam.textContent = "";
      turn();
      kit.el("rect", { x: o.x - reach, y: o.y - 14, width: 2 * reach, height: 14, rx: 4, fill: "#d9b382", stroke: "#a9824f", "stroke-width": 2 }, beam);
      // Ruler on the beam: a mark every half metre, numbered every metre.
      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        const x = o.x + (i / 2) * o.pxPerM;
        kit.el("line", { x1: x, y1: o.y - 14, x2: x, y2: o.y - (i % 2 ? 8 : 2), stroke: "#7a5a2e", "stroke-width": 2 }, beam);
        if (i % 2 === 0) kit.el("text", { x, y: o.y + 18, "text-anchor": "middle", class: "simkit-tick", text: `${Math.abs(i / 2)} m` }, beam);
      }
      [[o.m1, -o.d1, kit.colors.red, shown.m1, "d1"], [o.m2, o.d2, kit.colors.blue, shown.m2, "d2"]].forEach(([m, d, color, visible, key]) => {
        if (!(m > 0)) return;
        const size = 34 + 9 * Math.sqrt(kit.clamp(m, 0.1, 20));
        const cx = o.x + kit.clamp(d, -2, 2) * o.pxPerM;
        const link = o.drag && o.drag[key];
        if (kit.linked(link)) kit.grip(beam, cx, o.y - 14 - size / 2, size / 2 + 12);
        const box = kit.el("rect", { x: cx - size / 2, y: o.y - 14 - size, width: size, height: size, rx: 6, fill: color }, beam);
        // Dragging a load slides it along the beam (its distance from the pivot).
        kit.drag(stage, box, link, (p) => link(Math.abs(p.x - o.x) / o.pxPerM));
        kit.el("text", { x: cx, y: o.y - 14 - size - 10, "text-anchor": "middle", class: "simkit-label", fill: color, text: visible ? `${kit.fmt(m, m % 1 ? 1 : 0)} kg` : "? kg" }, beam);
      });
    }

    stage.onFrame((dt) => {
      const t = target();
      if (Math.abs(t - tilt) < 0.01) return;
      tilt += (t - tilt) * Math.min(1, dt * 6);
      turn(); // only the tilt changes per frame; rebuilding the loads would pull them from under a dragging finger
    });
    tilt = target();
    draw();

    return {
      update(next) {
        for (const key of ["m1", "d1", "m2", "d2"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** Show or hide a single mass, e.g. show({ m2: false }) when a step asks for the unknown mass. */
      show(which) {
        if (which.m1 != null) shown.m1 = which.m1;
        if (which.m2 != null) shown.m2 = which.m2;
        draw();
      },
      showValues(visible) {
        shown.m1 = shown.m2 = visible;
        draw();
      },
      values: sol,
    };
  };
})();
