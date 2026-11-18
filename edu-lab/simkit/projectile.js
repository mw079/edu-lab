/* simkit.projectile: a ball launched over level ground, with launch arrow, flight path and landing mark. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=80, y=470 (ground level at the launch point), w=840 (ground length in px), xMax=50 (m shown),
   *         v0=20 (m/s), angle=45 (deg), h0=0 (m), g=9.8, showPath=false (dashed predicted path),
   *         drag: { angle: app.link("key"), v0: app.link("key") } (either or both: the student drags the
   *         launch arrow's tip to aim it and, with v0, to make it longer or shorter) }
   * Same scale on both axes. Returns { update({ v0, angle, h0, g }), showPath(bool),
   *   launch() -> Promise (animated flight; leaves a trail and marks the landing distance), reset(), stop(), values() }
   * values() -> { range, time, maxHeight, vx, vy }
   */
  kit.projectile = function (stage, opts) {
    const o = Object.assign({ x: 80, y: 470, w: 840, xMax: 50, v0: 20, angle: 45, h0: 0, g: 9.8, showPath: false }, opts);
    const g = stage.layer({ class: "simkit-projectile" });
    const px = o.w / o.xMax;
    const X = (m) => o.x + m * px;
    const Y = (m) => o.y - m * px;
    let anim = null;

    // Ground with a mark every 10 m (every 5 m when the range is short).
    kit.el("line", { x1: o.x - 30, y1: o.y, x2: o.x + o.w + 10, y2: o.y, stroke: kit.colors.ink, "stroke-width": 3 }, g);
    const step = o.xMax <= 25 ? 5 : 10;
    for (let m = 0; m <= o.xMax; m += step) {
      kit.el("line", { x1: X(m), y1: o.y, x2: X(m), y2: o.y + 10, stroke: kit.colors.steel, "stroke-width": 2 }, g);
      kit.el("text", { x: X(m), y: o.y + 28, "text-anchor": "middle", class: "simkit-tick", text: `${m} m` }, g);
    }
    const platform = kit.el("rect", { fill: "#d3d8d3" }, g);
    const path = kit.el("polyline", { fill: "none", stroke: kit.colors.muted, "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
    const trail = kit.el("polyline", { fill: "none", stroke: kit.colors.orange, "stroke-width": 3, "stroke-linejoin": "round" }, g);
    const arrowG = kit.el("g", null, g);
    const launchLabel = kit.el("text", { class: "simkit-label", fill: kit.colors.blueDark }, g);
    const ball = kit.el("circle", { r: 11, fill: kit.colors.orange, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    const landing = kit.el("g", null, g);

    const sol = () => kit.physics.projectile(o.v0, o.angle, o.h0, o.g);
    const at = (t) => {
      const s = sol();
      return [s.vx * t, o.h0 + s.vy * t - 0.5 * o.g * t * t];
    };
    const points = (tEnd) => {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const [x, y] = at((tEnd * i) / 40);
        pts.push(`${X(x).toFixed(1)},${Y(Math.max(0, y)).toFixed(1)}`);
      }
      return pts.join(" ");
    };

    function draw() {
      const s = sol();
      const a = (o.angle * Math.PI) / 180;
      kit.set(platform, { x: o.x - 30, y: Y(o.h0), width: 30 + 14, height: Math.max(0, o.h0 * px) });
      kit.set(ball, { cx: X(0), cy: Y(o.h0) - 11 });
      arrowG.textContent = "";
      const len = kit.clamp(o.v0 * 4.5, 40, 170);
      const bx = X(0);
      const by = Y(o.h0) - 11;
      kit.arrowShape(arrowG, bx, by, bx + Math.cos(a) * len, by - Math.sin(a) * len, { color: kit.colors.blue, width: 5, head: 14 });
      // Direct interaction: a ring on the arrow's tip; the arrow points at the pointer (angle) and stretches to it (speed).
      const aim = o.drag && o.drag.angle;
      const speed = o.drag && o.drag.v0;
      if ((kit.linked(aim) || kit.linked(speed)) && !anim) {
        const tip = kit.grip(arrowG, bx + Math.cos(a) * len, by - Math.sin(a) * len, 22);
        kit.drag(stage, tip, [aim, speed].filter(Boolean), (p) => {
          if (kit.linked(aim)) aim((Math.atan2(by - p.y, p.x - bx) * 180) / Math.PI);
          if (kit.linked(speed)) speed(Math.hypot(p.x - bx, p.y - by) / 4.5);
        });
      }
      // Under the launch point, where the flight path can never cross it.
      kit.set(launchLabel, { x: o.x - 30, y: o.y + 54, text: `Launch: ${kit.fmt(o.v0, o.v0 % 1 ? 1 : 0)} m/s at ${kit.fmt(o.angle, 0)}°` });
      kit.set(path, { points: o.showPath ? points(s.time) : "" });
      kit.set(trail, { points: "" });
      landing.textContent = "";
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
    }

    draw();

    return {
      update(next) {
        stop();
        Object.assign(o, Object.fromEntries(Object.entries(next).filter(([, v]) => v != null)));
        draw();
      },
      showPath(visible) {
        o.showPath = visible;
        kit.set(path, { points: visible ? points(sol().time) : "" });
      },
      values: sol,
      reset() {
        stop();
        draw();
      },
      stop,
      /** Fly the ball; afterwards the landing distance is marked on the ground. */
      launch() {
        stop();
        draw();
        const s = sol();
        const duration = kit.clamp(s.time * 0.6, 0.8, 3);
        anim = stage.animate(duration, (p) => {
          const [x, y] = at(s.time * p);
          kit.set(ball, { cx: X(x), cy: Y(Math.max(0, y)) - 11 });
          kit.set(trail, { points: points(s.time * p) });
        });
        return anim.then((done) => {
          if (done) {
            const lx = Math.min(X(s.range), o.x + o.w);
            kit.el("line", { x1: lx, y1: o.y - 26, x2: lx, y2: o.y, stroke: kit.colors.orange, "stroke-width": 3 }, landing);
            kit.el("text", { x: lx, y: o.y - 34, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.orange, text: `${kit.fmt(s.range, 1)} m` }, landing);
          }
          return done;
        });
      },
    };
  };
})();
