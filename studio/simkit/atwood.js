/* simkit.atwood: two masses on a string over a pulley. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=90 (pulley centre), pxPerM=110, m1=3 (kg, left), m2=2 (kg, right), showValues=true }
   * Both masses start 1.5 m below the pulley. Returns { update({ m1, m2 }), show({ m1, m2 }), showValues(bool),
   *   play() -> Promise (the heavier mass falls 1 m, in real time), stop(), reset(), values() }
   * values() -> { a, tension, heavier }   (see simkit.physics.atwood)
   */
  kit.atwood = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 90, pxPerM: 110, m1: 3, m2: 2, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-atwood" });
    const shown = { m1: o.showValues, m2: o.showValues };
    const R = 46;
    kit.el("rect", { x: o.x - 90, y: o.y - R - 34, width: 180, height: 14, rx: 4, fill: "#cfd5cf" }, g);
    kit.el("line", { x1: o.x, y1: o.y - R - 20, x2: o.x, y2: o.y, stroke: kit.colors.steel, "stroke-width": 6 }, g);
    // Height ruler at the right: metres below the pulley.
    const rx = o.x + 190;
    kit.el("line", { x1: rx, y1: o.y, x2: rx, y2: o.y + 3 * o.pxPerM, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    for (let i = 0; i <= 6; i++) {
      const y = o.y + (i / 2) * o.pxPerM;
      kit.el("line", { x1: rx, y1: y, x2: rx + (i % 2 ? 6 : 12), y2: y, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      if (i % 2 === 0) kit.el("text", { x: rx + 18, y: y + 4, class: "simkit-tick", text: `${i / 2} m` }, g);
    }
    const dynamic = kit.el("g", null, g);
    kit.el("circle", { cx: o.x, cy: o.y, r: R, fill: "#e9edf0", stroke: kit.colors.steel, "stroke-width": 6 }, g);
    kit.el("circle", { cx: o.x, cy: o.y, r: 6, fill: kit.colors.ink }, g);
    let anim = null;
    let drop = 0; // metres the left mass has moved down (negative = up)

    const sol = () => kit.physics.atwood(o.m1, o.m2);

    function draw() {
      dynamic.textContent = "";
      [[o.m1, -1, kit.colors.red, shown.m1, drop], [o.m2, 1, kit.colors.blue, shown.m2, -drop]].forEach(([m, side, color, visible, d]) => {
        const size = 36 + 9 * Math.sqrt(kit.clamp(m, 0.1, 20));
        const x = o.x + side * R;
        const top = o.y + (1.5 + d) * o.pxPerM - size / 2;
        kit.el("line", { x1: x, y1: o.y, x2: x, y2: top, stroke: kit.colors.ink, "stroke-width": 3 }, dynamic);
        kit.el("rect", { x: x - size / 2, y: top, width: size, height: size, rx: 6, fill: color }, dynamic);
        kit.el("text", { x: x + side * (size / 2 + 12), y: top + size / 2 + 5, "text-anchor": side < 0 ? "end" : "start", class: "simkit-label", fill: color, text: visible ? `${kit.fmt(m, m % 1 ? 1 : 0)} kg` : "? kg" }, dynamic);
      });
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
    }

    draw();

    return {
      update(next) {
        stop();
        if (next.m1 != null) o.m1 = next.m1;
        if (next.m2 != null) o.m2 = next.m2;
        drop = 0;
        draw();
      },
      /** show({ m2: false }) writes "? kg" on the right mass. */
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
      stop,
      reset() {
        stop();
        drop = 0;
        draw();
      },
      play() {
        stop();
        drop = 0;
        const v = sol();
        if (v.a < 1e-6) {
          draw();
          return Promise.resolve(true);
        }
        const dir = v.heavier === "m1" ? 1 : -1;
        anim = stage.animate(Math.sqrt(2 / v.a), (_p, t) => {
          drop = dir * Math.min(1, 0.5 * v.a * t * t);
          draw();
        });
        return anim.then((done) => {
          if (done) drop = dir;
          draw();
          return done;
        });
      },
    };
  };
})();
