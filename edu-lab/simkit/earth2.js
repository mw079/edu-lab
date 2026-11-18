/* simkit.oceanGyre, simkit.feedbackLoop, simkit.earthquake, simkit.heatEngine. */
(function () {
  "use strict";
  const kit = window.simkit;
  const whole = (v) => kit.fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1);

  /**
   * opts: { x=500, y=250 (centre of the ocean), wind=5 (0–10), north=1 (1 = northern hemisphere, 0 = southern),
   *         showValues=true (speed and time for one lap),
   *         drag: { wind: app.link("key") } (the student stretches the wind arrow) }
   * Returns { update({ wind, north }), show({ values }), values() }
   * values() -> { direction, speed (km/day), lapYears, west, east }   (see simkit.physics.gyre)
   */
  kit.oceanGyre = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 250, wind: 5, north: 1, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-gyre" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const W = 300; // half width of the ocean
    const H = 170;
    const blow = o.drag && o.drag.wind;
    const windX = () => o.x - 60;
    const dragger = kit.drag(stage, handle, blow, (p) => blow(kit.clamp((p.x - windX() - 20) / 14, 0, 10)));
    const sol = () => kit.physics.gyre(o.wind, o.north);

    function draw() {
      pic.textContent = "";
      const s = sol();
      const north = Number(o.north) ? 1 : 0;
      kit.el("rect", { x: o.x - W, y: o.y - H, width: 2 * W, height: 2 * H, fill: "#cfe6fa" }, pic);
      for (const side of [-1, 1]) {
        kit.el("rect", { x: side < 0 ? o.x - W - 90 : o.x + W, y: o.y - H, width: 90, height: 2 * H, fill: "#d9cba3", stroke: "#b9a777", "stroke-width": 2 }, pic);
        kit.el("text", { x: o.x + side * (W + 45), y: o.y + 5, "text-anchor": "middle", class: "simkit-tick", text: "land" }, pic);
      }
      // The pole side is at the top in the north and at the bottom in the south.
      const poleY = north ? o.y - H : o.y + H;
      const eqY = north ? o.y + H : o.y - H;
      kit.el("line", { x1: o.x - W, y1: eqY, x2: o.x + W, y2: eqY, stroke: kit.colors.orange, "stroke-width": 3, "stroke-dasharray": "8 6" }, pic);
      kit.el("text", { x: o.x - W - 86, y: eqY + (north ? 26 : -14), class: "simkit-label", style: "font-size: 14px; font-weight: 500", fill: kit.colors.orange, text: "equator (warm)" }, pic);
      kit.el("text", { x: o.x - W - 86, y: poleY + (north ? -14 : 26), class: "simkit-label", style: "font-size: 14px; font-weight: 500", fill: kit.colors.blue, text: `towards the ${north ? "north" : "south"} pole (cold)` }, pic);
      // The loop: four arcs with arrowheads. Screen angles grow clockwise; the north turns clockwise.
      const rx = 200;
      const ry = 105;
      const dir = north ? 1 : -1;
      const width = 2 + 0.7 * kit.clamp(o.wind, 0, 10);
      const at = (deg) => [o.x + rx * Math.cos((deg * Math.PI) / 180), o.y + ry * Math.sin((deg * Math.PI) / 180)];
      // Arc centres: 180° is the west side, 0° the east side.
      [[180, kit.colors.red], [0, kit.colors.blue], [270, kit.colors.steel], [90, kit.colors.steel]].forEach(([mid, color]) => {
        const pts = [];
        for (let t = -36; t <= 28; t += 4) pts.push(at(mid + dir * t));
        kit.el("polyline", { points: pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "), fill: "none", stroke: color, "stroke-width": width, "stroke-linecap": "round" }, pic);
        if (o.wind > 0) {
          const [ax, ay] = at(mid + dir * 28);
          const [bx, by] = at(mid + dir * 38);
          kit.arrowShape(pic, ax, ay, bx, by, { color, width, head: 10 + width });
        }
      });
      kit.el("text", { x: o.x - rx + 24, y: o.y + 5, class: "simkit-label", fill: kit.colors.red, text: "warm current" }, pic);
      kit.el("text", { x: o.x + rx - 24, y: o.y + 5, "text-anchor": "end", class: "simkit-label", fill: kit.colors.blue, text: "cold current" }, pic);
      // Winds: westerlies on the pole side blow east, trade winds near the equator blow west.
      const len = 20 + 14 * kit.clamp(o.wind, 0, 10);
      const wy = (poleY + o.y) / 2 + (north ? -52 : 52);
      const ty = (eqY + o.y) / 2 + (north ? 52 : -52);
      kit.arrowShape(pic, windX(), wy, windX() + len, wy, { color: kit.colors.purple, width: 6, head: 14 });
      kit.arrowShape(pic, o.x + 60, ty, o.x + 60 - len, ty, { color: kit.colors.purple, width: 6, head: 14 });
      kit.el("text", { x: windX() - 10, y: wy + 5, "text-anchor": "end", class: "simkit-label", style: "font-size: 14px; font-weight: 500", fill: kit.colors.purple, text: "wind" }, pic);
      kit.el("text", { x: o.x + 70, y: ty + 5, class: "simkit-label", style: "font-size: 14px; font-weight: 500", fill: kit.colors.purple, text: "wind" }, pic);
      const lap = s.lapYears == null ? "no current" : `one lap in ${kit.fmt(s.lapYears, s.lapYears < 10 ? 1 : 0)} years`;
      kit.el("text", { x: o.x, y: o.y + H + 62, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `the water turns ${s.direction} · ${kit.fmt(s.speed, 0)} km per day · ${lap}` : "the water turns ? · ? km per day" }, pic);
      handle.textContent = "";
      if (kit.linked(blow)) kit.grip(handle, windX() + len, wy, 22);
      else kit.el("circle", { cx: windX() + len, cy: wy, r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        if (next.wind != null) o.wind = next.wind;
        if (next.north != null) o.north = next.north;
        draw();
      },
      /** show({ values: false }) writes "?" for the turning direction, the speed and the lap time (the arrows stay). */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=60, y=90 (top-left), push=1 (°C of first warming, 0.5–2), gain=0.5 (how much of each change comes
   *         back per round, −0.8 … 1.2), rounds=4 (0–10), labels=["warmer air", "less ice", "more sunlight absorbed"],
   *         showValues=true (the total and where it settles),
   *         drag: { gain: app.link("key") } (the student drags the top of the second bar) }
   * Returns { update({ push, gain, rounds }), show({ values }), values() }
   * values() -> { total (°C), series, last, limit (null if it never settles), kind, runaway }   (see simkit.physics.feedback)
   */
  kit.feedbackLoop = function (stage, opts) {
    const o = Object.assign({ x: 60, y: 90, push: 1, gain: 0.5, rounds: 4, labels: ["warmer air", "less ice", "more sunlight absorbed"], showValues: true }, opts);
    const g = stage.layer({ class: "simkit-feedback" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const gx = o.x + 470;
    const gw = 400;
    const gh = 300;
    const MAX = 6;
    const Y = (v) => o.y + gh - (kit.clamp(v, 0, MAX) / MAX) * gh;
    const BX = (k) => gx + 24 + k * ((gw - 30) / 11);
    const turn = o.drag && o.drag.gain;
    const dragger = kit.drag(stage, handle, turn, (p) => turn(kit.clamp((((o.y + gh - p.y) / gh) * MAX) / o.push - 1, -0.8, 1.2)));
    const sol = () => kit.physics.feedback(o.push, o.gain, o.rounds);

    function draw() {
      pic.textContent = "";
      const s = sol();
      // The loop: three boxes on a triangle with arrows from each to the next.
      const nodes = [[o.x + 200, o.y + 20], [o.x + 330, o.y + 230], [o.x + 70, o.y + 230]];
      const color = s.kind === "balancing" ? kit.colors.blue : kit.colors.red;
      nodes.forEach(([nx, ny], i) => {
        const [mx, my] = nodes[(i + 1) % 3];
        const d = Math.hypot(mx - nx, my - ny);
        const ux = (mx - nx) / d;
        const uy = (my - ny) / d;
        const out = Math.min(108 / Math.abs(ux || 1e-9), 32 / Math.abs(uy || 1e-9)); // leave each box at its edge
        kit.arrowShape(pic, nx + ux * out, ny + uy * out, mx - ux * out, my - uy * out, { color, width: 5, head: 13 });
      });
      nodes.forEach(([nx, ny], i) => {
        kit.el("rect", { x: nx - 100, y: ny - 24, width: 200, height: 48, rx: 12, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 2 }, pic);
        kit.el("text", { x: nx, y: ny + 6, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.labels[i] }, pic);
      });
      kit.el("text", { x: o.x + 200, y: o.y + 140, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: color, text: `× ${kit.fmt(o.gain, 1)}` }, pic);
      kit.el("text", { x: o.x + 200, y: o.y + 166, "text-anchor": "middle", class: "simkit-tick", text: "comes back each round" }, pic);
      kit.el("text", { x: o.x + 200, y: o.y + 300, "text-anchor": "middle", class: "simkit-label", fill: color, text: s.kind === "none" ? "no feedback" : `${s.kind} loop` }, pic);
      // Total warming after each round.
      kit.el("line", { x1: gx, y1: o.y, x2: gx, y2: o.y + gh, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      kit.el("line", { x1: gx, y1: o.y + gh, x2: gx + gw, y2: o.y + gh, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      for (let v = 0; v <= MAX; v += 2) {
        kit.el("line", { x1: gx, y1: Y(v), x2: gx + gw, y2: Y(v), stroke: kit.colors.line, "stroke-width": 1 }, pic);
        kit.el("text", { x: gx - 10, y: Y(v) + 5, "text-anchor": "end", class: "simkit-tick", text: String(v) }, pic);
      }
      kit.el("text", { x: gx, y: o.y - 26, class: "simkit-tick", text: "total warming (°C)" }, pic); // above the "↑" marks
      kit.el("text", { x: gx + gw / 2, y: o.y + gh + 48, "text-anchor": "middle", class: "simkit-tick", text: "rounds of the loop" }, pic);
      const bw = 22;
      s.series.forEach((v, k) => {
        kit.el("rect", { x: BX(k) - bw / 2, y: Y(v), width: bw, height: Math.max(0, o.y + gh - Y(v)), fill: k === 0 ? kit.colors.steel : color, "fill-opacity": 0.75 }, pic);
        if (v > MAX) kit.el("text", { x: BX(k), y: o.y - 2, "text-anchor": "middle", class: "simkit-label", style: "font-size: 14px; font-weight: 500", fill: color, text: "↑" }, pic);
        kit.el("text", { x: BX(k), y: o.y + gh + 22, "text-anchor": "middle", class: "simkit-tick", text: String(k) }, pic);
      });
      if (o.showValues && s.limit != null && s.limit <= MAX && s.kind !== "none") kit.el("line", { x1: gx, y1: Y(s.limit), x2: gx + gw, y2: Y(s.limit), stroke: kit.colors.ink, "stroke-width": 2, "stroke-dasharray": "6 6" }, pic);
      const end = s.limit == null ? "it never settles: it keeps growing" : `it settles at ${kit.fmt(s.limit, 2)} °C`;
      kit.el("text", { x: gx + gw / 2, y: o.y + gh + 82, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `after ${s.series.length - 1} rounds: ${kit.fmt(s.total, 2)} °C · ${end}` : `after ${s.series.length - 1} rounds: ? °C` }, pic);
      handle.textContent = "";
      if (s.series.length > 1) {
        if (kit.linked(turn)) kit.grip(handle, BX(1), Y(s.series[1]), 22);
        else kit.el("circle", { cx: BX(1), cy: Y(s.series[1]), r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      }
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["push", "gain", "rounds"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) writes "?" for the total and removes the line where it settles (the bars stay). */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=80, y=70 (top-left), w=840, distance=300 (km from the earthquake to the station, 60–600),
   *         magnitude=5 (3–8), showValues=true,
   *         drag: { distance: app.link("key") } (the student drags the station along the ground) }
   * Returns { update({ distance, magnitude }), show({ distance, lag }), values() }
   * values() -> { tP, tS, lag (seconds), shaking, energy (× a magnitude 5 quake) }   (see simkit.physics.quake)
   */
  kit.earthquake = function (stage, opts) {
    const o = Object.assign({ x: 80, y: 70, w: 840, distance: 300, magnitude: 5, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-quake" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const shown = { distance: o.showValues, lag: o.showValues };
    const DX = (d) => o.x + 30 + (kit.clamp(d, 0, 600) / 600) * (o.w - 90);
    const TX = (t) => o.x + (kit.clamp(t, 0, 220) / 220) * o.w;
    const groundY = o.y + 70;
    const base = o.y + 300;
    const carry = o.drag && o.drag.distance;
    const dragger = kit.drag(stage, handle, carry, (p) => carry(kit.clamp(((p.x - o.x - 30) / (o.w - 90)) * 600, 60, 600)));
    const sol = () => kit.physics.quake(o.distance, o.magnitude);

    function draw() {
      pic.textContent = "";
      const s = sol();
      // Ground with the earthquake on the left and the station at its distance.
      kit.el("rect", { x: o.x, y: groundY, width: o.w, height: 44, fill: "#d9cba3" }, pic);
      kit.el("line", { x1: o.x, y1: groundY, x2: o.x + o.w, y2: groundY, stroke: "#8a7a4d", "stroke-width": 3 }, pic);
      for (let r = 1; r <= 3; r++) kit.el("path", { d: `M ${DX(0) - r * 16} ${groundY + 22 + r * 5} A ${r * 16} ${r * 16} 0 0 1 ${DX(0) + r * 16} ${groundY + 22 + r * 5}`, fill: "none", stroke: kit.colors.red, "stroke-width": 2, "stroke-opacity": 1 - r * 0.22 }, pic);
      kit.el("circle", { cx: DX(0), cy: groundY + 26, r: 7, fill: kit.colors.red }, pic);
      // Written inside the ground, so the station (which stands on it) can never cover it.
      kit.el("text", { x: DX(0) + 60, y: groundY + 28, class: "simkit-label", fill: kit.colors.red, text: `earthquake · magnitude ${whole(o.magnitude)}` }, pic);
      if (shown.distance)
        for (let d = 100; d <= 600; d += 100) {
          kit.el("line", { x1: DX(d), y1: groundY + 44, x2: DX(d), y2: groundY + 52, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
          kit.el("text", { x: DX(d), y: groundY + 70, "text-anchor": "middle", class: "simkit-tick", text: `${d} km` }, pic);
        }
      const sx = DX(o.distance);
      kit.el("path", { d: `M ${sx - 20} ${groundY} v -24 l 20 -16 l 20 16 v 24 z`, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 2, "stroke-linejoin": "round" }, pic);
      kit.el("text", { x: sx, y: groundY - 50, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: shown.distance ? "station" : "station: ? km" }, pic);
      // The station's recording: P waves arrive first, the slower and bigger S waves later.
      kit.el("line", { x1: o.x, y1: base + 90, x2: o.x + o.w, y2: base + 90, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      for (let t = 0; t <= 220; t += 20) {
        kit.el("line", { x1: TX(t), y1: base + 90, x2: TX(t), y2: base + 98, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
        if (t % 40 === 0) kit.el("text", { x: TX(t), y: base + 116, "text-anchor": "middle", class: "simkit-tick", text: `${t} s` }, pic);
      }
      kit.el("text", { x: o.x + o.w, y: base + 140, "text-anchor": "end", class: "simkit-tick", text: "time after the earthquake" }, pic);
      const A = kit.clamp(11 * (o.magnitude - 2), 8, 68); // drawn on a squeezed scale: each magnitude step is really 10 × the shaking
      let d = "";
      for (let t = 0; t <= 220; t += 0.5) {
        let y = 0;
        if (t >= s.tP) y += 0.3 * A * Math.exp(-(t - s.tP) / 28) * Math.sin((2 * Math.PI * (t - s.tP)) / 3);
        if (t >= s.tS) y += A * Math.exp(-(t - s.tS) / 34) * Math.sin((2 * Math.PI * (t - s.tS)) / 5.5);
        d += `${t ? "L" : "M"} ${TX(t).toFixed(1)} ${(base - y).toFixed(1)} `;
      }
      kit.el("path", { d, fill: "none", stroke: kit.colors.ink, "stroke-width": 2, "stroke-linejoin": "round" }, pic);
      for (const [t, name, color] of [[s.tP, "P", kit.colors.blue], [s.tS, "S", kit.colors.red]]) {
        if (t > 220) continue;
        kit.el("line", { x1: TX(t), y1: base - 84, x2: TX(t), y2: base + 90, stroke: color, "stroke-width": 2, "stroke-dasharray": "6 5" }, pic);
        kit.el("text", { x: TX(t), y: base - 92, "text-anchor": "middle", class: "simkit-label", fill: color, text: name }, pic);
      }
      kit.el("text", { x: o.x, y: base - 124, class: "simkit-label", fill: kit.colors.ink, text: shown.lag ? `S arrives ${kit.fmt(s.lag, 0)} s after P` : "S arrives ? s after P" }, pic);
      handle.textContent = "";
      if (kit.linked(carry)) kit.grip(handle, sx, groundY - 18, 26);
      else kit.el("circle", { cx: sx, cy: groundY - 18, r: 26, fill: "#fff", "fill-opacity": 0.01 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        if (next.distance != null) o.distance = next.distance;
        if (next.magnitude != null) o.magnitude = next.magnitude;
        draw();
      },
      /** show({ distance: false }) removes the km marks (for "how far away?"); show({ lag: false }) writes "? s" (the recording stays). */
      show(which) {
        for (const key of ["distance", "lag"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=560, y=270 (centre of the engine), hot=600, cold=300 (kelvin, 100–1000), heat=1000 (J taken in),
   *         showValues=true, drag: { hot: app.link("key"), cold: app.link("key") } (the student drags the two
   *         markers on the thermometer) }
   * Returns { update({ hot, cold, heat }), show({ work, waste, efficiency }), values() }
   * values() -> { efficiency (%), work (J), waste (J) }   (see simkit.physics.heatEngine)
   */
  kit.heatEngine = function (stage, opts) {
    const o = Object.assign({ x: 560, y: 270, hot: 600, cold: 300, heat: 1000, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-engine" });
    const pic = kit.el("g", null, g);
    const tx = o.x - 400;
    const TY = (T) => o.y + 200 - (kit.clamp(T, 0, 1000) / 1000) * 400;
    const shown = { work: o.showValues, waste: o.showValues, efficiency: o.showValues };
    const handles = ["hot", "cold"].map((key) => {
      const el = kit.el("g", null, g);
      const link = o.drag && o.drag[key];
      return { key, el, link, dragger: kit.drag(stage, el, link, (p) => link(kit.clamp(((o.y + 200 - p.y) / 400) * 1000, 100, 1000))) };
    });
    const sol = () => kit.physics.heatEngine(o.hot, o.cold, o.heat);

    function draw() {
      pic.textContent = "";
      const s = sol();
      const part = o.heat > 0 ? s.work / o.heat : 0;
      // Hot place above, cold place below, the engine between them.
      kit.el("rect", { x: o.x - 140, y: o.y - 220, width: 280, height: 60, rx: 10, fill: kit.colors.red, "fill-opacity": 0.3, stroke: kit.colors.redDark, "stroke-width": 2 }, pic);
      kit.el("text", { x: o.x, y: o.y - 184, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `hot: ${kit.fmt(o.hot, 0)} K` }, pic);
      kit.el("rect", { x: o.x - 140, y: o.y + 160, width: 280, height: 60, rx: 10, fill: kit.colors.blue, "fill-opacity": 0.3, stroke: kit.colors.blueDark, "stroke-width": 2 }, pic);
      kit.el("text", { x: o.x, y: o.y + 196, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `cold: ${kit.fmt(o.cold, 0)} K` }, pic);
      // Arrow widths share the heat taken in: work + waste heat = heat in.
      kit.arrowShape(pic, o.x, o.y - 156, o.x, o.y - 62, { color: kit.colors.red, width: 30, head: 26 });
      if (s.waste > 0) kit.arrowShape(pic, o.x, o.y + 60, o.x, o.y + 154, { color: kit.colors.blue, width: Math.max(3, 30 * (1 - part)), head: Math.max(12, 26 * (1 - part)) });
      if (s.work > 0) kit.arrowShape(pic, o.x + 60, o.y, o.x + 170, o.y, { color: kit.colors.green, width: Math.max(3, 30 * part), head: Math.max(12, 26 * part) });
      kit.el("circle", { cx: o.x, cy: o.y, r: 56, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 3 }, pic);
      kit.el("text", { x: o.x, y: o.y + 6, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: "engine" }, pic);
      kit.el("text", { x: o.x - 30, y: o.y - 104, "text-anchor": "end", class: "simkit-label", fill: kit.colors.red, text: `heat in ${kit.fmt(o.heat, 0)} J` }, pic);
      kit.el("text", { x: o.x - 30, y: o.y + 112, "text-anchor": "end", class: "simkit-label", fill: kit.colors.blue, text: shown.waste ? `waste heat ${kit.fmt(s.waste, 0)} J` : "waste heat ? J" }, pic);
      kit.el("text", { x: o.x + 186, y: o.y - 6, class: "simkit-label", fill: kit.colors.green, text: shown.work ? `work ${kit.fmt(s.work, 0)} J` : "work ? J" }, pic);
      kit.el("text", { x: o.x + 186, y: o.y + 22, class: "simkit-tick", text: shown.efficiency ? `efficiency ${kit.fmt(s.efficiency, 0)}% at best` : "efficiency ?" }, pic);
      // Thermometer with both temperatures.
      kit.el("rect", { x: tx - 8, y: TY(1000), width: 16, height: 400, rx: 8, fill: "#fff", stroke: kit.colors.steel, "stroke-width": 2 }, pic);
      for (let T = 0; T <= 1000; T += 200) {
        kit.el("line", { x1: tx + 8, y1: TY(T), x2: tx + 18, y2: TY(T), stroke: kit.colors.ink, "stroke-width": 2 }, pic);
        kit.el("text", { x: tx + 24, y: TY(T) + 5, class: "simkit-tick", text: `${T} K` }, pic);
      }
      handles.forEach(({ key, el, link, dragger }) => {
        el.textContent = "";
        const ty = TY(o[key]);
        if (kit.linked(link)) kit.grip(el, tx - 30, ty, 22);
        else kit.el("circle", { cx: tx - 30, cy: ty, r: 22, fill: "#fff", "fill-opacity": 0.01 }, el);
        kit.el("path", { d: `M ${tx - 10} ${ty} l -26 -13 v 26 z`, fill: key === "hot" ? kit.colors.red : kit.colors.blue, stroke: kit.colors.ink, "stroke-width": 1.5, "stroke-linejoin": "round" }, el);
        dragger.refresh();
      });
    }

    draw();

    return {
      update(next) {
        for (const key of ["hot", "cold", "heat"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** Hide single numbers, e.g. show({ work: false, efficiency: false }); the arrows keep their widths. */
      show(which) {
        for (const key of ["work", "waste", "efficiency"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      values: sol,
    };
  };
})();
