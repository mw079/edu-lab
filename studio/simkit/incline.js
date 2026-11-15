/* simkit.incline: a block on an inclined plane with its force arrows. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=140, y=470 (lower-left corner, where the angle is), base=560 (px), angle=30 (deg, up to 45),
   *         mass=2 (kg), mu=0 (friction coefficient), g=9.8, lengthM=2 (slope length the block can slide, m),
   *         showForces=true, showValues=true (numbers on the force arrows),
   *         showComponents=false (dashed arrow for the part of the weight along the slope, "W∥") }
   * The slope rises to the right; the block starts near the top and slides down to the left.
   * Returns { update({ angle, mass, mu, g }), showForces(bool), showValues(bool),
   *   slide() -> Promise (animated with the real acceleration; stays put if friction holds it), reset(), stop(), values() }
   * values() -> { weight, normal, parallel, friction, net, a }
   */
  kit.incline = function (stage, opts) {
    const o = Object.assign({ x: 140, y: 470, base: 560, angle: 30, mass: 2, mu: 0, g: 9.8, lengthM: 2, showForces: true, showValues: true, showComponents: false }, opts);
    const g = stage.layer({ class: "simkit-incline" });
    const wedge = kit.el("polygon", { fill: "#e3e7e3", stroke: kit.colors.steel, "stroke-width": 3, "stroke-linejoin": "round" }, g);
    const arc = kit.el("path", { fill: "none", stroke: kit.colors.ink, "stroke-width": 2 }, g);
    const angleLabel = kit.el("text", { class: "simkit-label", fill: kit.colors.ink }, g);
    const block = kit.el("g", null, g);
    const forces = kit.el("g", null, g);
    let anim = null;
    let pos = 0; // metres slid down from the start

    const sol = () => kit.physics.incline(o.mass, o.angle, o.mu, o.g);

    function draw() {
      const t = (kit.clamp(o.angle, 0, 45) * Math.PI) / 180;
      const h = o.base * Math.tan(t);
      const top = { x: o.x + o.base, y: o.y - h };
      kit.set(wedge, { points: `${o.x},${o.y} ${top.x},${o.y} ${top.x},${top.y}` });
      kit.set(arc, { d: `M ${o.x + 70} ${o.y} A 70 70 0 0 0 ${o.x + 70 * Math.cos(t)} ${o.y - 70 * Math.sin(t)}` });
      kit.set(angleLabel, { x: o.x + 84, y: o.y - 12 - 20 * Math.sin(t), text: `${kit.fmt(o.angle, 0)}°` });

      // Block: its base centre sits on the slope; start is 78% of the way up.
      const slopePx = o.base / Math.cos(t);
      const pxPerM = (slopePx * 0.6) / o.lengthM;
      const d = slopePx * 0.78 - pos * pxPerM;
      const size = 66 + Math.min(5, Math.max(0.5, o.mass)) * 6;
      const cx = o.x + d * Math.cos(t);
      const cy = o.y - d * Math.sin(t);
      const deg = -o.angle;
      block.textContent = "";
      const b = kit.el("g", { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${deg})` }, block);
      kit.el("rect", { x: -size / 2, y: -size, width: size, height: size, rx: 8, fill: kit.colors.purple }, b);
      kit.el("text", { x: 0, y: -size / 2 + 6, "text-anchor": "middle", class: "simkit-label", fill: "#fff", text: `${kit.fmt(o.mass, o.mass % 1 ? 1 : 0)} kg` }, b);

      forces.textContent = "";
      if (!o.showForces) return;
      const s = sol();
      const mid = { x: cx - (size / 2) * Math.sin(t), y: cy - (size / 2) * Math.cos(t) }; // block centre
      const scale = kit.clamp(110 / Math.max(s.weight, 1), 1.5, 12); // weight arrow ≈ 110 px
      const val = (name, n) => (o.showValues ? `${name} = ${kit.fmt(n, 1)} N` : name);
      // Each arrow starts at the edge of the block (so the mass label stays readable) and is at least 34 px long.
      const arrow = (ux, uy, newtons, color, text, lx, ly, anchor) => {
        if (newtons < 0.05) return;
        const len = Math.max(34, newtons * scale);
        const x1 = mid.x + ux * (size / 2 + 4);
        const y1 = mid.y + uy * (size / 2 + 4);
        kit.arrowShape(forces, x1, y1, x1 + ux * len, y1 + uy * len, { color, width: 5, head: 13 });
        kit.el("text", { x: x1 + ux * len + lx, y: y1 + uy * len + ly, "text-anchor": anchor, class: "simkit-label", fill: color, text }, forces);
      };
      arrow(0, 1, s.weight, kit.colors.red, val("W", s.weight), 12, 0, "start");
      arrow(-Math.sin(t), -Math.cos(t), s.normal, kit.colors.blue, val("N", s.normal), 0, -12, "middle");
      arrow(Math.cos(t), -Math.sin(t), s.friction, kit.colors.green, val("f", s.friction), 10, -10, "start");
      if (o.showComponents && s.parallel >= 0.05) {
        // The part of the weight that pulls the block down the slope, drawn dashed from the block's lower edge.
        const len = Math.max(34, s.parallel * scale);
        const x1 = mid.x - Math.cos(t) * (size / 2 + 4);
        const y1 = mid.y + Math.sin(t) * (size / 2 + 4);
        const x2 = x1 - Math.cos(t) * len;
        const y2 = y1 + Math.sin(t) * len;
        const a = kit.arrowShape(forces, x1, y1, x2, y2, { color: kit.colors.red, width: 4, head: 12 });
        a.querySelector("line").setAttribute("stroke-dasharray", "7 5");
        kit.el("text", { x: x2 - Math.sin(t) * 16, y: y2 - Math.cos(t) * 16, "text-anchor": "end", class: "simkit-label", fill: kit.colors.red, text: val("W∥", s.parallel) }, forces);
      }
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
    }

    draw();

    return {
      update(next) {
        stop();
        pos = 0;
        Object.assign(o, Object.fromEntries(Object.entries(next).filter(([, v]) => v != null)));
        draw();
      },
      showForces(visible) {
        o.showForces = visible;
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      showComponents(visible) {
        o.showComponents = visible;
        draw();
      },
      values: sol,
      reset() {
        stop();
        pos = 0;
        draw();
      },
      stop,
      /** Let go of the block: it slides lengthM metres with a = values().a, or stays if friction holds it. */
      slide() {
        stop();
        pos = 0;
        const a = sol().a;
        if (a < 1e-6) {
          draw();
          return Promise.resolve(true);
        }
        const time = Math.sqrt((2 * o.lengthM) / a);
        anim = stage.animate(kit.clamp(time, 0.6, 4), (p) => {
          pos = o.lengthM * p * p; // constant acceleration
          draw();
        });
        return anim;
      },
    };
  };
})();
