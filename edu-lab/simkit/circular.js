/* simkit.circularMotion: a ball on a string swung in a horizontal circle (seen from above). */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=300, y=280 (centre), radius=1.5 (m, 0.5–3; 75 px per m), speed=4 (m/s, 1–10), mass=0.5 (kg, 0.1–2),
   *         showForce=true,
   *         drag: { radius: app.link("key") } (the student drags the ball in or out to change the radius) }
   * Returns { update({ radius, speed, mass }), show({ force }), spin() → Promise (one turn),
   *           release() → Promise (the string is cut: the ball flies off along the velocity arrow), values() }
   * values() -> { force (N), accel (m/s²), period (s), omega (rad/s) }   (see simkit.physics.circular)
   */
  kit.circularMotion = function (stage, opts) {
    const o = Object.assign({ x: 300, y: 280, radius: 1.5, speed: 4, mass: 0.5, showForce: true }, opts);
    const g = stage.layer({ class: "simkit-circular" });
    const PX = 75;
    const pull = o.drag && o.drag.radius;
    let angle = 0; // radians, 0 = right of the centre, anticlockwise
    let flying = null; // { x, y } while released
    const pic = kit.el("g", null, g);
    const ball = kit.el("g", null, g); // on top, so the arrows that start at the ball do not catch the pointer
    const sol = () => kit.physics.circular(o.mass, o.speed, o.radius);
    const dragger = kit.drag(stage, ball, pull, (p) => pull(kit.clamp(Math.hypot(p.x - o.x, p.y - o.y) / PX, 0.5, 3)));

    function draw() {
      pic.textContent = "";
      ball.textContent = "";
      const s = sol();
      const r = kit.clamp(o.radius, 0.5, 3) * PX;
      const bx = flying ? flying.x : o.x + r * Math.cos(angle);
      const by = flying ? flying.y : o.y - r * Math.sin(angle);
      kit.el("circle", { cx: o.x, cy: o.y, r, fill: "none", stroke: kit.colors.line, "stroke-width": 2, "stroke-dasharray": "6 6" }, pic);
      kit.el("circle", { cx: o.x, cy: o.y, r: 6, fill: kit.colors.ink }, pic);
      if (!flying) kit.el("line", { x1: o.x, y1: o.y, x2: bx, y2: by, stroke: "#7a6a4a", "stroke-width": 3 }, pic);
      // Velocity: along the tangent (anticlockwise motion).
      const tx = -Math.sin(angle);
      const ty = -Math.cos(angle);
      const vLen = 30 + o.speed * 9;
      kit.arrowShape(pic, bx, by, bx + tx * vLen, by + ty * vLen, { color: kit.colors.green, width: 5, head: 13 });
      kit.el("text", { x: bx + tx * vLen + 12, y: by + ty * vLen + 5, "text-anchor": "start", class: "simkit-label", fill: kit.colors.green, text: `v = ${kit.fmt(o.speed, 1)} m/s` }, pic);
      // Force: towards the centre, drawn beside the string so both stay visible.
      if (!flying && o.showForce) {
        const ux = (o.x - bx) / r;
        const uy = (o.y - by) / r;
        const fLen = kit.clamp(20 + s.force * 3, 24, Math.max(24, r - 30));
        const ox = -uy * 14;
        const oy = ux * 14;
        kit.arrowShape(pic, bx + ox, by + oy, bx + ox + ux * fLen, by + oy + uy * fLen, { color: kit.colors.red, width: 5, head: 13 });
      }
      kit.el("text", { x: o.x + 14, y: o.y + 28, "text-anchor": "start", class: "simkit-tick", text: `r = ${kit.fmt(o.radius, 2)} m` }, pic);
      // Values at the right, outside the largest circle.
      const lx = o.x + 3 * PX + 140; // clear of the velocity label even at the largest radius
      kit.el("text", { x: lx, y: o.y - 60, class: "simkit-label", fill: kit.colors.ink, text: `ball ${kit.fmt(o.mass, 1)} kg` }, pic);
      kit.el("text", { x: lx, y: o.y - 28, class: "simkit-label", fill: kit.colors.red, text: o.showForce ? `pull of the string ${kit.fmt(s.force, 1)} N` : "pull of the string ? N" }, pic);
      kit.el("text", { x: lx, y: o.y + 4, class: "simkit-tick", text: "points to the centre" }, pic);
      kit.el("text", { x: lx, y: o.y + 40, class: "simkit-label", fill: kit.colors.ink, text: `one turn: ${kit.fmt(s.period, 2)} s` }, pic);
      // The ball (grabbable while its radius is linked).
      const br = 10 + o.mass * 6;
      if (kit.linked(pull) && !flying) kit.grip(ball, bx, by, Math.max(22, br + 8));
      kit.el("circle", { cx: bx, cy: by, r: br, fill: kit.colors.blue, stroke: kit.colors.blueDark, "stroke-width": 2 }, ball);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["radius", "speed", "mass"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ force: false }) removes the force arrow and writes "? N". */
      show(which) {
        if (which.force != null) o.showForce = which.force;
        draw();
      },
      /** The ball goes once round; a faster ball (shorter period) goes round faster, at most 3 s. */
      spin() {
        const seconds = kit.clamp(sol().period, 0.6, 3);
        return stage.animate(seconds, (p) => {
          angle = p * 2 * Math.PI;
          draw();
        }).then((done) => {
          angle = 0;
          draw();
          return done;
        });
      },
      /** Cut the string: the ball keeps moving in a straight line along its velocity. */
      release() {
        const r = kit.clamp(o.radius, 0.5, 3) * PX;
        const x0 = o.x + r * Math.cos(angle);
        const y0 = o.y - r * Math.sin(angle);
        const tx = -Math.sin(angle);
        const ty = -Math.cos(angle);
        return stage.animate(1.2, (p) => {
          flying = { x: x0 + tx * 260 * p, y: y0 + ty * 260 * p };
          draw();
        }).then((done) => {
          flying = null;
          angle = 0;
          draw();
          return done;
        });
      },
      values: sol,
    };
  };
})();
