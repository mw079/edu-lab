/* simkit.phScale, simkit.gravityPair, simkit.solarSystem, simkit.starLife, simkit.tippingPoint. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=110, y=250 (left end and middle of the bar), w=780, pH=3 (0–14), dilutions=0 (tenfold dilutions
   *         with water), showValue=true (the sample's pH and H+ concentration), showExamples=true (household
   *         substances above the bar), drag: { pH: app.link("key") } (the student drags the sample along the scale) }
   * Returns { update({ pH, dilutions }), show({ value, examples }), values() }
   * values() -> { pH, kind, exponent, timesNeutral }   (see simkit.physics.ph)
   */
  kit.phScale = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 250, w: 780, pH: 3, dilutions: 0, showValue: true, showExamples: true }, opts);
    const g = stage.layer({ class: "simkit-ph" });
    const X = (v) => o.x + (kit.clamp(v, 0, 14) / 14) * o.w;
    const COLORS = ["#d7352b", "#e25a2c", "#ec7f2d", "#f2a431", "#f5c93a", "#e6d943", "#b9d14a", "#6fbf5a", "#3fae7c", "#2f9c9f", "#3a82bd", "#4a67c2", "#5a50b8", "#6a3fa6", "#6f2f8f"];
    const EXAMPLES = [[1, "stomach acid"], [2, "lemon juice"], [3, "vinegar"], [5, "coffee"], [7, "pure water"], [9, "baking soda"], [10, "soap"], [13, "bleach"]];
    const cell = o.w / 15;
    for (let i = 0; i <= 14; i++) {
      kit.el("rect", { x: X(i) - cell / 2, y: o.y - 28, width: cell + 0.5, height: 56, fill: COLORS[i] }, g);
      kit.el("text", { x: X(i), y: o.y + 8, "text-anchor": "middle", class: "simkit-label", fill: "#fff", text: String(i) }, g);
    }
    kit.el("text", { x: X(0) - cell / 2, y: o.y + 58, class: "simkit-tick", text: "← more acidic" }, g);
    kit.el("text", { x: X(14) + cell / 2, y: o.y + 58, "text-anchor": "end", class: "simkit-tick", text: "more basic →" }, g);
    const examples = kit.el("g", null, g);
    const dynamic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const move = o.drag && o.drag.pH;
    const dragger = kit.drag(stage, handle, move, (p) => move(kit.clamp(((p.x - o.x) / o.w) * 14, 0, 14)));
    const sol = () => kit.physics.ph(o.pH, o.dilutions);

    function draw() {
      examples.textContent = "";
      if (o.showExamples)
        EXAMPLES.forEach(([v, name], i) => {
          const high = i % 2 === 0; // two rows, so neighbouring names never touch
          kit.el("line", { x1: X(v), y1: o.y - 30, x2: X(v), y2: o.y - (high ? 82 : 46), stroke: kit.colors.steel, "stroke-width": 1 }, examples);
          kit.el("text", { x: X(v), y: o.y - (high ? 90 : 54), "text-anchor": "middle", class: "simkit-tick", text: name }, examples);
        });
      dynamic.textContent = "";
      const s = sol();
      const px = X(s.pH);
      // The sample: a drop under the bar pointing at its place on the scale.
      kit.el("path", { d: `M ${px} ${o.y + 34} l 16 30 a 16 16 0 1 1 -32 0 z`, fill: COLORS[kit.clamp(Math.round(s.pH), 0, 14)], stroke: kit.colors.ink, "stroke-width": 2, "stroke-linejoin": "round" }, dynamic);
      const SUP = { "-": "⁻", ".": "·", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
      const exp = String(Math.round(-s.pH * 10) / 10).split("").map((ch) => SUP[ch] || ch).join("");
      kit.el("text", { x: o.x + o.w / 2, y: o.y + 140, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: o.showValue ? `sample: pH ${kit.fmt(s.pH, s.pH % 1 ? 1 : 0)} · ${s.kind}` : "sample: pH ?" }, dynamic);
      const diluted = o.dilutions ? ` · diluted tenfold ${kit.fmt(o.dilutions, 0)} time${o.dilutions === 1 ? "" : "s"}` : "";
      kit.el("text", { x: o.x + o.w / 2, y: o.y + 168, "text-anchor": "middle", class: "simkit-tick", text: (o.showValue ? `H⁺ concentration 10${exp} mol/L` : "H⁺ concentration ?") + diluted }, dynamic);
      handle.textContent = "";
      if (kit.linked(move) && !o.dilutions) kit.grip(handle, px, o.y + 62, 24);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        if (next.pH != null) o.pH = next.pH;
        if (next.dilutions != null) o.dilutions = next.dilutions;
        draw();
      },
      /** show({ value: false }) writes "pH ?" (the drop still points at its place); show({ examples: false }) removes the household names. */
      show(which) {
        if (which.value != null) o.showValue = which.value;
        if (which.examples != null) o.showExamples = which.examples;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=500, y=270 (midpoint between the two bodies), pxPerUnit=60 (px per 10^8 m), m1=6, m2=1 (10^24 kg),
   *         r=4 (10^8 m between the centres, 1–10), label1="planet", label2="moon", showValues=true,
   *         drag: { r: app.link("key") } (the student drags either body sideways to change the distance) }
   * Returns { update({ m1, m2, r }), show({ m1, m2, r, force }), values() }
   * values() -> { force (10^20 N) }   (see simkit.physics.gravity)
   */
  kit.gravityPair = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 270, pxPerUnit: 60, m1: 6, m2: 1, r: 4, label1: "planet", label2: "moon", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-gravity" });
    const shown = { m1: o.showValues, m2: o.showValues, r: o.showValues, force: o.showValues };
    const pull = o.drag && o.drag.r;
    const sol = () => kit.physics.gravity(o.m1, o.m2, o.r);
    const bodies = [0, 1].map((i) => {
      const el = kit.el("g", null, g);
      const dragger = kit.drag(stage, el, pull, (p, start, from) => pull(from + ((i ? 1 : -1) * 2 * (p.x - start.x)) / o.pxPerUnit), () => o.r);
      return { el, dragger };
    });
    const rest = kit.el("g", null, g);

    function draw() {
      rest.textContent = "";
      const s = sol();
      const radius = (m) => 12 + Math.cbrt(Math.max(m, 0.05)) * 12;
      // At least 80 px between the surfaces, so large bodies close together never overlap.
      const half = Math.max((o.r * o.pxPerUnit) / 2, (radius(o.m1) + radius(o.m2)) / 2 + 40);
      // Each arrow stops before the midpoint, so it always points visibly at the other body.
      const room = half - Math.max(radius(o.m1), radius(o.m2)) - 6 - 8;
      const len = Math.max(20, Math.min(kit.clamp(s.force * 1.6, 26, 130), room));
      [[o.x - half, o.m1, o.label1, kit.colors.blue, "m1", 1], [o.x + half, o.m2, o.label2, kit.colors.steel, "m2", -1]].forEach(([cx, m, label, color, key, dir], i) => {
        const R = radius(m);
        const b = bodies[i];
        b.el.textContent = "";
        if (kit.linked(pull)) kit.grip(b.el, cx, o.y, R + 12);
        b.dragger.refresh();
        kit.el("circle", { cx, cy: o.y, r: R, fill: color, stroke: kit.colors.ink, "stroke-width": 2 }, b.el);
        // Each body is pulled towards the other with the same force.
        kit.arrowShape(rest, cx + dir * (R + 6), o.y, cx + dir * (R + 6 + len), o.y, { color: kit.colors.red, width: 6, head: 14 });
        // Close bodies: the two label columns stay at least 104 px apart (each label is up to ~90 px wide).
        const lx = i === 0 ? Math.min(cx, o.x - 52) : Math.max(cx, o.x + 52);
        kit.el("text", { x: lx, y: o.y - R - 44, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: label }, rest);
        kit.el("text", { x: lx, y: o.y - R - 22, "text-anchor": "middle", class: "simkit-tick", text: shown[key] ? `${kit.fmt(m, m % 1 ? 1 : 0)} × 10²⁴ kg` : "? × 10²⁴ kg" }, rest);
      });
      const by = o.y + 96;
      kit.el("path", { d: `M ${o.x - half} ${by - 8} v 8 h ${2 * half} v -8`, fill: "none", stroke: kit.colors.ink, "stroke-width": 2 }, rest);
      kit.el("text", { x: o.x, y: by + 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: shown.r ? `r = ${kit.fmt(o.r, o.r % 1 ? 1 : 0)} × 10⁸ m` : "r = ?" }, rest);
      kit.el("text", { x: o.x, y: by + 62, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.red, text: shown.force ? `F = ${kit.fmt(s.force, s.force < 10 ? 2 : 1)} × 10²⁰ N on each` : "F = ?" }, rest);
    }

    draw();

    return {
      update(next) {
        for (const key of ["m1", "m2", "r"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** Show or hide single written values, e.g. show({ force: false }) in a step that asks for the force. */
      show(which) {
        for (const key of ["m1", "m2", "r", "force"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=300, y=280 (the Sun), planet=3 (1 Mercury … 8 Neptune: the one that is named), years=0 (time passed),
   *         showValues=true (distance and length of the year of the chosen planet),
   *         click: { planet: app.link("key") } (the student clicks a planet to choose it) }
   * Distances are squeezed so that all eight orbits fit (the real distances are in the numbers).
   * Returns { update({ planet, years }), show({ values }), values() }
   * values() -> { name, a (AU), period (years), speed (km/s), orbits (completed in `years`) }   (see simkit.physics.planet)
   */
  kit.solarSystem = function (stage, opts) {
    const o = Object.assign({ x: 300, y: 280, planet: 3, years: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-solar" });
    const COLORS = ["#9a9a9a", "#d9b56b", "#4a7fe0", "#c9603f", "#d4a373", "#e0c98a", "#8fd0d6", "#4f6fd8"];
    const SIZES = [5, 8, 8, 6, 15, 13, 10, 10];
    const R = (i) => 44 + i * 27; // even spacing: the picture shows the order, the numbers give the distances
    const sol = () => kit.physics.planet(o.planet, o.years);

    function draw() {
      g.textContent = "";
      const chosen = kit.clamp(Math.round(o.planet), 1, 8) - 1;
      kit.el("circle", { cx: o.x, cy: o.y, r: 22, fill: kit.colors.yellow, stroke: kit.colors.orange, "stroke-width": 3 }, g);
      kit.physics.planets.forEach((p, i) => {
        kit.el("circle", { cx: o.x, cy: o.y, r: R(i), fill: "none", stroke: i === chosen ? kit.colors.ink : kit.colors.line, "stroke-width": i === chosen ? 2 : 1 }, g);
        // Each planet starts at its own place on its orbit, so they are spread around the Sun.
        const angle = (i * 2.4) % (2 * Math.PI) + (2 * Math.PI * o.years) / Math.pow(p.a, 1.5);
        const px = o.x + R(i) * Math.cos(angle);
        const py = o.y - R(i) * Math.sin(angle);
        const body = kit.el("g", null, g);
        const link = o.click && o.click.planet;
        if (i === chosen) kit.el("circle", { cx: px, cy: py, r: SIZES[i] + 7, fill: "none", stroke: kit.colors.purple, "stroke-width": 3 }, body);
        kit.el("circle", { cx: px, cy: py, r: Math.max(SIZES[i], 13), fill: "#fff", "fill-opacity": 0.01 }, body); // a target big enough to click
        kit.el("circle", { cx: px, cy: py, r: SIZES[i], fill: COLORS[i], stroke: kit.colors.ink, "stroke-width": 1.5 }, body);
        if (link) kit.click(body, link, () => link(i + 1));
      });
      const s = sol();
      const lx = o.x + R(7) + 70;
      kit.el("text", { x: lx, y: o.y - 90, class: "simkit-label", style: "font-size: 24px", fill: kit.colors.ink, text: s.name }, g);
      kit.el("text", { x: lx, y: o.y - 56, class: "simkit-tick", text: `planet ${chosen + 1} from the Sun` }, g);
      const rows = o.showValues
        ? [`distance from the Sun: ${kit.fmt(s.a, 2)} AU`, `one orbit (its year): ${kit.fmt(s.period, s.period < 10 ? 2 : 1)} Earth years`, `speed: ${kit.fmt(s.speed, 1)} km/s`]
        : ["distance from the Sun: ?", "one orbit (its year): ?", "speed: ?"];
      rows.forEach((text, i) => kit.el("text", { x: lx, y: o.y - 14 + i * 32, class: "simkit-label", fill: kit.colors.ink, text }, g));
      kit.el("text", { x: lx, y: o.y + 100, class: "simkit-tick", text: `after ${kit.fmt(o.years, o.years % 1 ? 1 : 0)} Earth year${o.years === 1 ? "" : "s"}${o.showValues && o.years ? `: ${kit.fmt(s.orbits, 2)} orbits` : ""}` }, g);
    }

    draw();

    return {
      update(next) {
        if (next.planet != null) o.planet = next.planet;
        if (next.years != null) o.years = next.years;
        draw();
      },
      /** show({ values: false }) writes "?" for the chosen planet's distance, year and speed. */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=500, y=240 (centre of the row), mass=1 (Suns, 0.5–30), stage=1 (0 nebula, 1 main sequence,
   *         2 red giant or supergiant, 3 planetary nebula or supernova, 4 what is left), showNames=true
   *         (false: stages after the current one are named "?"), showValues=true (the lifetime),
   *         click: { stage: app.link("key") } (the student clicks a stage to go to it) }
   * Returns { update({ mass, stage }), show({ names, values }), values() }
   * values() -> { lifetime (billion years), temperature (K), massive, fate, stages, name }   (see simkit.physics.star)
   */
  kit.starLife = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 240, mass: 1, stage: 1, showNames: true, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-star" });
    const sol = () => kit.physics.star(o.mass, o.stage);
    const starColor = (T) => (T < 3700 ? "#e8735f" : T < 5200 ? "#f08c2e" : T < 6500 ? "#f2c14e" : T < 9000 ? "#fbf3d6" : T < 15000 ? "#cfe0ff" : "#8fb2ff");

    function draw() {
      g.textContent = "";
      const s = sol();
      const now = kit.clamp(Math.round(o.stage), 0, 4);
      const gap = 180;
      const big = kit.clamp(18 + Math.sqrt(o.mass) * 9, 20, 46);
      s.stages.forEach((name, i) => {
        const cx = o.x + (i - 2) * gap;
        const cell = kit.el("g", { opacity: i === now ? 1 : 0.4 }, g);
        kit.el("circle", { cx, cy: o.y, r: 74, fill: "#1d2233" }, cell);
        if (i === 0) for (const [dx, dy, r] of [[-20, 6, 26], [14, -12, 30], [22, 18, 22], [-8, -22, 18]]) kit.el("circle", { cx: cx + dx, cy: o.y + dy, r, fill: "#9aa7d8", "fill-opacity": 0.45 }, cell);
        if (i === 1) kit.el("circle", { cx, cy: o.y, r: big, fill: starColor(s.temperature) }, cell);
        if (i === 2) kit.el("circle", { cx, cy: o.y, r: s.massive ? 68 : 58, fill: "#e8735f" }, cell);
        if (i === 3) {
          if (s.massive) for (let k = 0; k < 12; k++) kit.el("line", { x1: cx, y1: o.y, x2: cx + 66 * Math.cos((k * Math.PI) / 6), y2: o.y + 66 * Math.sin((k * Math.PI) / 6), stroke: k % 2 ? "#f2c14e" : "#fff", "stroke-width": 5, "stroke-linecap": "round" }, cell);
          else kit.el("circle", { cx, cy: o.y, r: 54, fill: "none", stroke: "#8fd0d6", "stroke-width": 10, "stroke-opacity": 0.7 }, cell);
          kit.el("circle", { cx, cy: o.y, r: 8, fill: "#fff" }, cell);
        }
        if (i === 4) {
          if (s.fate === "black hole") {
            kit.el("circle", { cx, cy: o.y, r: 30, fill: "none", stroke: "#f08c2e", "stroke-width": 6 }, cell);
            kit.el("circle", { cx, cy: o.y, r: 22, fill: "#000" }, cell);
          } else kit.el("circle", { cx, cy: o.y, r: s.fate === "neutron star" ? 7 : 12, fill: s.fate === "neutron star" ? "#cfe0ff" : "#fff" }, cell);
        }
        if (i < 4) kit.arrowShape(g, cx + 82, o.y, cx + gap - 82, o.y, { color: kit.colors.steel, width: 3, head: 9 });
        const known = o.showNames || i <= now;
        kit.el("text", { x: cx, y: o.y + 104, "text-anchor": "middle", class: "simkit-label", fill: i === now ? kit.colors.ink : kit.colors.muted, text: known ? name : "?" }, g);
        const link = o.click && o.click.stage;
        if (link) kit.click(cell, link, () => link(i));
        if (i === now) kit.el("circle", { cx, cy: o.y, r: 82, fill: "none", stroke: kit.colors.purple, "stroke-width": 3, "pointer-events": "none" }, g);
      });
      kit.el("text", { x: o.x, y: o.y - 120, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: `a star of ${kit.fmt(o.mass, o.mass % 1 ? 1 : 0)} × the Sun's mass` }, g);
      const life = s.lifetime >= 1 ? `${kit.fmt(s.lifetime, s.lifetime < 10 ? 1 : 0)} billion years` : `${kit.fmt(s.lifetime * 1000, 0)} million years`;
      kit.el("text", { x: o.x, y: o.y + 150, "text-anchor": "middle", class: "simkit-tick", text: o.showValues ? `shines steadily (main sequence) for about ${life}` : "shines steadily (main sequence) for about ?" }, g);
    }

    draw();

    return {
      update(next) {
        if (next.mass != null) o.mass = next.mass;
        if (next.stage != null) o.stage = next.stage;
        draw();
      },
      /** show({ names: false }) names later stages "?" (hides how the star ends); show({ values: false }) hides the lifetime. */
      show(which) {
        if (which.names != null) o.showNames = which.names;
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=90, y=90, w=380, h=300 (the picture), heating=2 (0–10), startIce=1 (1 = starts with ice, 0 = without),
   *         showValues=true (ice cover and temperature), showGraph=true (ice cover against heating, both paths),
   *         drag: { heating: app.link("key") } (the student drags the marker along the graph's heating axis) }
   * Returns { update({ heating, startIce }), show({ values, graph }), values() }
   * values() -> { ice (%), state, temperature (°C) }   (see simkit.physics.tipping)
   */
  kit.tippingPoint = function (stage, opts) {
    const o = Object.assign({ x: 90, y: 90, w: 380, h: 300, heating: 2, startIce: 1, showValues: true, showGraph: true }, opts);
    const g = stage.layer({ class: "simkit-tipping" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const gx = o.x + o.w + 110;
    const gw = 330;
    const gy = o.y + 20;
    const gh = o.h - 60;
    const HX = (h) => gx + (kit.clamp(h, 0, 10) / 10) * gw;
    const IY = (ice) => gy + gh - (ice / 100) * gh;
    const push = o.drag && o.drag.heating;
    const dragger = kit.drag(stage, handle, push, (p) => push(kit.clamp(((p.x - gx) / gw) * 10, 0, 10)));
    const sol = () => kit.physics.tipping(o.heating, o.startIce);

    function draw() {
      pic.textContent = "";
      const s = sol();
      // Picture: sea and land under a sky, an ice sheet whose width follows the ice cover, sunlight in and reflected.
      kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 12, fill: "#cfe6fa" }, pic);
      kit.el("rect", { x: o.x, y: o.y + o.h - 70, width: o.w, height: 70, fill: "#3f6fb5" }, pic);
      const iceW = (s.ice / 100) * (o.w - 40);
      if (iceW > 0) kit.el("rect", { x: o.x + 20, y: o.y + o.h - 96, width: iceW, height: 34, rx: 8, fill: "#fff", stroke: "#b9c9d8", "stroke-width": 2 }, pic);
      kit.el("circle", { cx: o.x + o.w - 54, cy: o.y + 52, r: 26, fill: kit.colors.yellow, stroke: kit.colors.orange, "stroke-width": 3 }, pic);
      for (let i = 0; i < 4; i++) {
        const ax = o.x + 60 + i * 80;
        const onIce = ax < o.x + 20 + iceW;
        kit.arrowShape(pic, ax + 26, o.y + 60, ax, o.y + o.h - 100, { color: kit.colors.orange, width: 4, head: 11 });
        if (onIce) kit.arrowShape(pic, ax - 4, o.y + o.h - 104, ax - 30, o.y + 64, { color: kit.colors.orange, width: 3, head: 9 });
      }
      kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 30, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `ice cover ${kit.fmt(s.ice, 0)}% · ${kit.fmt(s.temperature, 1).replace("-", "−")} °C` : "ice cover ? · ? °C" }, pic);
      kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 56, "text-anchor": "middle", class: "simkit-tick", text: `heating ${kit.fmt(o.heating, o.heating % 1 ? 1 : 0)} · started ${Number(o.startIce) ? "with" : "without"} ice · ice reflects sunlight back` }, pic);
      handle.textContent = "";
      if (!o.showGraph) return dragger.refresh();
      kit.el("line", { x1: gx, y1: gy, x2: gx, y2: gy + gh, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      kit.el("line", { x1: gx, y1: gy + gh, x2: gx + gw, y2: gy + gh, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      for (let h = 0; h <= 10; h += 2) kit.el("text", { x: HX(h), y: gy + gh + 22, "text-anchor": "middle", class: "simkit-tick", text: String(h) }, pic);
      for (let v = 0; v <= 100; v += 50) kit.el("text", { x: gx - 10, y: IY(v) + 5, "text-anchor": "end", class: "simkit-tick", text: `${v}%` }, pic);
      kit.el("text", { x: gx + gw / 2, y: gy + gh + 48, "text-anchor": "middle", class: "simkit-tick", text: "heating" }, pic);
      kit.el("text", { x: gx, y: gy - 14, class: "simkit-tick", text: "ice cover" }, pic);
      // Two paths: with ice (down to the collapse at 7) and without ice (it returns only below 3).
      kit.el("path", { d: `M ${HX(0)} ${IY(100)} L ${HX(7)} ${IY(58)}`, fill: "none", stroke: kit.colors.blue, "stroke-width": 4 }, pic);
      kit.el("path", { d: `M ${HX(7)} ${IY(58)} L ${HX(7)} ${IY(0)}`, fill: "none", stroke: kit.colors.blue, "stroke-width": 2, "stroke-dasharray": "6 5" }, pic);
      kit.el("path", { d: `M ${HX(3)} ${IY(0)} L ${HX(10)} ${IY(0)}`, fill: "none", stroke: kit.colors.red, "stroke-width": 4 }, pic);
      kit.el("path", { d: `M ${HX(3)} ${IY(0)} L ${HX(3)} ${IY(82)}`, fill: "none", stroke: kit.colors.red, "stroke-width": 2, "stroke-dasharray": "6 5" }, pic);
      kit.el("circle", { cx: HX(o.heating), cy: IY(s.ice), r: 9, fill: kit.colors.purple, stroke: "#fff", "stroke-width": 2 }, pic);
      if (kit.linked(push)) kit.grip(handle, HX(o.heating), IY(s.ice), 24);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        if (next.heating != null) o.heating = next.heating;
        if (next.startIce != null) o.startIce = next.startIce;
        draw();
      },
      /** show({ values: false }) writes "?" for ice cover and temperature; show({ graph: false }) removes the graph. */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        if (which.graph != null) o.showGraph = which.graph;
        draw();
      },
      values: sol,
    };
  };
})();
