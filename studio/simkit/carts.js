/* simkit.cartTrack: carts on a 1D track with momentum/velocity arrows and animated collisions. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: {
   *   x=60, y=400 (track top), width=880, range=[0,10] metres shown,
   *   carts: [{ id, mass, v, pos (m), color, label }],
   *   arrows: "momentum" | "velocity" | "none"   (default "momentum"),
   *   arrowScale: px per unit (default 12 for momentum, 30 for velocity),
   *   drag: { [cartId]: app.link("vKey") }  (the student drags the arrow's tip to set that cart's velocity)
   * }
   * Returns {
   *   update({ [id]: { mass, v, pos } }), showArrows(bool),
   *   runCollision({ e }) -> Promise<{ collided, v: { [id]: finalV } }>,
   *   reset(), stop(), positions()
   * }
   */
  kit.cartTrack = function (stage, opts) {
    const o = Object.assign({ x: 60, y: 400, width: 880, range: [0, 10], carts: [], arrows: "momentum" }, opts);
    const scale = o.arrowScale || (o.arrows === "velocity" ? 30 : 12);
    const pxPerM = o.width / (o.range[1] - o.range[0]);
    const g = stage.layer({ class: "simkit-carts" });
    const toPx = (m) => o.x + (m - o.range[0]) * pxPerM;

    // Track with tick marks every metre.
    kit.el("rect", { x: o.x - 10, y: o.y + 34, width: o.width + 20, height: 8, rx: 4, fill: "#d3d8d3" }, g);
    for (let m = Math.ceil(o.range[0]); m <= o.range[1]; m++) {
      kit.el("line", { x1: toPx(m), x2: toPx(m), y1: o.y + 42, y2: o.y + 54, stroke: kit.colors.steel, "stroke-width": 2 }, g);
      if (m % 2 === 0) kit.el("text", { x: toPx(m), y: o.y + 72, "text-anchor": "middle", class: "simkit-tick", text: `${m} m` }, g);
    }

    const carts = o.carts.map((c, i) => {
      const cg = kit.el("g", { class: "simkit-cart" }, g);
      const arrowG = kit.el("g", null, g);
      const cart = {
        id: c.id,
        mass: c.mass ?? 1,
        v: c.v ?? 0,
        pos: c.pos ?? (i === 0 ? 2.5 : 7.5),
        color: c.color || (i === 0 ? kit.colors.red : kit.colors.blue),
        label: c.label,
        g: cg,
        arrowG,
        home: c.pos ?? (i === 0 ? 2.5 : 7.5),
      };
      return cart;
    });

    const widthOf = (c) => 84 + Math.min(10, Math.max(0, c.mass)) * 9;
    let arrowsVisible = o.arrows !== "none";
    let anim = null;

    function drawCart(c, lift) {
      const w = widthOf(c);
      const cx = toPx(c.pos);
      const top = o.y - 26;
      c.g.textContent = "";
      kit.el("rect", { x: cx - w / 2, y: top, width: w, height: 46, rx: 9, fill: c.color }, c.g);
      kit.el("rect", { x: cx - w / 2, y: top, width: w, height: 9, rx: 4, fill: "#fff", opacity: 0.25 }, c.g);
      [cx - w / 2 + 22, cx + w / 2 - 22].forEach((wx) => {
        kit.el("circle", { cx: wx, cy: o.y + 24, r: 13, fill: kit.colors.ink }, c.g);
        kit.el("circle", { cx: wx, cy: o.y + 24, r: 5, fill: "#fff" }, c.g);
      });
      kit.el("text", { x: cx, y: top + 31, "text-anchor": "middle", class: "simkit-cart-label", text: `${kit.fmt(c.mass, Number.isInteger(c.mass) ? 0 : 1)} kg` }, c.g);
      if (c.label) kit.el("text", { x: cx, y: o.y + 92, "text-anchor": "middle", class: "simkit-tick", text: c.label }, c.g);

      c.arrowG.textContent = "";
      if (!arrowsVisible) return;
      const value = o.arrows === "velocity" ? c.v : c.mass * c.v;
      const unit = o.arrows === "velocity" ? "m/s" : "kg·m/s";
      const len = kit.clamp(value * scale, -260, 260);
      const link = o.drag && o.drag[c.id];
      const handle = kit.linked(link) && !anim;
      const ay = top - 34 - (lift || 0);
      if (Math.abs(len) < 2) {
        kit.el("text", { x: cx, y: ay + 4, "text-anchor": "middle", class: "simkit-label", fill: c.color, text: `0 ${unit}` }, c.arrowG);
      } else {
        kit.arrowShape(c.arrowG, cx, ay, cx + len, ay, { color: c.color, width: 8, head: 18 });
        kit.el("text", { x: cx + len / 2, y: ay - (handle ? 30 : 16), "text-anchor": "middle", class: "simkit-label", fill: c.color, text: `${kit.fmt(Math.abs(value), 1)} ${unit}` }, c.arrowG);
      }
      // Direct interaction: a ring on the arrow's tip; dragging it sideways sets the velocity.
      if (handle) {
        const tip = kit.grip(c.arrowG, cx + len, ay, 22);
        const perPx = 1 / scale / (o.arrows === "velocity" ? 1 : Math.max(c.mass, 1e-9));
        kit.drag(stage, tip, link, (p, start, from) => link(from + (p.x - start.x) * perPx), () => c.v);
      }
    }

    function labelX(c) {
      const value = o.arrows === "velocity" ? c.v : c.mass * c.v;
      return toPx(c.pos) + kit.clamp(value * scale, -260, 260) / 2;
    }
    function drawAll() {
      carts.forEach((c, i) => {
        const clash = i > 0 && carts.slice(0, i).some((prev) => Math.abs(labelX(prev) - labelX(c)) < 150);
        drawCart(c, clash ? 46 : 0);
      });
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
    }

    drawAll();

    const api = {
      update(values) {
        stop();
        carts.forEach((c) => {
          const next = values && values[c.id];
          if (!next) return;
          if (next.mass != null) c.mass = next.mass;
          if (next.v != null) c.v = next.v;
          if (next.pos != null) c.home = next.pos;
          c.pos = c.home;
        });
        drawAll();
      },
      showArrows(visible) {
        arrowsVisible = visible && o.arrows !== "none";
        drawAll();
      },
      positions() {
        return Object.fromEntries(carts.map((c) => [c.id, c.pos]));
      },
      stop,
      reset() {
        stop();
        carts.forEach((c) => (c.pos = c.home));
        drawAll();
      },
      /**
       * Animate the first two carts until they collide (if they do) and then move apart / together.
       * e = 1 elastic, e = 0 perfectly inelastic (carts stick).
       */
      runCollision(params) {
        stop();
        const e = params && params.e != null ? params.e : 1;
        const [a, b] = carts;
        const start = { a: a.v, b: b.v };
        carts.forEach((c) => (c.pos = c.home));
        let collided = false;
        let stuck = false;
        const lo = o.range[0];
        const hi = o.range[1];
        const result = { collided: false, v: { [a.id]: a.v, [b.id]: b.v } };
        const gapM = () => (toPx(b.pos) - widthOf(b) / 2 - (toPx(a.pos) + widthOf(a) / 2)) / pxPerM;
        const halfM = (c) => widthOf(c) / 2 / pxPerM;
        anim = stage.animate(7, (_p, _t, dt) => {
          const sub = 4;
          for (let i = 0; i < sub; i++) {
            const h = dt / sub;
            a.pos += a.v * h;
            b.pos += b.v * h;
            if (!collided && gapM() <= 0 && a.v - b.v > 0) {
              collided = true;
              const out = kit.physics.collide1D(a.mass, a.v, b.mass, b.v, e);
              a.v = out.v1;
              b.v = out.v2;
              stuck = e === 0;
              const overlap = -gapM();
              a.pos -= overlap / 2;
              b.pos += overlap / 2;
            }
          }
          if (stuck) b.pos = a.pos + halfM(a) + halfM(b);
          const out = (c) => c.pos - halfM(c) < lo - 0.2 || c.pos + halfM(c) > hi + 0.2;
          drawAll();
          if (out(a) || out(b)) return false;
          return !(Math.abs(a.v) < 1e-9 && Math.abs(b.v) < 1e-9);
        });
        return anim.then(() => {
          result.collided = collided;
          result.v = { [a.id]: a.v, [b.id]: b.v };
          // Restore configured velocities so arrows match the controls on the next update.
          a.v = start.a;
          b.v = start.b;
          return result;
        });
      },
    };
    return api;
  };
})();
