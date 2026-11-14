/* simkit.springMass: horizontal mass on a spring attached to a wall, with ruler and oscillation. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=80, y=300 (centre line), restLength=320 px, pxPerM=400, k=20 (N/m), mass=1 (kg),
   *         displacement=0 (m, + to the right), showForce=true, onSample(t, x) }
   * Returns { update({ k, mass, displacement }), play({ amplitude, duration }) -> Promise, stop(), period() }
   */
  kit.springMass = function (stage, opts) {
    const o = Object.assign({ x: 80, y: 300, restLength: 320, pxPerM: 400, k: 20, mass: 1, displacement: 0, showForce: true }, opts);
    const g = stage.layer({ class: "simkit-spring" });
    const wallX = o.x;
    const floorY = o.y + 50;
    let anim = null;
    let x = o.displacement;

    // Static parts: wall, floor, equilibrium marker, ruler.
    kit.el("rect", { x: wallX - 26, y: o.y - 110, width: 26, height: 186, fill: "#cfd5cf" }, g);
    for (let i = 0; i < 9; i++) kit.el("line", { x1: wallX - 26, y1: o.y - 100 + i * 20, x2: wallX - 8, y2: o.y - 82 + i * 20, stroke: kit.colors.steel, "stroke-width": 2 }, g);
    kit.el("rect", { x: wallX, y: floorY, width: o.restLength + 0.6 * o.pxPerM + 120, height: 8, rx: 4, fill: "#d3d8d3" }, g);
    const eqX = wallX + o.restLength;
    // Rest position: a short dashed mark at the spring's height (kept below the force arrow above the block),
    // named under the ruler so no label crosses it.
    kit.el("line", { x1: eqX, x2: eqX, y1: o.y - 34, y2: floorY + 26, stroke: kit.colors.muted, "stroke-dasharray": "6 6" }, g);
    kit.el("text", { x: eqX, y: floorY + 60, "text-anchor": "middle", class: "simkit-tick", text: "rest position" }, g);
    for (let cm = -50; cm <= 50; cm += 10) {
      const rx = eqX + (cm / 100) * o.pxPerM;
      if (rx < wallX + 20) continue;
      kit.el("line", { x1: rx, x2: rx, y1: floorY + 10, y2: floorY + (cm % 50 === 0 ? 24 : 18), stroke: kit.colors.steel, "stroke-width": 2 }, g);
      if (cm % 20 === 0) kit.el("text", { x: rx, y: floorY + 40, "text-anchor": "middle", class: "simkit-tick", text: `${cm} cm` }, g);
    }

    const spring = kit.el("polyline", { fill: "none", stroke: kit.colors.ink, "stroke-width": 4, "stroke-linejoin": "round" }, g);
    const block = kit.el("g", null, g);
    const forceG = kit.el("g", null, g);

    function blockSize() {
      return 60 + Math.min(4, Math.max(0.1, o.mass)) * 14;
    }

    function draw() {
      const size = blockSize();
      const left = eqX + x * o.pxPerM - size / 2;
      const coils = 12;
      const amp = 16;
      const pts = [`${wallX},${o.y}`, `${wallX + 16},${o.y}`];
      const span = left - wallX - 32;
      for (let i = 1; i < coils * 2; i++) pts.push(`${wallX + 16 + (span * i) / (coils * 2)},${o.y + (i % 2 ? -amp : amp)}`);
      pts.push(`${left - 16},${o.y}`, `${left},${o.y}`);
      kit.set(spring, { points: pts.join(" ") });

      block.textContent = "";
      kit.el("rect", { x: left, y: floorY - size, width: size, height: size, rx: 10, fill: kit.colors.purple }, block);
      kit.el("text", { x: left + size / 2, y: floorY - size / 2 + 7, "text-anchor": "middle", class: "simkit-cart-label", text: `${kit.fmt(o.mass, o.mass < 1 ? 2 : 1)} kg` }, block);

      forceG.textContent = "";
      if (o.showForce && Math.abs(x) > 1e-6) {
        const F = -o.k * x;
        const len = kit.clamp(F * 6, -200, 200);
        const fy = floorY - size - 30;
        const cx = left + size / 2;
        kit.arrowShape(forceG, cx, fy, cx + len, fy, { color: kit.colors.orange, width: 6, head: 14 });
        kit.el("text", { x: cx + len / 2, y: fy - 14, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.orange, text: `F = ${kit.fmt(Math.abs(F), 1)} N` }, forceG);
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
        if (next.k != null) o.k = next.k;
        if (next.mass != null) o.mass = next.mass;
        if (next.displacement != null) x = o.displacement = next.displacement;
        draw();
      },
      period() {
        return kit.physics.springPeriod(o.k, o.mass);
      },
      stop,
      /** Release from `amplitude` metres (default: current displacement) and oscillate. */
      play(params) {
        stop();
        const A = params && params.amplitude != null ? params.amplitude : o.displacement || 0.2;
        const duration = (params && params.duration) || 6;
        const w = Math.sqrt(o.k / o.mass);
        anim = stage.animate(duration, (_p, t) => {
          x = A * Math.cos(w * t);
          if (o.onSample) o.onSample(t, x);
          draw();
        });
        return anim.then((done) => {
          x = o.displacement;
          draw();
          return done;
        });
      },
    };
  };
})();
