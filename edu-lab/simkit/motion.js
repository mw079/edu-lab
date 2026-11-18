/* simkit.motionTrack: a car on a straight road moving with constant acceleration. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=80, y=330 (left end of the road surface), w=840, xMax=100 (m shown), x0=0 (m), v0=0 (m/s),
   *         a=2 (m/s²), showValues=true (clock and speed labels), onSample(t, x, v) }
   * Returns { update({ x0, v0, a }), show({ v, t }), showValues(bool), play({ duration }) -> Promise,
   *   stop(), reset(), values(t) }   values(t) -> { x, v }   (see simkit.physics.motion)
   * play() runs in real time and ends early if the car leaves the road; the car stays where it ended.
   */
  kit.motionTrack = function (stage, opts) {
    const o = Object.assign({ x: 80, y: 330, w: 840, xMax: 100, x0: 0, v0: 0, a: 2, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-motion" });
    const shown = { v: o.showValues, t: o.showValues };
    const X = (m) => o.x + (kit.clamp(m, 0, o.xMax) / o.xMax) * o.w;
    kit.el("rect", { x: o.x - 30, y: o.y, width: o.w + 60, height: 16, rx: 4, fill: "#cfd5cf" }, g);
    const step = o.xMax <= 20 ? 2 : o.xMax <= 50 ? 5 : 10;
    for (let m = 0; m <= o.xMax + 1e-9; m += step) {
      kit.el("line", { x1: X(m), y1: o.y, x2: X(m), y2: o.y + 16, stroke: kit.colors.steel, "stroke-width": 2 }, g);
      kit.el("text", { x: X(m), y: o.y + 38, "text-anchor": "middle", class: "simkit-tick", text: `${m} m` }, g);
    }
    const clock = kit.el("text", { x: o.x - 30, y: o.y - 170, class: "simkit-label", fill: kit.colors.ink }, g);
    const car = kit.el("g", null, g);
    kit.el("rect", { x: -44, y: -40, width: 88, height: 26, rx: 8, fill: kit.colors.red }, car);
    kit.el("path", { d: "M -26 -40 L -16 -60 L 18 -60 L 30 -40 Z", fill: kit.colors.red }, car);
    kit.el("path", { d: "M -18 -42 L -12 -55 L 14 -55 L 22 -42 Z", fill: "#dceefb" }, car);
    for (const wx of [-26, 26]) kit.el("circle", { cx: wx, cy: -12, r: 12, fill: kit.colors.ink, stroke: "#fff", "stroke-width": 2 }, car);
    const arrowG = kit.el("g", null, g);
    let anim = null;
    let t = 0;

    function draw() {
      const now = kit.physics.motion(o.x0, o.v0, o.a, t);
      const cx = X(now.x);
      kit.set(car, { transform: `translate(${cx.toFixed(1)} ${o.y})` });
      kit.set(clock, { text: shown.t ? `t = ${kit.fmt(t, 1)} s` : "" });
      arrowG.textContent = "";
      const len = kit.clamp(Math.abs(now.v) * 5, 0, 150) * Math.sign(now.v);
      if (shown.v && Math.abs(len) > 6) kit.arrowShape(arrowG, cx, o.y - 84, cx + len, o.y - 84, { color: kit.colors.purple, width: 6, head: 14 });
      // The speed label stays on the stage when the car is near either end of the road.
      kit.el("text", { x: kit.clamp(cx, o.x + 40, o.x + o.w - 40), y: o.y - 104, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple, text: shown.v ? `v = ${kit.fmt(now.v, 1)} m/s` : "" }, arrowG);
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
    }

    draw();

    return {
      update(next) {
        stop();
        for (const key of ["x0", "v0", "a"]) if (next[key] != null) o[key] = next[key];
        t = 0;
        draw();
      },
      /** show({ v: false }) hides the speed arrow and its label; show({ t: false }) hides the clock. */
      show(which) {
        if (which.v != null) shown.v = which.v;
        if (which.t != null) shown.t = which.t;
        draw();
      },
      showValues(visible) {
        shown.v = shown.t = visible;
        draw();
      },
      values: (time) => kit.physics.motion(o.x0, o.v0, o.a, time == null ? t : time),
      stop,
      reset() {
        stop();
        t = 0;
        draw();
      },
      play(params) {
        stop();
        t = 0;
        const duration = (params && params.duration) || 8;
        anim = stage.animate(duration, (_p, elapsed) => {
          const next = kit.physics.motion(o.x0, o.v0, o.a, elapsed);
          if (next.x > o.xMax || next.x < 0) return false;
          t = elapsed;
          if (o.onSample) o.onSample(t, next.x, next.v);
          draw();
        });
        return anim;
      },
    };
  };
})();
