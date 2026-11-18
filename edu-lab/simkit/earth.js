/* simkit.plateBoundary and simkit.waterCycle: two plates meeting or parting; evaporation, clouds and rain. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500 (the boundary), y=290 (sea level), w=760, speed=4 (cm per year; + = the plates move together,
   *         − = apart), years=20 (million years), kind="ocean-continent" | "ocean-ocean" | "continent-continent"
   *         (left plate – right plate), showValues=true (the distance moved),
   *         showFeature=true (the name of the boundary and of what forms there),
   *         drag: { speed: app.link("key") } (the student pushes the left plate towards the boundary or pulls it away) }
   * Returns { update({ speed, years, kind }), show({ values, feature }), values() }
   * values() -> { boundary, feature, distance (km) }   (see simkit.physics.plates)
   */
  kit.plateBoundary = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 290, w: 760, speed: 4, years: 20, kind: "ocean-continent", showValues: true, showFeature: true }, opts);
    const g = stage.layer({ class: "simkit-plates" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const push = o.drag && o.drag.speed;
    const dragger = kit.drag(stage, handle, push, (p, start, from) => push(from + (p.x - start.x) / 12), () => o.speed);
    const sol = () => kit.physics.plates(o.speed, o.years, o.kind);
    const OCEAN = "#7f8c97";
    const LAND = "#c9b08a";

    function draw() {
      pic.textContent = "";
      const s = sol();
      const [leftKind, rightKind] = String(o.kind).split("-").map((k) => (k === "continent" ? "continent" : "ocean"));
      const L = o.x - o.w / 2;
      const R = o.x + o.w / 2;
      const move = kit.clamp(s.distance / 20, 0, 70); // px: how far the picture has changed
      const apart = s.boundary === "divergent" ? move : 0;
      const together = s.boundary === "convergent" ? move : 0;
      // Mantle under everything.
      kit.el("rect", { x: L, y: o.y + 20, width: o.w, height: 150, rx: 10, fill: "#f3c9a2" }, pic);
      kit.el("text", { x: L + 16, y: o.y + 156, class: "simkit-tick", text: "hot mantle" }, pic);
      const top = (kind) => o.y - (kind === "continent" ? 18 : -14); // continents stand above sea level
      const thick = (kind) => (kind === "continent" ? 62 : 30);
      const water = (x1, x2) => kit.el("rect", { x: x1, y: o.y, width: Math.max(0, x2 - x1), height: 14, fill: kit.colors.blue, "fill-opacity": 0.35 }, pic);
      const plate = (x1, x2, kind) => {
        kit.el("rect", { x: x1, y: top(kind), width: Math.max(0, x2 - x1), height: thick(kind), fill: kind === "continent" ? LAND : OCEAN, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
        if (kind === "ocean") water(x1, x2);
      };
      const lx2 = o.x - apart;
      const rx1 = o.x + apart;
      if (together && leftKind === "ocean" && o.kind !== "continent-continent") {
        // The ocean plate bends down under the other plate and sinks into the mantle.
        const len = 60 + together * 1.6;
        const x0 = o.x - 6;
        const y0 = top("ocean");
        kit.el("polygon", { points: `${x0},${y0} ${x0 + len * 0.8},${y0 + len * 0.62} ${x0 + len * 0.8 - 18},${y0 + len * 0.62 + 24} ${x0 - 14},${y0 + 30}`, fill: OCEAN, stroke: kit.colors.ink, "stroke-width": 2, "stroke-linejoin": "round" }, pic);
      }
      plate(L, lx2, leftKind);
      plate(rx1, R, rightKind);
      if (apart) {
        // New crust in the gap, with magma rising under a ridge (or a rift valley on land).
        kit.el("rect", { x: lx2, y: top("ocean"), width: 2 * apart, height: 30, fill: kit.colors.red, "fill-opacity": 0.75, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
        if (o.kind !== "continent-continent") water(lx2, rx1);
        kit.arrowShape(pic, o.x, o.y + 120, o.x, o.y + 54, { color: kit.colors.red, width: 6, head: 14 });
      }
      if (together) {
        if (o.kind === "continent-continent") {
          // Neither plate sinks: the crust crumples upward.
          const h = 30 + together * 1.3;
          const peaks = [[-60, 0.55], [-22, 1], [20, 0.8], [58, 0.5]];
          for (const [dx, f] of peaks) kit.el("polygon", { points: `${o.x + dx - 34},${top("continent")} ${o.x + dx},${top("continent") - h * f} ${o.x + dx + 34},${top("continent")}`, fill: LAND, stroke: kit.colors.ink, "stroke-width": 2, "stroke-linejoin": "round" }, pic);
        } else {
          // Melted rock rises above the sinking plate and builds volcanoes on the upper plate.
          const vx = o.x + 110;
          const vy = top(rightKind);
          const h = 26 + together * 0.6;
          kit.el("polygon", { points: `${vx - 34},${vy} ${vx - 7},${vy - h} ${vx + 7},${vy - h} ${vx + 34},${vy}`, fill: rightKind === "continent" ? LAND : OCEAN, stroke: kit.colors.ink, "stroke-width": 2, "stroke-linejoin": "round" }, pic);
          kit.el("circle", { cx: vx, cy: vy - h - 5, r: 6, fill: kit.colors.red }, pic);
          kit.el("line", { x1: vx, y1: vy + 90, x2: vx, y2: vy + thick(rightKind) + 4, stroke: kit.colors.red, "stroke-width": 4, "stroke-dasharray": "5 5" }, pic);
        }
      }
      // Arrows above the plates show which way each one moves.
      const ay = o.y - 150;
      const len = kit.clamp(Math.abs(o.speed) * 9, 0, 110);
      if (len > 0) {
        const dir = Math.sign(o.speed);
        kit.arrowShape(pic, o.x - 190 - (dir * len) / 2, ay, o.x - 190 + (dir * len) / 2, ay, { color: kit.colors.orange, width: 6, head: 14 });
        kit.arrowShape(pic, o.x + 190 + (dir * len) / 2, ay, o.x + 190 - (dir * len) / 2, ay, { color: kit.colors.orange, width: 6, head: 14 });
      }
      const name = (kind) => (kind === "continent" ? "continental plate" : "ocean plate");
      kit.el("text", { x: o.x - 190, y: ay - 26, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: name(leftKind) }, pic);
      kit.el("text", { x: o.x + 190, y: ay - 26, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: name(rightKind) }, pic);
      const speedText = o.speed ? `${o.speed > 0 ? "closing" : "opening"} at ${kit.fmt(Math.abs(o.speed), 0)} cm per year for ${kit.fmt(o.years, 0)} million years` : "the plates are not moving";
      kit.el("text", { x: o.x, y: o.y + 204, "text-anchor": "middle", class: "simkit-tick", text: speedText }, pic);
      const feature = o.showFeature ? (s.boundary === "none" ? "no boundary activity" : `${s.boundary} boundary: ${s.feature}`) : "boundary: ?";
      const moved = o.showValues ? `${kit.fmt(s.distance, 0)} km` : "? km";
      kit.el("text", { x: o.x, y: o.y + 232, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `${feature} · moved ${moved}` }, pic);
      handle.textContent = "";
      if (kit.linked(push)) kit.grip(handle, o.x - 270, top(leftKind) + thick(leftKind) / 2, 24);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["speed", "years", "kind"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) writes "? km"; show({ feature: false }) writes "boundary: ?". */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        if (which.feature != null) o.showFeature = which.feature;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=110, y=70, w=620, h=380, temperature=20 (°C, 0–40), vapour=10 (g of water vapour per m³ of air),
   *         showValues=true (humidity and how much the air can hold),
   *         drag: { temperature: app.link("key") } (the student drags the top of the thermometer's red column) }
   * Warm air holds more water vapour; when the air holds all it can (100 % humidity) clouds form and it rains.
   * Returns { update({ temperature, vapour }), show({ values }), values() }
   * values() -> { saturation, relative, dewPoint, condensing }   (see simkit.physics.humidity)
   */
  kit.waterCycle = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 70, w: 620, h: 380, temperature: 20, vapour: 10, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-watercycle" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const tx = o.x + o.w + 70;
    const top = o.y + 40;
    const bottom = o.y + o.h - 40;
    const TY = (T) => bottom - (kit.clamp(T, 0, 40) / 40) * (bottom - top);
    const heat = o.drag && o.drag.temperature;
    const dragger = kit.drag(stage, handle, heat, (p) => heat(kit.clamp(((bottom - p.y) / (bottom - top)) * 40, 0, 40)));
    const sol = () => kit.physics.humidity(o.vapour, o.temperature);

    function draw() {
      pic.textContent = "";
      const s = sol();
      const seaY = o.y + o.h - 70;
      kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 12, fill: "#cfe6fa" }, pic);
      // Land rising to a hill on the right, sea on the left.
      kit.el("path", { d: `M ${o.x + o.w * 0.42} ${o.y + o.h} L ${o.x + o.w * 0.42} ${seaY + 6} Q ${o.x + o.w * 0.7} ${seaY - 20} ${o.x + o.w * 0.82} ${seaY - 130} Q ${o.x + o.w * 0.9} ${seaY - 150} ${o.x + o.w} ${seaY - 90} L ${o.x + o.w} ${o.y + o.h} Z`, fill: "#9cc58a" }, pic);
      kit.el("rect", { x: o.x, y: seaY, width: o.w * 0.44, height: o.y + o.h - seaY, fill: kit.colors.blue, "fill-opacity": 0.55 }, pic);
      kit.el("circle", { cx: o.x + 64, cy: o.y + 58, r: 28, fill: kit.colors.yellow, stroke: kit.colors.orange, "stroke-width": 3 }, pic);
      // Evaporation: longer arrows from the sea when it is warmer.
      const up = 26 + o.temperature * 2.2;
      for (let i = 0; i < 3; i++) kit.arrowShape(pic, o.x + 70 + i * 62, seaY - 8, o.x + 70 + i * 62, seaY - 8 - up, { color: kit.colors.blue, width: 4, head: 11 });
      kit.el("text", { x: o.x + 16, y: seaY + 44, class: "simkit-label", fill: "#fff", text: "sea" }, pic);
      // Cloud over the hill: it grows as the air gets closer to holding all the water it can.
      const fill = kit.clamp(s.relative / 100, 0, 1);
      const cx = o.x + o.w * 0.74;
      const cy = o.y + 74;
      if (fill >= 0.5) {
        const k = 0.5 + fill * 0.8;
        const c = kit.el("g", null, pic);
        for (const [dx, dy, r] of [[-38, 8, 24], [-8, -8, 32], [30, 2, 27], [0, 14, 26]]) kit.el("circle", { cx: cx + dx * k, cy: cy + dy * k, r: r * k, fill: s.condensing ? "#aeb7c2" : "#fff", stroke: "#b9c2cb", "stroke-width": 1 }, c);
      }
      if (s.condensing) for (let i = 0; i < 6; i++) kit.el("line", { x1: cx - 50 + i * 20, y1: cy + 58, x2: cx - 58 + i * 20, y2: cy + 96, stroke: kit.colors.blueDark, "stroke-width": 3, "stroke-linecap": "round" }, pic);
      const state = s.condensing ? "the air is full: clouds and rain" : fill >= 0.5 ? "a cloud is forming" : "clear sky";
      kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 30, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: state }, pic);
      const numbers = o.showValues ? `holds ${kit.fmt(o.vapour, 0)} of at most ${kit.fmt(s.saturation, 1)} g/m³ · humidity ${kit.fmt(Math.min(s.relative, 999), 0)}%` : `holds ${kit.fmt(o.vapour, 0)} g/m³ · humidity ?`;
      kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 56, "text-anchor": "middle", class: "simkit-tick", text: numbers }, pic);
      // Thermometer, 0 to 40 °C.
      kit.el("rect", { x: tx - 8, y: top - 10, width: 16, height: bottom - top + 20, rx: 8, fill: "#fff", stroke: kit.colors.steel, "stroke-width": 2 }, pic);
      kit.el("circle", { cx: tx, cy: bottom + 18, r: 14, fill: kit.colors.red, stroke: kit.colors.steel, "stroke-width": 2 }, pic);
      for (let T = 0; T <= 40; T += 10) {
        kit.el("line", { x1: tx + 8, y1: TY(T), x2: tx + 18, y2: TY(T), stroke: kit.colors.ink, "stroke-width": 2 }, pic);
        kit.el("text", { x: tx + 24, y: TY(T) + 5, class: "simkit-tick", text: `${T} °C` }, pic);
      }
      kit.el("rect", { x: tx - 4, y: TY(o.temperature), width: 8, height: bottom - TY(o.temperature) + 8, fill: kit.colors.red }, pic);
      kit.el("text", { x: tx, y: top - 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.redDark, text: `${kit.fmt(o.temperature, 0)} °C` }, pic);
      handle.textContent = "";
      if (kit.linked(heat)) kit.grip(handle, tx, TY(o.temperature), 22);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        if (next.temperature != null) o.temperature = next.temperature;
        if (next.vapour != null) o.vapour = next.vapour;
        draw();
      },
      /** show({ values: false }) writes "humidity ?" and hides how much the air can hold. */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };
})();
