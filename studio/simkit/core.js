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
    muted: "#646d67",
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

  /**
   * Darker versions of the object colours for text on the paper, so every label keeps at least 4.5:1 contrast
   * (DESIGN.md §7). Applied automatically to the fill of <text> and <tspan>: components and scenes keep
   * using kit.colors.* for both the object and its label.
   */
  const c = kit.colors;
  kit.textColors = {
    [c.red]: "#b23a28", [c.redDark]: "#b23a28", [c.blue]: c.blueDark, [c.green]: c.greenDark,
    [c.yellow]: "#8a6400", [c.orange]: "#a85a12", [c.purple]: "#6e4fc0", [c.steel]: "#5f6872",
  };
  kit.textColor = (color) => kit.textColors[String(color).toLowerCase()] || color;

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
      else if (key === "fill" && value != null && (node.tagName === "text" || node.tagName === "tspan")) node.setAttribute(key, kit.textColor(value));
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

    const running = new Set(); // cancel functions of animate() calls in progress
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
        let cancel;
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
              running.delete(cancel);
              resolve(keep !== false);
            }
          });
        });
        cancel = promise.cancel = () => {
          stop();
          running.delete(cancel);
          resolveFn(false);
        };
        running.add(cancel);
        return promise;
      },
      /** Cancel every running animate() (not onFrame loops such as charge flow). The shell calls this when a step changes. */
      stopAnimations() {
        [...running].forEach((c) => c());
      },
      destroy() {
        frameFns.clear();
        if (raf) cancelAnimationFrame(raf);
        svg.remove();
      },
    };
    return stage;
  };

  /**
   * Let the student drag an element. `link` is what the lesson's app.link("key") returned (or a list of them);
   * with no link, or while the link is disabled (its control is locked), nothing happens.
   * move(point, start, data) is called with the pointer in stage coordinates while dragging; it should call the
   * link(s) with the new value. `start` is where the pointer went down and `data` what begin() returned then
   * (e.g. the value at that moment), so an object can move by the pointer's offset instead of jumping to it.
   * Works when the element is redrawn during the drag. Returns { refresh() } to update the cursor and the
   * hover style after the lock state may have changed.
   */
  kit.drag = function (stage, el, link, move, begin) {
    const links = [].concat(link || []).filter((l) => typeof l === "function");
    const enabled = () => links.some((l) => !l.enabled || l.enabled());
    const refresh = () => {
      const on = links.length > 0 && enabled();
      el.style.cursor = on ? "grab" : "";
      el.classList.toggle("simkit-draggable", on);
    };
    if (!links.length) return { refresh };
    el.style.touchAction = "none";
    const point = (e) => {
      const m = stage.svg.getScreenCTM();
      return { x: (e.clientX - m.e) / m.a, y: (e.clientY - m.f) / m.d };
    };
    let dragging = false;
    el.addEventListener("pointerdown", (e) => {
      if (!enabled() || dragging || !e.isPrimary) return; // a second finger does not take over the drag
      e.preventDefault();
      dragging = true;
      // Track the pointer on the window: the drag survives the element being redrawn or the pointer leaving it.
      // The object follows the pointer 1:1, with no easing (DESIGN.md §3).
      const start = point(e);
      const data = begin ? begin(start) : undefined;
      const onMove = (ev) => ev.pointerId === e.pointerId && enabled() && move(point(ev), start, data);
      stage.svg.classList.add("simkit-dragging");
      const end = () => {
        dragging = false;
        stage.svg.classList.remove("simkit-dragging");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
      move(start, start, data);
    });
    refresh();
    return { refresh };
  };

  /** Let the student click an element; fn runs only while `link` (from app.link) is enabled. */
  kit.click = function (el, link, fn) {
    if (typeof link !== "function") return;
    const enabled = () => !link.enabled || link.enabled();
    el.style.cursor = enabled() ? "pointer" : "";
    el.classList.toggle("simkit-clickable", enabled());
    el.addEventListener("click", () => enabled() && fn());
  };

  /** True when a link from app.link exists and its control is unlocked right now. */
  kit.linked = (link) => typeof link === "function" && (!link.enabled || link.enabled());

  /** A soft ring behind something the student can grab. */
  kit.grip = function (parent, x, y, r) {
    return kit.el("circle", { cx: x, cy: y, r, fill: kit.colors.purple, "fill-opacity": 0.16, stroke: kit.colors.purple, "stroke-opacity": 0.5, "stroke-width": 2, "stroke-dasharray": "4 5", class: "simkit-grip" }, parent);
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
    /**
     * Projectile launched at v0 (m/s), angleDeg above horizontal, from height h0 (m).
     * Returns { vx, vy, time (s in the air), range (m), maxHeight (m above ground) }.
     */
    projectile(v0, angleDeg, h0, g) {
      const G = g || 9.8;
      const a = (angleDeg * Math.PI) / 180;
      const vx = v0 * Math.cos(a);
      const vy = v0 * Math.sin(a);
      const y0 = h0 || 0;
      const time = (vy + Math.sqrt(vy * vy + 2 * G * y0)) / G;
      return { vx, vy, time, range: vx * time, maxHeight: y0 + (vy * vy) / (2 * G) };
    },
    /**
     * Block of mass m (kg) on a slope of angleDeg with friction coefficient mu.
     * Returns { weight, normal, parallel (weight component down the slope), friction, net, a } in N and m/s².
     * The block stays at rest (a = 0) when friction can hold it.
     */
    incline(m, angleDeg, mu, g) {
      const G = g || 9.8;
      const t = (angleDeg * Math.PI) / 180;
      const weight = m * G;
      const normal = weight * Math.cos(t);
      const parallel = weight * Math.sin(t);
      const friction = Math.min(parallel, (mu || 0) * normal);
      const net = parallel - friction;
      return { weight, normal, parallel, friction, net, a: net / m };
    },
    /**
     * Snell's law for light going from index n1 into n2 at angleDeg from the normal.
     * Returns { theta2 (degrees, null when totally reflected), tir (bool), critical (degrees, null if n1 <= n2) }.
     */
    snell(n1, n2, angleDeg) {
      const sin2 = (n1 * Math.sin((angleDeg * Math.PI) / 180)) / n2;
      const critical = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;
      const tir = sin2 > 1;
      return { theta2: tir ? null : (Math.asin(sin2) * 180) / Math.PI, tir, critical };
    },
    /**
     * Planet on an ellipse with semi-major axis a (AU) and eccentricity e around a star of M solar masses.
     * Returns { period (years), rPeri, rAp (AU), vPeri, vAp (km/s) }. Kepler's third law: T² = a³ / M.
     */
    orbit(a, e, M) {
      const m = M || 1;
      const ecc = e || 0;
      const speed = (r) => 29.78 * Math.sqrt(m * (2 / r - 1 / a));
      const rPeri = a * (1 - ecc);
      const rAp = a * (1 + ecc);
      return { period: Math.sqrt((a * a * a) / m), rPeri, rAp, vPeri: speed(rPeri), vAp: speed(rAp) };
    },
    /** Concentration in mol/L of `moles` of solute in `volumeML` millilitres of solution. */
    molarity(moles, volumeML) {
      return moles / (Math.max(volumeML, 1e-9) / 1000);
    },
    /**
     * Relative rate of A + B -> AB: proportional to both concentrations and to exp(-Ea / RT).
     * 1 at cA = cB = 1, T = 300 K. EaKJ is the activation energy in kJ/mol (default 50).
     */
    reactionRate(cA, cB, T, EaKJ) {
      const Ea = (EaKJ == null ? 50 : EaKJ) * 1000;
      return cA * cB * Math.exp((-Ea / 8.314) * (1 / T - 1 / 300));
    },
    /**
     * Photosynthesis rate of a water plant in oxygen bubbles per minute, with limiting factors.
     * light 0–100 (% lamp brightness), co2 0–0.2 (% CO2), temp in °C (best at 30, stops at 10 and 50).
     * Returns { rate, limiting: "light" | "co2" | "temperature" }.
     */
    photosynthesis(light, co2, temp) {
      const byLight = 0.4 * light;
      const byCo2 = 400 * co2;
      const t = temp == null ? 30 : temp;
      const tempFactor = Math.max(0, 1 - ((t - 30) / 20) ** 2);
      const rate = Math.min(byLight, byCo2) * tempFactor;
      return { rate, limiting: tempFactor < 0.5 ? "temperature" : byLight <= byCo2 ? "light" : "co2" };
    },
    /** Element 1–20: { symbol, name, shells: electrons per shell for `electrons` (default: neutral atom) }. */
    element(protons, electrons) {
      const table = "H Hydrogen,He Helium,Li Lithium,Be Beryllium,B Boron,C Carbon,N Nitrogen,O Oxygen,F Fluorine,Ne Neon,Na Sodium,Mg Magnesium,Al Aluminium,Si Silicon,P Phosphorus,S Sulfur,Cl Chlorine,Ar Argon,K Potassium,Ca Calcium".split(",");
      const [symbol, name] = (table[protons - 1] || "? Unknown").split(" ");
      const shells = [];
      let left = electrons == null ? protons : electrons;
      for (const cap of [2, 8, 8, 18]) {
        if (left <= 0) break;
        shells.push(Math.min(cap, left));
        left -= cap;
      }
      return { symbol, name, shells };
    },
    /**
     * Thin lens with focal length f (negative = diverging) and an object at dObj in front of it (same unit).
     * Returns { dImg (negative = virtual, on the object's side; Infinity at dObj = f), m (magnification,
     * negative = upside down), real (bool), upright (bool) }.
     */
    lens(f, dObj) {
      const dImg = Math.abs(dObj - f) < 1e-9 ? Infinity : (f * dObj) / (dObj - f);
      const m = Number.isFinite(dImg) ? -dImg / dObj : Infinity;
      return { dImg, m, real: dImg > 0, upright: m > 0 };
    },
    /**
     * Lever with mass m1 (kg) at d1 (m) left of the pivot and m2 at d2 right of it.
     * Returns { torque1, torque2 (N·m), net (torque1 − torque2; positive = left side goes down), balanced }.
     */
    lever(m1, d1, m2, d2, g) {
      const G = g || 9.8;
      const torque1 = m1 * G * d1;
      const torque2 = m2 * G * d2;
      return { torque1, torque2, net: torque1 - torque2, balanced: Math.abs(torque1 - torque2) < 1e-6 };
    },
    /**
     * Cross of two parents for one gene. Each parent is its number of dominant alleles: 2 = AA, 1 = Aa, 0 = aa.
     * Returns { cells: 4 genotypes (row by row), AA, Aa, aa (how many of the 4), dominant (fraction that
     * shows the dominant trait) }.
     */
    punnett(p1, p2, letter) {
      const L = letter || "A";
      const alleles = (p) => (p >= 2 ? [L, L] : p >= 1 ? [L, L.toLowerCase()] : [L.toLowerCase(), L.toLowerCase()]);
      // A parent may also be written as a genotype such as "Aa" (capital letters are dominant alleles).
      const num = (p) => (typeof p === "string" ? [...p].filter((ch) => ch !== ch.toLowerCase()).length : Math.round(p));
      const top = alleles(num(p1));
      const side = alleles(num(p2));
      const cells = [];
      for (const s of side) for (const t of top) cells.push([t, s].sort().join(""));
      const count = (n) => cells.filter((c) => [...c].filter((ch) => ch === L).length === n).length;
      return { cells, AA: count(2), Aa: count(1), aa: count(0), dominant: (count(2) + count(1)) / 4, top, side };
    },
    /**
     * Photoelectric effect: light of wavelengthNm on a metal with work function workEV.
     * Returns { photonEV, emitted (bool), keEV (max kinetic energy, 0 if none), stopV (volts), thresholdNm }.
     */
    photoelectric(wavelengthNm, workEV) {
      const photonEV = 1239.84 / wavelengthNm;
      const keEV = Math.max(0, photonEV - workEV);
      return { photonEV, emitted: keEV > 0, keEV, stopV: keEV, thresholdNm: 1239.84 / workEV };
    },
    /** Force between two point charges q1, q2 (in µC) r metres apart: { force (N, size), attract (bool) }. */
    coulomb(q1, q2, r) {
      return { force: (8.99e9 * Math.abs(q1 * q2) * 1e-12) / (r * r), attract: q1 * q2 < 0 };
    },
    /**
     * Block of density rhoObj in a fluid of density rhoFluid (kg/m³), volume in litres.
     * Returns { weight, buoyant (N), floats (bool), submerged (fraction of the block under the surface) }.
     * A sunk block rests on the bottom, so its buoyant force is smaller than its weight.
     */
    buoyancy(rhoObj, rhoFluid, volumeL, g) {
      const G = g || 9.8;
      const V = (volumeL == null ? 1 : volumeL) / 1000;
      const floats = rhoObj <= rhoFluid;
      const submerged = floats ? rhoObj / rhoFluid : 1;
      return { weight: rhoObj * V * G, buoyant: rhoFluid * V * submerged * G, floats, submerged };
    },
    /**
     * Moon phase for the angle Sun–Earth–Moon in degrees (0 = new moon, 180 = full moon).
     * Returns { name, lit (fraction of the disc that looks lit, 0–1), day (of the 29.5-day cycle) }.
     */
    moonPhase(angleDeg) {
      const a = ((angleDeg % 360) + 360) % 360;
      const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
      const main = Math.round(a / 90) * 90;
      const name = Math.abs(a - main) <= 6 ? names[((main / 90) % 4) * 2] : names[Math.floor(a / 90) * 2 + 1];
      return { name, lit: (1 - Math.cos((a * Math.PI) / 180)) / 2, day: (a / 360) * 29.5 };
    },
    /** Straight-line motion with constant acceleration: { x (m), v (m/s) } at time t. */
    motion(x0, v0, a, t) {
      return { x: x0 + v0 * t + 0.5 * a * t * t, v: v0 + a * t };
    },
    /**
     * Atwood machine: masses m1 (left) and m2 (right) on a string over a light pulley.
     * Returns { a (m/s², size), tension (N), heavier: "m1" | "m2" | "none" }.
     */
    atwood(m1, m2, g) {
      const G = g || 9.8;
      return { a: (Math.abs(m1 - m2) * G) / (m1 + m2), tension: (2 * m1 * m2 * G) / (m1 + m2), heavier: m1 > m2 ? "m1" : m2 > m1 ? "m2" : "none" };
    },
    /** Radioactive decay: { fraction (still undecayed, 0–1), remaining (whole nuclei of n0) } after time t. */
    decay(n0, t, halfLife) {
      const fraction = Math.pow(0.5, t / halfLife);
      return { fraction, remaining: Math.round(n0 * fraction) };
    },
    /** Double slit: distance between bright fringes in mm, for wavelength in nm, slit separation in mm, screen distance in m. */
    fringeSpacing(wavelengthNm, dMm, Lm) {
      return (wavelengthNm * 1e-6 * Lm * 1000) / dMm;
    },
    /**
     * Two things exchange heat until they share one temperature (no heat lost). Masses in g, specific heats
     * in J/(g·°C), temperatures in °C. Returns { final (°C), heat (J moved from the hotter to the colder) }.
     */
    mixTemp(m1, c1, T1, m2, c2, T2) {
      const final = (m1 * c1 * T1 + m2 * c2 * T2) / (m1 * c1 + m2 * c2);
      return { final, heat: Math.abs(m1 * c1 * (final - T1)) };
    },
    /** State of matter at temperature T: "solid", "liquid" or "gas". */
    stateOf(T, melt, boil) {
      return T < melt ? "solid" : T < boil ? "liquid" : "gas";
    },
    /** Reactions for simkit.physics.balance: species on each side as [formula, { element: atoms }]. */
    reactions: {
      water: { left: [["H₂", { H: 2 }], ["O₂", { O: 2 }]], right: [["H₂O", { H: 2, O: 1 }]] },
      ammonia: { left: [["N₂", { N: 2 }], ["H₂", { H: 2 }]], right: [["NH₃", { N: 1, H: 3 }]] },
      methane: { left: [["CH₄", { C: 1, H: 4 }], ["O₂", { O: 2 }]], right: [["CO₂", { C: 1, O: 2 }], ["H₂O", { H: 2, O: 1 }]] },
      rust: { left: [["Fe", { Fe: 1 }], ["O₂", { O: 2 }]], right: [["Fe₂O₃", { Fe: 2, O: 3 }]] },
      magnesium: { left: [["Mg", { Mg: 1 }], ["O₂", { O: 2 }]], right: [["MgO", { Mg: 1, O: 1 }]] },
    },
    /**
     * Count the atoms on both sides of a reaction for the given coefficients (in the order the species are
     * written, left side first). Returns { left: { element: n }, right: { … }, balanced }.
     */
    balance(reaction, coefficients) {
      const r = kit.physics.reactions[reaction] || kit.physics.reactions.water;
      let i = 0;
      const count = (side) => {
        const total = {};
        for (const [, atoms] of side) {
          const k = Math.max(0, Math.round(coefficients[i++] || 0));
          for (const el in atoms) total[el] = (total[el] || 0) + k * atoms[el];
        }
        return total;
      };
      const left = count(r.left);
      const right = count(r.right);
      const balanced = Object.keys(left).every((el) => left[el] > 0 && left[el] === right[el]);
      return { left, right, balanced };
    },
    /**
     * Natural selection of dark and light moths on bark of darkness `bark` (0 light … 1 dark).
     * Each generation birds eat more of the moths that stand out. Returns the fraction of dark moths (0–1)
     * after `generations`, starting from startDark.
     */
    selection(startDark, bark, generations) {
      const sDark = 0.1 + 0.8 * bark;
      const sLight = 0.9 - 0.8 * bark;
      let p = startDark;
      for (let i = 0; i < Math.round(generations); i++) p = (p * sDark) / (p * sDark + (1 - p) * sLight);
      return p;
    },
    /** Standing wave number n on a string of length L (m) with wave speed v (m/s): { wavelength (m), frequency (Hz) }. */
    harmonic(n, L, v) {
      return { wavelength: (2 * L) / n, frequency: (n * v) / (2 * L) };
    },
    /**
     * Object of mass m (kg) released from rest at height h0 (m), now at height h, with no friction.
     * Returns { pe, ke, total (J), v (m/s) }.
     */
    energyAt(m, h0, h, g) {
      const G = g || 9.8;
      const total = m * G * h0;
      const pe = m * G * Math.min(h, h0);
      return { pe, ke: total - pe, total, v: Math.sqrt(2 * G * Math.max(0, h0 - h)) };
    },
    /**
     * Strong acid (cAcid mol/L, vAcid mL) titrated with vBase mL of a strong base (cBase mol/L).
     * Returns { pH, equivalence (mL of base that exactly neutralises the acid) }.
     */
    titration(cAcid, vAcid, cBase, vBase) {
      const acid = cAcid * vAcid;
      const base = cBase * vBase;
      const total = vAcid + vBase;
      const excess = (acid - base) / total; // mol/L of H+ (positive) or OH- (negative)
      const pH = Math.abs(excess) < 1e-9 ? 7 : excess > 0 ? -Math.log10(excess) : 14 + Math.log10(-excess);
      return { pH: Math.min(14, Math.max(0, pH)), equivalence: acid / cBase };
    },
    /** Energy (same unit as base) that reaches feeding level `level` (1 = producers) when efficiencyPct passes on each step. */
    trophic(base, efficiencyPct, level) {
      return base * Math.pow(efficiencyPct / 100, level - 1);
    },
    /**
     * Cell with solute concentration `inside` in a solution of concentration `outside` (same unit).
     * Returns { water: "in" | "out" | "none" (net movement of water), solution: "hypotonic" | "isotonic" |
     * "hypertonic" (the solution compared with the cell), size (final cell volume relative to the start) }.
     */
    osmosis(inside, outside) {
      const diff = inside - outside;
      const same = Math.abs(diff) < 1e-9;
      return { water: same ? "none" : diff > 0 ? "in" : "out", solution: same ? "isotonic" : diff > 0 ? "hypotonic" : "hypertonic", size: Math.min(2, Math.max(0.4, inside / Math.max(outside, 1e-9))) };
    },
    /**
     * Sunlight through the year. month 1–12 (6 = the June solstice, 12 = the December solstice), latitude in
     * degrees (negative = south), tilt of the Earth's axis in degrees (23.5).
     * Returns { daylight (hours), noonSun (degrees above the horizon at midday), season }.
     */
    daylight(month, latitude, tilt) {
      const t = tilt == null ? 23.5 : tilt;
      const lat = latitude == null ? 45 : latitude;
      const rad = Math.PI / 180;
      const decl = t * Math.cos((2 * Math.PI * (month - 6)) / 12);
      const x = -Math.tan(lat * rad) * Math.tan(decl * rad);
      const daylight = x <= -1 ? 24 : x >= 1 ? 0 : (24 / Math.PI) * Math.acos(x);
      const m = ((Math.round(month) - 1 + 12) % 12) + 1;
      const north = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"][m - 1];
      const flip = { winter: "summer", summer: "winter", spring: "autumn", autumn: "spring" };
      return { daylight, noonSun: Math.min(90, 90 - Math.abs(lat - decl)), season: lat >= 0 ? north : flip[north] };
    },
    /** y = ax² + bx + c: { vertex: { x, y }, roots: [] | [x] | [x1, x2] (smaller first), discriminant }. */
    quadratic(a, b, c) {
      const discriminant = b * b - 4 * a * c;
      const vx = -b / (2 * a);
      const roots = discriminant < -1e-9 ? [] : Math.abs(discriminant) <= 1e-9 ? [vx] : [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)].sort((p, q) => p - q);
      return { vertex: { x: vx, y: c - (b * b) / (4 * a) }, roots, discriminant };
    },
    /** Summary of a list of numbers: { mean, median, min, max, range }. */
    stats(values) {
      const v = values.filter((n) => typeof n === "number" && Number.isFinite(n)).sort((p, q) => p - q);
      if (!v.length) return { mean: 0, median: 0, min: 0, max: 0, range: 0 };
      const mid = Math.floor(v.length / 2);
      return { mean: v.reduce((sum, n) => sum + n, 0) / v.length, median: v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2, min: v[0], max: v[v.length - 1], range: v[v.length - 1] - v[0] };
    },
    /** Whole number 0–255 as a list of bits, highest place first: bits(5, 4) -> [0, 1, 0, 1]. */
    bits(value, count) {
      const n = count || 8;
      const v = Math.max(0, Math.min(Math.pow(2, n) - 1, Math.round(value)));
      return Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);
    },
    /** Output (0 or 1) of a logic gate: "AND", "OR", "XOR", "NAND", "NOR" or "NOT" (uses only a). */
    gate(type, a, b) {
      const A = a ? 1 : 0;
      const B = b ? 1 : 0;
      const out = { AND: A & B, OR: A | B, XOR: A ^ B, NAND: 1 - (A & B), NOR: 1 - (A | B), NOT: 1 - A }[String(type).toUpperCase()];
      return out == null ? 0 : out;
    },
    /**
     * Bubble sort of `values` after `steps` comparisons.
     * Returns { array, comparisons, swaps, done, next: [i, j] (the pair compared next, null when done), total
     * (comparisons the whole sort needs) }.
     */
    bubbleSort(values, steps) {
      const run = (limit) => {
        const a = values.slice();
        let comparisons = 0;
        let swaps = 0;
        for (let end = a.length - 1; end > 0; end--) {
          let swapped = false;
          for (let i = 0; i < end; i++) {
            if (comparisons >= limit) return { array: a, comparisons, swaps, done: false, next: [i, i + 1] };
            comparisons++;
            if (a[i] > a[i + 1]) {
              [a[i], a[i + 1]] = [a[i + 1], a[i]];
              swaps++;
              swapped = true;
            }
          }
          if (!swapped) break;
        }
        return { array: a, comparisons, swaps, done: true, next: null };
      };
      const full = run(Infinity);
      return Object.assign(run(Math.max(0, Math.round(steps || 0))), { total: full.comparisons });
    },
    /**
     * Binary search for `target` in sorted `values` after `steps` checks.
     * Returns { low, high (indices still possible), mid (index checked next, null when finished), found (index
     * or null), checks (made so far), needed (checks the whole search takes) }.
     */
    binarySearch(values, target, steps) {
      const run = (limit) => {
        let low = 0;
        let high = values.length - 1;
        let checks = 0;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (checks >= limit) return { low, high, mid, found: null, checks };
          checks++;
          if (values[mid] === target) return { low: mid, high: mid, mid: null, found: mid, checks };
          if (values[mid] < target) low = mid + 1;
          else high = mid - 1;
        }
        return { low, high, mid: null, found: null, checks };
      };
      return Object.assign(run(Math.max(0, Math.round(steps || 0))), { needed: run(Infinity).checks });
    },
    /**
     * Air temperature near the ground (°C) for a cloud cover of 0–100 %. By day clouds block sunlight (cooler);
     * at night they hold the ground's heat in (warmer). day: 30 − 0.10 × cloud, night: 8 + 0.08 × cloud.
     */
    cloudTemperature(cloudPct, isDay) {
      const c = Math.max(0, Math.min(100, cloudPct));
      return isDay ? 30 - 0.1 * c : 8 + 0.08 * c;
    },
    /** Wind from a high (hPa) to a low `distanceKm` apart: speed in km/h = 500 × pressure difference ÷ distance. */
    windSpeed(high, low, distanceKm) {
      return (500 * Math.max(0, high - low)) / Math.max(distanceKm, 1);
    },
    /**
     * Earth's average surface temperature (°C) for a CO2 level (ppm) and the fraction of sunlight reflected
     * (albedo, 0.3 today): 14 at 280 ppm, +3 for each doubling of CO2, −1 for each 0.01 more albedo.
     */
    greenhouse(co2, albedo) {
      return 14 + 3 * Math.log2(Math.max(co2, 1) / 280) - 100 * ((albedo == null ? 0.3 : albedo) - 0.3);
    },
    /**
     * Diffusion through a membrane: `left` and `right` particles at the start, after `minutes` with `pores` open
     * channels. Each side moves towards the average; the difference halves every ln 2 ÷ (0.1 × pores) minutes.
     * rate = net particles per minute from left to right.
     */
    diffusion(left, right, minutes, pores) {
      const eq = (left + right) / 2;
      const k = 0.1 * Math.max(0, pores);
      const f = Math.exp(-k * Math.max(0, minutes));
      const L = eq + (left - eq) * f;
      const R = eq + (right - eq) * f;
      return { left: L, right: R, difference: Math.abs(L - R), rate: (k * (L - R)) / 2, equilibrium: eq };
    },
    /**
     * Predator and prey (Lotka–Volterra) after `years`: prey grow at `birth` per year and are eaten at
     * hunt × prey × predators; predators grow at 0.2 × hunt × prey and die at 0.4 per year.
     * The numbers circle around the balance point preyEq = 2 ÷ hunt, predEq = birth ÷ hunt.
     * series = [[year, prey, predators], …] every 0.1 year.
     */
    predatorPrey(prey0, pred0, birth, hunt, years) {
      const f = (x, y) => [birth * x - hunt * x * y, 0.2 * hunt * x * y - 0.4 * y];
      const dt = 0.02;
      let x = Math.max(0, prey0);
      let y = Math.max(0, pred0);
      const series = [[0, x, y]];
      const steps = Math.round(Math.max(0, years) / dt);
      for (let i = 1; i <= steps; i++) {
        const [a1, b1] = f(x, y);
        const [a2, b2] = f(x + (a1 * dt) / 2, y + (b1 * dt) / 2);
        const [a3, b3] = f(x + (a2 * dt) / 2, y + (b2 * dt) / 2);
        const [a4, b4] = f(x + a3 * dt, y + b3 * dt);
        x = Math.min(1e4, Math.max(0, x + (dt * (a1 + 2 * a2 + 2 * a3 + a4)) / 6));
        y = Math.min(1e4, Math.max(0, y + (dt * (b1 + 2 * b2 + 2 * b3 + b4)) / 6));
        if (i % 5 === 0 || i === steps) series.push([i * dt, x, y]);
      }
      return { prey: x, predators: y, preyEq: 2 / hunt, predEq: birth / hunt, series };
    },
    /**
     * Base pairing. template: letters such as "ATGCCA"; bases: the new strand as numbers, one per template base
     * (0 = empty, 1 = A, 2 = T (U in RNA), 3 = G, 4 = C). A pairs with T (or U), G with C.
     * → { matches: [true/false …], correct, complete, bonds (hydrogen bonds of the finished strand: A–T 2, G–C 3) }
     */
    basePairs(template, bases) {
      const partner = { A: 2, T: 1, U: 1, G: 4, C: 3 };
      const letters = String(template).toUpperCase().split("");
      const matches = letters.map((l, i) => partner[l] === Number((bases || [])[i]));
      const correct = matches.filter(Boolean).length;
      return { matches, correct, complete: correct === letters.length, bonds: letters.reduce((sum, l) => sum + (l === "G" || l === "C" ? 3 : 2), 0) };
    },
    /**
     * Cell division by mitosis. stage 0–5: interphase (DNA copied), prophase, metaphase, anaphase, telophase,
     * cytokinesis; pairs = pairs of chromosomes (2 pairs → 4 chromosomes).
     * → { name, cells, chromosomes (in the whole picture: doubles when the copies separate), perCell }
     */
    mitosis(stage, pairs) {
      const st = Math.max(0, Math.min(5, Math.round(stage)));
      const chromosomes = (st >= 3 ? 4 : 2) * pairs;
      const cells = st >= 5 ? 2 : 1;
      return { name: ["interphase", "prophase", "metaphase", "anaphase", "telophase", "cytokinesis"][st], cells, chromosomes, perCell: chromosomes / cells };
    },
    /**
     * Two plates. speed in cm per year (+ = moving together, − = apart), time in million years, kind
     * "ocean-ocean", "ocean-continent" or "continent-continent".
     * → { boundary: "convergent" | "divergent" | "none", feature, distance (km moved: 10 km per cm/yr per million years) }
     */
    plates(speed, millionYears, kind) {
      const boundary = speed > 0 ? "convergent" : speed < 0 ? "divergent" : "none";
      const land = kind === "continent-continent";
      const feature =
        boundary === "none" ? "no change" : boundary === "divergent" ? (land ? "rift valley" : "mid-ocean ridge") : land ? "mountain range" : kind === "ocean-ocean" ? "trench and island arc" : "trench and volcanoes";
      return { boundary, feature, distance: Math.abs(speed) * Math.max(0, millionYears) * 10 };
    },
    /**
     * Water vapour in air. vapour in g/m³, temperature in °C. Warm air can hold more: the limit is
     * saturation = 5 × 2^(T ÷ 10) g/m³ (it doubles every 10 °C).
     * → { saturation, relative (% humidity), dewPoint (°C at which this air is saturated), condensing (relative ≥ 100) }
     */
    humidity(vapour, tempC) {
      const saturation = 5 * Math.pow(2, tempC / 10);
      const relative = (100 * vapour) / saturation;
      return { saturation, relative, dewPoint: 10 * Math.log2(Math.max(vapour, 1e-9) / 5), condensing: relative >= 100 - 1e-9 };
    },
    /** Sum of two vectors given by components → { x, y, magnitude, angle (degrees, 0–360), magA, magB }. */
    vectorSum(ax, ay, bx, by) {
      const x = ax + bx;
      const y = ay + by;
      return { x, y, magnitude: Math.hypot(x, y), angle: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, magA: Math.hypot(ax, ay), magB: Math.hypot(bx, by) };
    },
    /** Sine, cosine and tangent of an angle in degrees → { sin, cos, tan (null at 90° and 270°), quadrant (1–4) }. */
    trig(angleDeg) {
      const a = ((angleDeg % 360) + 360) % 360;
      const clean = (v) => (Math.abs(v) < 1e-12 ? 0 : v);
      const sin = clean(Math.sin((a * Math.PI) / 180));
      const cos = clean(Math.cos((a * Math.PI) / 180));
      return { sin, cos, tan: cos === 0 ? null : sin / cos, quadrant: a < 90 ? 1 : a < 180 ? 2 : a < 270 ? 3 : 4 };
    },
    /**
     * pH of a solution that starts at `pH0` and is diluted tenfold `dilutions` times: each tenfold dilution moves
     * the pH one step towards 7 (never past it).
     * → { pH, kind: "acid" | "neutral" | "base", exponent (so that [H+] = 10^exponent mol/L), timesNeutral
     *     (how many times more H+ than neutral water: 10^(7 − pH)) }
     */
    ph(pH0, dilutions) {
      const n = Math.max(0, dilutions || 0);
      const pH = pH0 < 7 ? Math.min(7, pH0 + n) : Math.max(7, pH0 - n);
      return { pH, kind: pH < 6.95 ? "acid" : pH > 7.05 ? "base" : "neutral", exponent: -pH, timesNeutral: Math.pow(10, 7 - pH) };
    },
    /**
     * Gravity between two masses. m1, m2 in 10^24 kg, r in 10^8 m (Earth 5.97, Moon 0.0735, 3.84 apart).
     * → { force } in 10^20 N = 66.74 × m1 × m2 ÷ r²
     */
    gravity(m1, m2, r) {
      return { force: (66.74 * m1 * m2) / Math.max(r * r, 1e-9) };
    },
    /** Planets of the Solar System, 1 = Mercury … 8 = Neptune. */
    planets: [
      { name: "Mercury", a: 0.39 }, { name: "Venus", a: 0.72 }, { name: "Earth", a: 1 }, { name: "Mars", a: 1.52 },
      { name: "Jupiter", a: 5.2 }, { name: "Saturn", a: 9.58 }, { name: "Uranus", a: 19.2 }, { name: "Neptune", a: 30.1 },
    ],
    /**
     * One planet (index 1–8) → { name, a (distance from the Sun in AU), period (years for one orbit = a^1.5),
     *   speed (km/s = 29.8 ÷ √a), orbits (completed in `years`, default 1) }
     */
    planet(index, years) {
      const p = kit.physics.planets[Math.max(1, Math.min(8, Math.round(index))) - 1];
      const period = Math.pow(p.a, 1.5);
      return { name: p.name, a: p.a, period, speed: 29.8 / Math.sqrt(p.a), orbits: (years == null ? 1 : years) / period };
    },
    /**
     * Life of a star of `mass` Suns at `stage` 0–4.
     * → { lifetime (billion years on the main sequence = 10 × mass^−2.5), temperature (K at the surface on the
     *     main sequence ≈ 5800 × √mass), massive (mass ≥ 8), fate ("white dwarf", "neutron star" below 20 Suns,
     *     else "black hole"), stages: the five names in order, name (of this stage) }
     */
    star(mass, stage) {
      const m = Math.max(0.1, mass);
      const massive = m >= 8;
      const fate = !massive ? "white dwarf" : m < 20 ? "neutron star" : "black hole";
      const stages = ["nebula", "main sequence", massive ? "red supergiant" : "red giant", massive ? "supernova" : "planetary nebula", fate];
      return { lifetime: 10 * Math.pow(m, -2.5), temperature: 5800 * Math.sqrt(m), massive, fate, stages, name: stages[Math.max(0, Math.min(4, Math.round(stage || 0)))] };
    },
    /**
     * Ice and warming with a tipping point. heating 0–10; startIce: 1 = the planet starts with ice, 0 = without.
     * Ice reflects sunlight, which keeps it cold (a feedback loop). With ice: cover = 100 − 6 × heating, until
     * heating passes 7 and the ice collapses. Without ice it only returns when heating falls below 3.
     * → { ice (% cover), state: "icy" | "ice-free", temperature (°C = −5 + 2 × heating + 0.1 × (100 − ice)) }
     */
    tipping(heating, startIce) {
      const h = Math.max(0, Math.min(10, heating));
      const icy = startIce ? h <= 7 : h < 3;
      const ice = icy ? 100 - 6 * h : 0;
      return { ice, state: icy ? "icy" : "ice-free", temperature: -5 + 2 * h + 0.1 * (100 - ice) };
    },
    /** The amino acid (three-letter name, or "Stop") for an mRNA codon such as "AUG". */
    codon(triplet) {
      const t = String(triplet).toUpperCase().replace(/T/g, "U");
      const table = "UUU Phe UUC Phe UUA Leu UUG Leu CUU Leu CUC Leu CUA Leu CUG Leu AUU Ile AUC Ile AUA Ile AUG Met GUU Val GUC Val GUA Val GUG Val UCU Ser UCC Ser UCA Ser UCG Ser CCU Pro CCC Pro CCA Pro CCG Pro ACU Thr ACC Thr ACA Thr ACG Thr GCU Ala GCC Ala GCA Ala GCG Ala UAU Tyr UAC Tyr UAA Stop UAG Stop CAU His CAC His CAA Gln CAG Gln AAU Asn AAC Asn AAA Lys AAG Lys GAU Asp GAC Asp GAA Glu GAG Glu UGU Cys UGC Cys UGA Stop UGG Trp CGU Arg CGC Arg CGA Arg CGG Arg AGU Ser AGC Ser AGA Arg AGG Arg GGU Gly GGC Gly GGA Gly GGG Gly".split(" ");
      const i = table.indexOf(t);
      return i >= 0 && i % 2 === 0 ? table[i + 1] : "?";
    },
    /**
     * Translation of an mRNA such as "AUGGCUUGGUAA" (read three letters at a time).
     * picks: the student's choice per codon as numbers (0 = empty, k = the k-th entry of `choices`).
     * → { codons, protein (the right amino acids), choices (alphabetical list offered: the right ones plus Gly
     *     and Ser), answer (the right number per codon), matches, correct, complete }
     */
    translate(mrna, picks) {
      const codons = (String(mrna).toUpperCase().replace(/T/g, "U").match(/.{3}/g) || []).slice(0, 5);
      const protein = codons.map((c) => kit.physics.codon(c));
      const choices = Array.from(new Set(protein.concat(["Gly", "Ser"]))).sort();
      const answer = protein.map((a) => choices.indexOf(a) + 1);
      const matches = answer.map((a, i) => a === Number((picks || [])[i]));
      const correct = matches.filter(Boolean).length;
      return { codons, protein, choices, answer, matches, correct, complete: correct === codons.length };
    },
    /**
     * A robot on a grid runs: repeat `repeat` times { move forward `forward` squares; turn }.
     * turn: 0 = none, 1 = left, 2 = right. It starts at (startX, startY) facing east on a cols × rows grid
     * (default start (1, 1), grid 8 × 6) and stops at a wall.
     * → { x, y, facing ("east" | "north" | "west" | "south"), path: [[x, y], …], moves (squares moved), crashed }
     */
    robot(repeat, forward, turn, cols, rows, startX, startY) {
      const W = cols || 8;
      const H = rows || 6;
      let x = startX == null ? 1 : startX;
      let y = startY == null ? 1 : startY;
      let dir = 0; // 0 east, 1 north, 2 west, 3 south
      const path = [[x, y]];
      let crashed = false;
      for (let i = 0; i < Math.round(repeat) && !crashed; i++) {
        for (let k = 0; k < Math.round(forward); k++) {
          const nx = x + [1, 0, -1, 0][dir];
          const ny = y + [0, 1, 0, -1][dir];
          if (nx < 1 || ny < 1 || nx > W || ny > H) {
            crashed = true;
            break;
          }
          x = nx;
          y = ny;
          path.push([x, y]);
        }
        if (!crashed) dir = (dir + (turn === 1 ? 1 : turn === 2 ? 3 : 0)) % 4;
      }
      return { x, y, facing: ["east", "north", "west", "south"][dir], path, moves: path.length - 1, crashed };
    },
    /** A box l × w × h → { surface (area of all six faces), volume, base (l × w), front (l × h), side (w × h) }. */
    cuboid(l, w, h) {
      return { surface: 2 * (l * w + l * h + w * h), volume: l * w * h, base: l * w, front: l * h, side: w * h };
    },
    /** A ratio a : b at the amount x of the first quantity → { y (= x × b ÷ a), unitRate (b ÷ a), scale (x ÷ a) }. */
    ratio(a, b, x) {
      return { y: (x * b) / a, unitRate: b / a, scale: x / a };
    },
    /**
     * Samples from a large population in which `percent` % are red: `count` samples of `size` each (always the
     * same draws for the same numbers).
     * → { results (% red in each sample), last (the newest sample's %), mean (of the sample results),
     *     standardError (= √(p(1 − p) ÷ size) in % points), low, high (95 % interval around the last sample:
     *     last ± 1.96 × √(last(100 − last) ÷ size)), contains (does that interval include `percent`?) }
     */
    sampling(percent, size, count) {
      const p = Math.max(0, Math.min(100, percent)) / 100;
      const n = Math.max(1, Math.round(size));
      const k = Math.max(1, Math.round(count));
      let seed = 12345 + Math.round(percent) * 7 + n * 131;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      for (let i = 0; i < 5; i++) rnd(); // the first few numbers of this generator are not well mixed
      const results = [];
      for (let i = 0; i < k; i++) {
        let red = 0;
        for (let j = 0; j < n; j++) if (rnd() < p) red++;
        results.push((100 * red) / n);
      }
      const last = results[k - 1];
      const half = 1.96 * Math.sqrt((last * (100 - last)) / n);
      const low = Math.max(0, last - half);
      const high = Math.min(100, last + half);
      return { results, last, mean: results.reduce((a, b) => a + b, 0) / k, standardError: 100 * Math.sqrt((p * (1 - p)) / n), low, high, contains: low <= percent && percent <= high };
    },
    /** Straight-line fit of points [[x, y], …]: { slope, intercept, r (correlation, −1 to 1) }. */
    correlation(points) {
      const n = points.length;
      if (n < 2) return { slope: 0, intercept: n ? points[0][1] : 0, r: 0 };
      const mx = points.reduce((sum, p) => sum + p[0], 0) / n;
      const my = points.reduce((sum, p) => sum + p[1], 0) / n;
      let sxx = 0;
      let syy = 0;
      let sxy = 0;
      for (const [x, y] of points) {
        sxx += (x - mx) * (x - mx);
        syy += (y - my) * (y - my);
        sxy += (x - mx) * (y - my);
      }
      const slope = sxx ? sxy / sxx : 0;
      return { slope, intercept: my - slope * mx, r: sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0 };
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
