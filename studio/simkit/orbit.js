/* simkit.orbit: a planet on an elliptical orbit around a star (Kepler's laws). */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=420, y=280 (the star), pxPerAU=110, a=1 (semi-major axis, AU), e=0 (eccentricity 0–0.8),
   *         M=1 (star mass, solar masses), showValues=true (distance and speed next to the planet),
   *         onSample(tYears, rAU, vKmS),
   *         drag: { a: app.link("key") } (the student pulls the planet in or out to resize the orbit) }
   * The closest point of the orbit is to the right of the star.
   * Returns { update({ a, e, M }), showValues(bool), play() -> Promise (one full orbit), stop(), values() }
   * values() -> { period, rPeri, rAp, vPeri, vAp }
   */
  kit.orbit = function (stage, opts) {
    const o = Object.assign({ x: 420, y: 280, pxPerAU: 110, a: 1, e: 0, M: 1, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-orbit" });
    const path = kit.el("ellipse", { fill: "none", stroke: kit.colors.steel, "stroke-width": 2, "stroke-dasharray": "5 6" }, g);
    const radius = kit.el("line", { stroke: kit.colors.muted, "stroke-width": 2 }, g);
    kit.el("circle", { cx: o.x, cy: o.y, r: 22, fill: kit.colors.yellow, stroke: kit.colors.orange, "stroke-width": 3 }, g);
    const starLabel = kit.el("text", { x: o.x, y: o.y + 44, "text-anchor": "middle", class: "simkit-tick" }, g);
    const body = kit.el("g", null, g);
    const handle = kit.el("g", null, body);
    const planet = kit.el("circle", { r: 11, fill: kit.colors.blue, stroke: kit.colors.blueDark, "stroke-width": 2 }, body);
    const resize = o.drag && o.drag.a;
    // At rest the planet is at its closest point, a·(1 − e) to the right of the star.
    const dragger = kit.drag(stage, body, resize, (p) => resize(Math.max(0, p.x - o.x) / o.pxPerAU / (1 - o.e)));
    const label = kit.el("text", { class: "simkit-label", fill: kit.colors.blueDark }, g);
    const axis = kit.el("text", { "text-anchor": "middle", class: "simkit-tick" }, g);
    let anim = null;
    let E = 0; // eccentric anomaly: where the planet is on its orbit

    const sol = () => kit.physics.orbit(o.a, o.e, o.M);

    function draw() {
      const b = o.a * Math.sqrt(1 - o.e * o.e);
      const centreX = o.x - o.a * o.e * o.pxPerAU;
      kit.set(path, { cx: centreX, cy: o.y, rx: o.a * o.pxPerAU, ry: b * o.pxPerAU });
      const px = o.x + o.a * (Math.cos(E) - o.e) * o.pxPerAU;
      const py = o.y - b * Math.sin(E) * o.pxPerAU;
      const r = o.a * (1 - o.e * Math.cos(E));
      const v = 29.78 * Math.sqrt(o.M * (2 / r - 1 / o.a));
      kit.set(planet, { cx: px, cy: py });
      const ring = kit.linked(resize) && !anim;
      handle.textContent = "";
      if (ring) kit.grip(handle, px, py, 24);
      dragger.refresh();
      kit.set(radius, { x1: o.x, y1: o.y, x2: px, y2: py });
      // The label sits outside the orbit, on the side away from the star.
      const out = Math.hypot(px - o.x, py - o.y) || 1;
      const ux = (px - o.x) / out;
      const uy = (py - o.y) / out;
      kit.set(label, {
        x: px + ux * (ring ? 34 : 22),
        y: py + uy * (ring ? 38 : 26) + 5,
        "text-anchor": ux > 0.3 ? "start" : ux < -0.3 ? "end" : "middle",
        text: o.showValues ? `${kit.fmt(r, 2)} AU · ${kit.fmt(v, 1)} km/s` : "",
      });
      kit.set(starLabel, { text: `star: ${kit.fmt(o.M, o.M % 1 ? 1 : 0)} × Sun` });
      kit.set(axis, { x: centreX, y: o.y + b * o.pxPerAU + 30, text: `a = ${kit.fmt(o.a, 2)} AU` });
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
      E = 0;
    }

    draw();

    return {
      update(next) {
        stop();
        Object.assign(o, Object.fromEntries(Object.entries(next).filter(([, v]) => v != null)));
        o.e = kit.clamp(o.e, 0, 0.8);
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values: sol,
      stop() {
        stop();
        draw();
      },
      /** One full orbit; fast near the star and slow far away, as Kepler's second law requires. */
      play() {
        stop();
        const T = sol().period;
        const seconds = kit.clamp(3 + T, 4, 9);
        anim = stage.animate(seconds, (p) => {
          const mean = 2 * Math.PI * p;
          E = mean;
          for (let i = 0; i < 6; i++) E -= (E - o.e * Math.sin(E) - mean) / (1 - o.e * Math.cos(E)); // Kepler's equation
          if (o.onSample) {
            const r = o.a * (1 - o.e * Math.cos(E));
            o.onSample(p * T, r, 29.78 * Math.sqrt(o.M * (2 / r - 1 / o.a)));
          }
          draw();
        });
        return anim.then((done) => {
          E = 0;
          draw();
          return done;
        });
      },
    };
  };
})();
