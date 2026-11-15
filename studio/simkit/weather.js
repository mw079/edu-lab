/* simkit.cloudSky and simkit.windMap: cloud cover and temperature; wind between high and low pressure. */
(function () {
  "use strict";
  const kit = window.simkit;

  function cloud(parent, cx, cy, s) {
    const c = kit.el("g", { opacity: 0.95 }, parent);
    for (const [dx, dy, r] of [[-30, 6, 22], [-6, -8, 28], [24, 2, 24], [0, 12, 24]]) kit.el("circle", { cx: cx + dx * s, cy: cy + dy * s, r: r * s, fill: "#fff", stroke: "#c5ccd3", "stroke-width": 1 }, c);
    return c;
  }

  /**
   * opts: { x=140, y=70, w=560, h=360 (sky and ground), cloud=50 (% cloud cover), day=1 (1 = midday, 0 = night),
   *         showValues=true (the temperature) }
   * Returns { update({ cloud, day }), show({ temperature }), showValues(bool), values() }
   * values() -> { temperature (°C) }   (see simkit.physics.cloudTemperature)
   */
  kit.cloudSky = function (stage, opts) {
    const o = Object.assign({ x: 140, y: 70, w: 560, h: 360, cloud: 50, day: 1, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-sky" });
    let showT = o.showValues;
    const groundY = o.y + o.h - 50;
    const sol = () => ({ temperature: kit.physics.cloudTemperature(o.cloud, o.day) });

    function draw() {
      g.textContent = "";
      const day = !!Number(o.day);
      kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 12, fill: day ? "#bfe0fb" : "#27304a" }, g);
      kit.el("rect", { x: o.x, y: groundY, width: o.w, height: o.y + o.h - groundY, fill: day ? "#8fbf7a" : "#4d6a4a" }, g);
      kit.el("circle", { cx: o.x + 70, cy: o.y + 60, r: 30, fill: day ? kit.colors.yellow : "#f0ead6", stroke: day ? kit.colors.orange : "#c9c2a8", "stroke-width": 3 }, g);
      const n = Math.round(kit.clamp(o.cloud, 0, 100) / 10); // 0–10 clouds, two rows over the five arrows
      // Energy arrows: sunlight coming down by day, the ground's heat going up at night. One cloud in the way
      // lets a weaker arrow through; two stop it.
      for (let i = 0; i < 5; i++) {
        const ax = o.x + 150 + i * 90;
        const inWay = (n > i ? 1 : 0) + (n > i + 5 ? 1 : 0);
        const opts = { color: day ? kit.colors.orange : kit.colors.red, width: inWay ? 3 : 6, head: 12 };
        if (day) kit.arrowShape(g, ax, o.y + 30, ax, inWay === 2 ? o.y + 110 : groundY - 8, opts);
        else kit.arrowShape(g, ax, groundY - 8, ax, inWay === 2 ? o.y + 215 : o.y + 30, opts);
      }
      for (let k = 0; k < n; k++) cloud(g, o.x + 150 + (k % 5) * 90 + (k < 5 ? -8 : 10), o.y + (k < 5 ? 128 : 178), 1.05);
      kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 30, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `${day ? "midday" : "night"}, cloud cover ${kit.fmt(o.cloud, 0)}%` }, g);
      // Thermometer at the right, −10 to 40 °C.
      const tx = o.x + o.w + 70;
      const top = o.y + 40;
      const bottom = o.y + o.h - 40;
      const TY = (T) => bottom - ((kit.clamp(T, -10, 40) + 10) / 50) * (bottom - top);
      kit.el("rect", { x: tx - 8, y: top - 10, width: 16, height: bottom - top + 20, rx: 8, fill: "#fff", stroke: kit.colors.steel, "stroke-width": 2 }, g);
      kit.el("circle", { cx: tx, cy: bottom + 18, r: 14, fill: kit.colors.red, stroke: kit.colors.steel, "stroke-width": 2 }, g);
      for (let T = -10; T <= 40; T += 10) {
        kit.el("line", { x1: tx + 8, y1: TY(T), x2: tx + 18, y2: TY(T), stroke: kit.colors.ink, "stroke-width": 2 }, g);
        kit.el("text", { x: tx + 24, y: TY(T) + 4, class: "simkit-tick", text: `${T} °C` }, g);
      }
      const T = sol().temperature;
      if (showT) kit.el("rect", { x: tx - 4, y: TY(T), width: 8, height: bottom - TY(T) + 8, fill: kit.colors.red }, g);
      kit.el("text", { x: tx, y: top - 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.redDark, text: showT ? `${kit.fmt(T, 1)} °C` : "? °C" }, g);
    }

    draw();

    return {
      update(next) {
        if (next.cloud != null) o.cloud = next.cloud;
        if (next.day != null) o.day = next.day;
        draw();
      },
      /** show({ temperature: false }) empties the thermometer and writes "? °C". */
      show(which) {
        if (which.temperature != null) showT = which.temperature;
        draw();
      },
      showValues(visible) {
        showT = visible;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=500, y=270 (centre), w=760, high=1020, low=1000 (hPa), distance=500 (km between the centres,
   *         200–1000), showValues=true (the wind speed) }
   * Air flows from the high to the low; a bigger pressure difference or a shorter distance gives stronger wind.
   * Returns { update({ high, low, distance }), show({ speed }), showValues(bool), values() }
   * values() -> { speed (km/h), difference (hPa) }   (see simkit.physics.windSpeed)
   */
  kit.windMap = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 270, w: 760, high: 1020, low: 1000, distance: 500, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-wind" });
    let showSpeed = o.showValues;
    const arrows = kit.el("g", null, g);
    const fixed = kit.el("g", null, g);
    let drift = 0;
    const sol = () => ({ speed: kit.physics.windSpeed(o.high, o.low, o.distance), difference: o.high - o.low });
    const half = () => 150 + ((kit.clamp(o.distance, 200, 1000) - 200) / 800) * (o.w / 2 - 220);

    function draw() {
      fixed.textContent = "";
      const h = half();
      [[-1, "H", kit.colors.blue, o.high, "high pressure"], [1, "L", kit.colors.red, o.low, "low pressure"]].forEach(([side, letter, color, p, name]) => {
        const cx = o.x + side * h;
        kit.el("circle", { cx, cy: o.y, r: 50, fill: color, "fill-opacity": 0.2, stroke: color, "stroke-width": 3 }, fixed);
        kit.el("text", { x: cx, y: o.y + 14, "text-anchor": "middle", class: "simkit-label", style: "font-size: 40px", fill: color, text: letter }, fixed);
        kit.el("text", { x: cx, y: o.y + 82, "text-anchor": "middle", class: "simkit-label", fill: color, text: `${kit.fmt(p, 0)} hPa` }, fixed);
        kit.el("text", { x: cx, y: o.y + 104, "text-anchor": "middle", class: "simkit-tick", text: name }, fixed);
      });
      const by = o.y + 140;
      kit.el("path", { d: `M ${o.x - h} ${by - 8} L ${o.x - h} ${by} L ${o.x + h} ${by} L ${o.x + h} ${by - 8}`, fill: "none", stroke: kit.colors.ink, "stroke-width": 2 }, fixed);
      kit.el("text", { x: o.x, y: by + 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `${kit.fmt(o.distance, 0)} km` }, fixed);
      const v = sol();
      kit.el("text", { x: o.x, y: o.y - 110, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.purple, text: showSpeed ? (v.speed > 0 ? `wind ${kit.fmt(v.speed, 0)} km/h` : "no wind") : "wind ? km/h" }, fixed);
    }

    function drawArrows() {
      arrows.textContent = "";
      const v = sol();
      const h = half();
      const span = 2 * h - 130;
      if (v.speed <= 0 || span < 40) return;
      // Short arrows drifting from the high to the low; faster wind moves them faster.
      const len = 34;
      const count = Math.max(1, Math.floor(span / 70));
      for (const dy of [-34, 0, 34])
        for (let i = 0; i < count; i++) {
          const pos = ((i / count + drift + (dy ? 0.5 / count : 0)) % 1) * (span - len);
          const x1 = o.x - h + 65 + pos;
          kit.arrowShape(arrows, x1, o.y + dy, x1 + len, o.y + dy, { color: kit.colors.purple, width: 4, head: 11 });
        }
    }

    stage.onFrame((dt) => {
      const v = sol();
      if (v.speed <= 0) return;
      drift = (drift + (dt * kit.clamp(v.speed, 5, 200)) / 400) % 1;
      drawArrows();
    });
    draw();
    drawArrows();

    return {
      update(next) {
        for (const key of ["high", "low", "distance"]) if (next[key] != null) o[key] = next[key];
        draw();
        drawArrows();
      },
      /** show({ speed: false }) writes "wind ? km/h". */
      show(which) {
        if (which.speed != null) showSpeed = which.speed;
        draw();
      },
      showValues(visible) {
        showSpeed = visible;
        draw();
      },
      values: sol,
    };
  };
})();
