/* simkit core: SVG helpers, stage, animation, formatting, small physics helpers.
 * Plain browser script (no modules) so lessons work from file:// and in sandboxed iframes.
 * Everything is exposed on window.simkit.
 */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const kit = (window.simkit = window.simkit || {});

  kit.colors = {
    ink: "#2b2f2c",
    muted: "#7a827c",
    line: "#c9cfc9",
    paper: "#f7f4ee",
    grid: "#efebe4",
    red: "#e8735f",
    redDark: "#c4513f",
    blue: "#4a7fe0",
    blueDark: "#2f5fbf",
    green: "#2fa57a",
    greenDark: "#1f7a59",
    yellow: "#f2c14e",
    orange: "#f08c2e",
    purple: "#8a63d2",
    steel: "#8f9aa3",
  };

  /** Create an SVG element. attrs.text sets textContent. Returns the element. */
  kit.el = function (tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    if (attrs) kit.set(node, attrs);
    if (parent) parent.appendChild(node);
    return node;
  };

  /** Set attributes on an SVG element (null/undefined removes). */
  kit.set = function (node, attrs) {
    for (const key in attrs) {
      const value = attrs[key];
      if (key === "text") node.textContent = value == null ? "" : String(value);
      else if (value == null || value === false) node.removeAttribute(key);
      else node.setAttribute(key, String(value));
    }
    return node;
  };

  kit.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  kit.lerp = (a, b, t) => a + (b - a) * t;

  /** Format a number for display: fixed digits, no "-0", "—" for non-finite. */
  kit.fmt = function (value, digits) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    const d = digits == null ? 1 : digits;
    const s = value.toFixed(d);
    return Number(s) === 0 ? (0).toFixed(d) : s.replace(/^-/, "−"); // typographic minus
  };

  /** "Nice" axis ticks between lo and hi (about `count` of them). */
  kit.ticks = function (lo, hi, count) {
    const span = hi - lo;
    if (!(span > 0)) return [lo];
    const raw = span / (count || 5);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Number(v.toFixed(10)));
    return out;
  };

  /**
   * Create a stage: a responsive SVG with a fixed coordinate system (viewBox).
   * opts: { width=1000, height=600, grid=true, gridSize=40 }
   */
  kit.stage = function (container, opts) {
    const o = Object.assign({ width: 1000, height: 600, grid: true, gridSize: 40 }, opts);
    const svg = kit.el("svg", {
      viewBox: `0 0 ${o.width} ${o.height}`,
      width: "100%",
      height: "100%",
      preserveAspectRatio: "xMidYMid meet",
      class: "simkit-stage",
      role: "img",
    });
    const defs = kit.el("defs", null, svg);
    const id = "g" + Math.random().toString(36).slice(2, 8);
    if (o.grid) {
      const pattern = kit.el("pattern", { id: id + "grid", width: o.gridSize, height: o.gridSize, patternUnits: "userSpaceOnUse" }, defs);
      kit.el("path", { d: `M ${o.gridSize} 0 L 0 0 0 ${o.gridSize}`, fill: "none", stroke: kit.colors.grid, "stroke-width": 1 }, pattern);
    }
    // Oversized so the grid also fills the margins when the stage is letterboxed to fit the window.
    kit.el("rect", { x: -3000, y: -3000, width: o.width + 6000, height: o.height + 6000, fill: o.grid ? `url(#${id}grid)` : "none" }, svg);
    container.appendChild(svg);

    const frameFns = new Set();
    let raf = 0;
    let last = 0;
    function loop(now) {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      frameFns.forEach((fn) => fn(dt, now / 1000));
      raf = frameFns.size ? requestAnimationFrame(loop) : 0;
      if (!raf) last = 0;
    }

    const stage = {
      svg,
      defs,
      width: o.width,
      height: o.height,
      uid: (name) => id + name,
      /** New <g> layer on top of the previous ones. */
      layer(attrs) {
        return kit.el("g", attrs || {}, svg);
      },
      /** Run fn(dt, t) every animation frame until the returned function is called. */
      onFrame(fn) {
        frameFns.add(fn);
        if (!raf) raf = requestAnimationFrame(loop);
        return () => frameFns.delete(fn);
      },
      /**
       * Animate for `duration` seconds; step(progress 0..1, elapsed s, dt) may return false to stop early.
       * Returns a promise with .cancel(). Resolves true if completed, false if cancelled/stopped.
       */
      animate(duration, step) {
        let elapsed = 0;
        let stop;
        let resolveFn;
        const promise = new Promise((resolve) => {
          resolveFn = resolve;
          stop = stage.onFrame((dt) => {
            elapsed += dt;
            const p = Math.min(1, elapsed / duration);
            const keep = step(p, elapsed, dt);
            if (keep === false || p >= 1) {
              stop();
              resolve(keep !== false);
            }
          });
        });
        promise.cancel = () => {
          stop();
          resolveFn(false);
        };
        return promise;
      },
      destroy() {
        frameFns.clear();
        if (raf) cancelAnimationFrame(raf);
        svg.remove();
      },
    };
    return stage;
  };

  /** Draw an arrow head marker-free (so colors always match). Returns a <g>. */
  kit.arrowShape = function (parent, x1, y1, x2, y2, opts) {
    const o = Object.assign({ color: kit.colors.ink, width: 6, head: 16 }, opts);
    const g = kit.el("g", { class: "simkit-arrow" }, parent);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return g;
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const head = Math.min(o.head, len);
    const bx = x2 - ux * head;
    const by = y2 - uy * head;
    kit.el("line", { x1, y1, x2: bx, y2: by, stroke: o.color, "stroke-width": o.width, "stroke-linecap": "butt" }, g);
    const hw = Math.max(o.width * 1.6, head * 0.7);
    kit.el(
      "polygon",
      {
        points: `${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`,
        fill: o.color,
      },
      g
    );
    return g;
  };

  /**
   * A labelled vector arrow that can be updated.
   * opts: { x, y, dx, dy, color, label, width, labelSide: "above"|"below" }
   * Returns { update(partialOpts), show(bool), el }
   */
  kit.arrow = function (stage, opts) {
    const g = (opts && opts.parent) || stage.layer({ class: "simkit-vector" });
    let o = Object.assign({ x: 0, y: 0, dx: 100, dy: 0, color: kit.colors.ink, label: "", width: 6, labelSide: "above" }, opts);
    function draw() {
      g.textContent = "";
      kit.arrowShape(g, o.x, o.y, o.x + o.dx, o.y + o.dy, { color: o.color, width: o.width });
      if (o.label) {
        const below = o.labelSide === "below";
        const vertical = Math.abs(o.dy) > Math.abs(o.dx) * 1.5;
        kit.el(
          "text",
          {
            x: o.x + o.dx / 2 + (vertical ? (below ? 14 : -14) : 0),
            y: o.y + o.dy / 2 + (vertical ? 5 : below ? 26 : -14),
            "text-anchor": vertical ? (below ? "start" : "end") : "middle",
            class: "simkit-label",
            fill: o.color,
            text: o.label,
          },
          g
        );
      }
    }
    draw();
    return {
      el: g,
      update(next) {
        o = Object.assign(o, next);
        draw();
      },
      show(visible) {
        g.style.display = visible ? "" : "none";
      },
    };
  };

  /** Small physics helpers shared by components and lesson models. */
  kit.physics = {
    /** 1D collision. e = 1 elastic, e = 0 perfectly inelastic. Returns final velocities. */
    collide1D(m1, v1, m2, v2, e) {
      const restitution = e == null ? 1 : e;
      const total = m1 + m2;
      const vcm = (m1 * v1 + m2 * v2) / total;
      return {
        v1: vcm + (restitution * m2 * (v2 - v1)) / total,
        v2: vcm + (restitution * m1 * (v1 - v2)) / total,
      };
    },
    /** Ideal gas pressure in kPa for n mol, T kelvin, V litres. */
    gasPressure(n, T, V) {
      return (n * 8.314 * T) / V;
    },
    /** Spring-mass period in seconds. */
    springPeriod(k, m) {
      return 2 * Math.PI * Math.sqrt(m / k);
    },
    /** Pendulum small-angle period in seconds. */
    pendulumPeriod(L, g) {
      return 2 * Math.PI * Math.sqrt(L / (g || 9.8));
    },
    /**
     * Solve a battery + resistors circuit. layout "series" or "parallel".
     * resistances: array of ohms. Returns { totalR, current, parts: [{ R, I, V, P }] }.
     */
    circuit(layout, V, resistances) {
      const rs = resistances.map((r) => Math.max(r, 1e-9));
      if (layout === "parallel") {
        const parts = rs.map((R) => ({ R, I: V / R, V, P: (V * V) / R }));
        const current = parts.reduce((s, p) => s + p.I, 0);
        return { totalR: V / current, current, parts };
      }
      const totalR = rs.reduce((s, r) => s + r, 0);
      const current = V / totalR;
      return { totalR, current, parts: rs.map((R) => ({ R, I: current, V: current * R, P: current * current * R })) };
    },
  };
})();
