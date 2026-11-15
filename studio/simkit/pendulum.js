/* simkit.pendulum: a bob on a string swinging from a fixed support. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=70 (pivot), pxPerM=170, L=1.5 (m), angle=20 (deg from vertical, + to the right),
   *         mass=1 (kg, bob size only), g=9.8, showValues=true (length and angle labels), onSample(t, angleDeg),
   *         drag: { angle: app.link("key") } (the student can drag the bob to set the angle) }
   * Returns { update({ L, angle, mass, g }), showValues(bool), play({ duration }) -> Promise, stop(), period() }
   * Swings as simple harmonic motion (small-angle), so it matches T = 2π√(L/g).
   */
  kit.pendulum = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 70, pxPerM: 170, L: 1.5, angle: 20, mass: 1, g: 9.8, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-pendulum" });
    let anim = null;
    let angle = o.angle;

    kit.el("rect", { x: o.x - 110, y: o.y - 16, width: 220, height: 16, rx: 4, fill: "#cfd5cf" }, g);
    for (let i = 0; i < 10; i++) kit.el("line", { x1: o.x - 100 + i * 22, y1: o.y - 16, x2: o.x - 112 + i * 22, y2: o.y - 2, stroke: kit.colors.steel, "stroke-width": 2 }, g);
    const vertical = kit.el("line", { x1: o.x, y1: o.y, x2: o.x, stroke: kit.colors.muted, "stroke-dasharray": "6 6" }, g);
    const arc = kit.el("path", { fill: "none", stroke: kit.colors.orange, "stroke-width": 2 }, g);
    const string = kit.el("line", { x1: o.x, y1: o.y, stroke: kit.colors.ink, "stroke-width": 3 }, g);
    const dragAngle = o.drag && o.drag.angle;
    const grip = kit.grip(g, 0, 0, 0);
    const bob = kit.el("circle", { fill: kit.colors.purple, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    // Dragging the bob sets the release angle.
    const dragging = kit.drag(stage, bob, dragAngle, (p) => dragAngle((Math.atan2(p.x - o.x, Math.max(1, p.y - o.y)) * 180) / Math.PI));
    kit.el("circle", { cx: o.x, cy: o.y, r: 5, fill: kit.colors.ink }, g);
    const angleLabel = kit.el("text", { class: "simkit-label", fill: kit.colors.orange }, g);
    const lengthLabel = kit.el("text", { class: "simkit-label", fill: kit.colors.ink }, g);

    function draw() {
      const a = (angle * Math.PI) / 180;
      const len = o.L * o.pxPerM;
      const bx = o.x + Math.sin(a) * len;
      const by = o.y + Math.cos(a) * len;
      const r = 14 + Math.min(4, Math.max(0.2, o.mass)) * 5;
      kit.set(vertical, { y2: o.y + len + r + 14 });
      kit.set(string, { x2: bx, y2: by });
      kit.set(bob, { cx: bx, cy: by, r });
      kit.set(grip, { cx: bx, cy: by, r: r + 10, display: kit.linked(dragAngle) && !anim ? null : "none" });
      dragging.refresh();
      // Angle arc and label near the pivot; the length label beside the string on the far side.
      const ar = 56;
      const side = angle >= 0 ? 1 : -1;
      kit.set(arc, { d: Math.abs(angle) < 0.5 ? "" : `M ${o.x} ${o.y + ar} A ${ar} ${ar} 0 0 ${side > 0 ? 0 : 1} ${o.x + Math.sin(a) * ar} ${o.y + Math.cos(a) * ar}` });
      // Labels stay where the release position puts them: the angle outside the string, the length on the
      // other side of the vertical line.
      const rest = { o: o.angle >= 0 ? 1 : -1, a: (o.angle * Math.PI) / 180 };
      const lr = Math.min(84, Math.max(40, len - r - 30)); // on a short string the label moves up, clear of the bob
      kit.set(angleLabel, { x: o.x + Math.sin(rest.a) * lr + rest.o * 16, y: o.y + Math.cos(rest.a) * lr + 5, "text-anchor": rest.o > 0 ? "start" : "end", text: o.showValues ? `θ = ${kit.fmt(Math.abs(o.angle), 0)}°` : "" });
      kit.set(lengthLabel, { x: o.x - rest.o * 18, y: o.y + len / 2 + 5, "text-anchor": rest.o > 0 ? "end" : "start", text: o.showValues ? `L = ${kit.fmt(o.L, 2)} m` : "" });
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
      angle = o.angle;
    }

    draw();

    return {
      update(next) {
        stop();
        if (next.L != null) o.L = next.L;
        if (next.angle != null) o.angle = next.angle;
        if (next.mass != null) o.mass = next.mass;
        if (next.g != null) o.g = next.g;
        angle = o.angle;
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      period() {
        return kit.physics.pendulumPeriod(o.L, o.g);
      },
      stop() {
        stop();
        draw();
      },
      /** Release from the set angle and swing. */
      play(params) {
        stop();
        const duration = (params && params.duration) || 6;
        const w = Math.sqrt(o.g / o.L);
        anim = stage.animate(duration, (_p, t) => {
          angle = o.angle * Math.cos(w * t);
          if (o.onSample) o.onSample(t, angle);
          draw();
        });
        return anim.then((done) => {
          angle = o.angle;
          draw();
          return done;
        });
      },
    };
  };
})();
