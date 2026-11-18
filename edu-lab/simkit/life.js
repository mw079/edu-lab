/* simkit.cellRespiration, simkit.heartLungs, simkit.foodWeb, simkit.landUse, simkit.buffer. */
(function () {
  "use strict";
  const kit = window.simkit;
  const whole = (v) => kit.fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1);

  /**
   * opts: { x=500, y=250 (centre), glucose=1 (molecules, 1–5), oxygen=1 (1 = oxygen present, 0 = none),
   *         showValues=true (the ATP numbers), click: { oxygen: app.link("key") } (the student clicks the oxygen switch) }
   * Returns { update({ glucose, oxygen }), show({ values }), values() }
   * values() -> { glycolysis, krebs, chain, atp, co2, oxygenUsed, lactate, perGlucose }   (see simkit.physics.respiration)
   */
  kit.cellRespiration = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 250, glucose: 1, oxygen: 1, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-respiration" });
    const sol = () => kit.physics.respiration(o.glucose, o.oxygen);

    function draw() {
      g.textContent = "";
      const s = sol();
      const air = Number(o.oxygen) ? 1 : 0;
      const n = Math.round(o.glucose);
      // The mitochondrion holds the two steps that need oxygen.
      kit.el("rect", { x: o.x - 150, y: o.y - 92, width: 560, height: 184, rx: 90, fill: kit.colors.orange, "fill-opacity": air ? 0.14 : 0.05, stroke: kit.colors.orange, "stroke-opacity": air ? 1 : 0.35, "stroke-width": 3 }, g);
      kit.el("text", { x: o.x + 130, y: o.y - 104, "text-anchor": "middle", class: "simkit-tick", text: "mitochondrion" }, g);
      // Glucose going in.
      kit.el("polygon", { points: [0, 1, 2, 3, 4, 5].map((k) => `${(o.x - 462 + 26 * Math.cos((k * Math.PI) / 3)).toFixed(1)},${(o.y + 26 * Math.sin((k * Math.PI) / 3)).toFixed(1)}`).join(" "), fill: kit.colors.green, "fill-opacity": 0.4, stroke: kit.colors.greenDark, "stroke-width": 2 }, g);
      kit.el("text", { x: o.x - 488, y: o.y + 54, class: "simkit-label", fill: kit.colors.ink, text: `glucose × ${n}` }, g);
      const steps = [["Glycolysis", s.glycolysis, -290, 1], ["Krebs cycle", s.krebs, -20, air], ["Electron transport", s.chain, 250, air]];
      steps.forEach(([name, atp, dx, on], i) => {
        const cx = o.x + dx;
        const box = kit.el("g", { opacity: on ? 1 : 0.3 }, g);
        kit.el("rect", { x: cx - 100, y: o.y - 34, width: 200, height: 68, rx: 12, fill: "#fff", stroke: kit.colors.ink, "stroke-width": 2 }, box);
        kit.el("text", { x: cx, y: o.y + 6, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: name }, box);
        kit.arrowShape(box, cx - 136, o.y, cx - 106, o.y, { color: kit.colors.steel, width: 4, head: 10 });
        // ATP made in this step: a bar as long as the number per glucose, and the number.
        if (o.showValues && atp > 0) kit.el("rect", { x: cx - 100, y: o.y + 118, width: Math.max(6, (atp / n) * 7), height: 16, rx: 4, fill: kit.colors.yellow, stroke: kit.colors.orange, "stroke-width": 1.5 }, g);
        kit.el("text", { x: cx - 100, y: o.y + 160, class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `${atp} ATP` : "? ATP" }, g);
      });
      // Without oxygen the chain stops and glycolysis ends in lactic acid.
      if (!air) {
        kit.arrowShape(g, o.x - 290, o.y - 40, o.x - 290, o.y - 96, { color: kit.colors.red, width: 4, head: 10 });
        kit.el("text", { x: o.x - 290, y: o.y - 106, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.red, text: `lactic acid × ${s.lactate}` }, g);
      } else kit.el("text", { x: o.x + 130, y: o.y + 80, "text-anchor": "middle", class: "simkit-tick", text: `uses ${s.oxygenUsed} O₂ · gives off ${s.co2} CO₂` }, g);
      // The oxygen switch.
      const sw = kit.el("g", null, g);
      const link = o.click && o.click.oxygen;
      const sx = o.x + 250;
      const sy = o.y - 190;
      kit.el("rect", { x: sx - 110, y: sy, width: 220, height: 44, rx: 22, fill: air ? kit.colors.blue : "#fff", "fill-opacity": air ? 0.25 : 1, stroke: kit.linked(link) ? kit.colors.purple : kit.colors.steel, "stroke-width": 2, "stroke-dasharray": kit.linked(link) ? "4 5" : null }, sw);
      kit.el("text", { x: sx, y: sy + 28, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: air ? "oxygen: present" : "oxygen: none" }, sw);
      if (link) kit.click(sw, link, () => link(air ? 0 : 1));
      kit.el("text", { x: o.x - 390, y: o.y + 216, class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: o.showValues ? `total: ${s.atp} ATP from ${n} glucose` : `total: ? ATP from ${n} glucose` }, g);
    }

    draw();

    return {
      update(next) {
        if (next.glucose != null) o.glucose = next.glucose;
        if (next.oxygen != null) o.oxygen = next.oxygen;
        draw();
      },
      /** show({ values: false }) writes "? ATP" for every step and the total and removes the ATP bars. */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=90, y=60 (top-left), activity=0 (0 rest … 10 sprint), showValues=true,
   *         drag: { activity: app.link("key") } (the student drags the marker along the activity track) }
   * Returns { update({ activity }), show({ heartRate, breathing, output }), values() }
   * values() -> { heartRate (beats/min), stroke (mL), output (L/min), breathing (breaths/min), timesRest }   (see simkit.physics.heart)
   */
  kit.heartLungs = function (stage, opts) {
    const o = Object.assign({ x: 90, y: 60, activity: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-heart" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const shown = { heartRate: o.showValues, breathing: o.showValues, output: o.showValues };
    const tw = 760;
    const ty = o.y + 400;
    const move = o.drag && o.drag.activity;
    const dragger = kit.drag(stage, handle, move, (p) => move(kit.clamp(((p.x - o.x) / tw) * 10, 0, 10)));
    const sol = () => kit.physics.heart(o.activity);

    function draw() {
      pic.textContent = "";
      const s = sol();
      const a = kit.clamp(o.activity, 0, 10) / 10;
      // Chest: two lungs that fill more and a heart that works harder with activity.
      kit.el("rect", { x: o.x, y: o.y, width: 260, height: 300, rx: 60, fill: "#f6dccd", stroke: kit.colors.steel, "stroke-width": 2 }, pic);
      for (const side of [-1, 1]) kit.el("ellipse", { cx: o.x + 130 + side * 62, cy: o.y + 140, rx: 44 + 8 * a, ry: 92 + 14 * a, fill: kit.colors.blue, "fill-opacity": 0.3, stroke: kit.colors.blueDark, "stroke-width": 2 }, pic);
      const hx = o.x + 138;
      const hy = o.y + 160;
      const k = 1 + 0.25 * a;
      kit.el("path", { d: `M ${hx} ${hy + 30 * k} C ${hx - 62 * k} ${hy - 12 * k}, ${hx - 28 * k} ${hy - 52 * k}, ${hx} ${hy - 22 * k} C ${hx + 28 * k} ${hy - 52 * k}, ${hx + 62 * k} ${hy - 12 * k}, ${hx} ${hy + 30 * k} Z`, fill: kit.colors.red, stroke: kit.colors.redDark, "stroke-width": 2, "stroke-linejoin": "round" }, pic);
      // Three gauges.
      const gx = o.x + 330;
      const gw = 420;
      [["heartRate", "heart rate", s.heartRate, 200, "beats per minute", kit.colors.red, 0], ["breathing", "breathing", s.breathing, 50, "breaths per minute", kit.colors.blue, 0], ["output", "blood pumped", s.output, 30, "litres per minute", kit.colors.purple, 1]].forEach(([key, name, value, max, unit, color, digits], i) => {
        const gy = o.y + 44 + i * 96;
        kit.el("text", { x: gx, y: gy - 12, class: "simkit-label", fill: color, text: name }, pic);
        kit.el("rect", { x: gx, y: gy, width: gw, height: 22, rx: 6, fill: "#fff", stroke: kit.colors.line, "stroke-width": 2 }, pic);
        if (shown[key]) kit.el("rect", { x: gx, y: gy, width: (kit.clamp(value / max, 0, 1) * gw).toFixed(1), height: 22, rx: 6, fill: color, "fill-opacity": 0.7 }, pic);
        kit.el("text", { x: gx, y: gy + 44, class: "simkit-tick", text: shown[key] ? `${kit.fmt(value, digits)} ${unit}` : `? ${unit}` }, pic);
      });
      // Activity track.
      kit.el("line", { x1: o.x, y1: ty, x2: o.x + tw, y2: ty, stroke: kit.colors.ink, "stroke-width": 3, "stroke-linecap": "round" }, pic);
      ["rest", "walk", "jog", "run", "sprint"].forEach((name, i) => {
        const tx = o.x + (i / 4) * tw;
        kit.el("line", { x1: tx, y1: ty - 8, x2: tx, y2: ty + 8, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
        kit.el("text", { x: tx, y: ty + 34, "text-anchor": i === 0 ? "start" : i === 4 ? "end" : "middle", class: "simkit-tick", text: name }, pic);
      });
      const mx = o.x + a * tw;
      kit.el("circle", { cx: mx, cy: ty, r: 10, fill: kit.colors.purple, stroke: "#fff", "stroke-width": 2 }, pic);
      handle.textContent = "";
      if (kit.linked(move)) kit.grip(handle, mx, ty, 22);
      else kit.el("circle", { cx: mx, cy: ty, r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        if (next.activity != null) o.activity = next.activity;
        draw();
      },
      /** Hide single gauges (bar and number), e.g. show({ heartRate: false }) in a step that asks for the heart rate. */
      show(which) {
        for (const key of ["heartRate", "breathing", "output"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=110, y=70, w=640, h=330 (the chart), predators=100 (% of their normal number, 0–150),
   *         names=["grass", "rabbits", "foxes"] (plants, plant eaters, predators), showValues=true,
   *         drag: { predators: app.link("key") } (the student drags the top of the predators' bar) }
   * Returns { update({ predators }), show({ plants, herbivores }), values() }
   * values() -> { predators, herbivores, plants } (all in % of normal)   (see simkit.physics.foodChain)
   */
  kit.foodWeb = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 70, w: 640, h: 330, predators: 100, names: ["grass", "rabbits", "foxes"], showValues: true }, opts);
    const g = stage.layer({ class: "simkit-foodweb" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const shown = { plants: o.showValues, herbivores: o.showValues };
    const Y = (v) => o.y + o.h - (kit.clamp(v, 0, 250) / 250) * o.h;
    const pull = o.drag && o.drag.predators;
    const dragger = kit.drag(stage, handle, pull, (p) => pull(kit.clamp(((o.y + o.h - p.y) / o.h) * 250, 0, 150)));
    const sol = () => kit.physics.foodChain(o.predators);

    function draw() {
      pic.textContent = "";
      const s = sol();
      kit.el("line", { x1: o.x, y1: o.y, x2: o.x, y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      kit.el("line", { x1: o.x, y1: o.y + o.h, x2: o.x + o.w, y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      for (let v = 0; v <= 250; v += 50) {
        kit.el("line", { x1: o.x, y1: Y(v), x2: o.x + o.w, y2: Y(v), stroke: v === 100 ? kit.colors.muted : kit.colors.line, "stroke-width": 1, "stroke-dasharray": v === 100 ? "6 6" : null }, pic);
        kit.el("text", { x: o.x - 10, y: Y(v) + 5, "text-anchor": "end", class: "simkit-tick", text: `${v}%` }, pic);
      }
      kit.el("text", { x: o.x + o.w + 12, y: Y(100) + 5, class: "simkit-tick", text: "normal" }, pic);
      const bars = [["plants", o.names[0], s.plants, kit.colors.green], ["herbivores", o.names[1], s.herbivores, kit.colors.blue], ["predators", o.names[2], s.predators, kit.colors.red]];
      const bw = 110;
      bars.forEach(([key, name, value, color], i) => {
        const cx = o.x + o.w * (0.2 + 0.3 * i);
        const visible = key === "predators" || shown[key];
        if (visible) kit.el("rect", { x: cx - bw / 2, y: Y(value), width: bw, height: Math.max(0, o.y + o.h - Y(value)), fill: color, "fill-opacity": 0.75 }, pic);
        kit.el("text", { x: cx, y: (visible ? Y(value) : Y(100)) - (key === "predators" ? 34 : 12), "text-anchor": "middle", class: "simkit-label", fill: color, text: visible ? `${kit.fmt(value, 0)}%` : "?" }, pic);
        kit.el("text", { x: cx, y: o.y + o.h + 28, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: name }, pic);
        // "is eaten by" arrows along the chain, under the names.
        if (i < 2) {
          kit.arrowShape(pic, cx + 62, o.y + o.h + 56, cx + o.w * 0.3 - 62, o.y + o.h + 56, { color: kit.colors.steel, width: 3, head: 9 });
          kit.el("text", { x: cx + o.w * 0.15, y: o.y + o.h + 80, "text-anchor": "middle", class: "simkit-tick", text: "eaten by" }, pic);
        }
      });
      handle.textContent = "";
      const px = o.x + o.w * 0.8;
      if (kit.linked(pull)) kit.grip(handle, px, Y(s.predators), 24);
      else kit.el("circle", { cx: px, cy: Y(s.predators), r: 24, fill: "#fff", "fill-opacity": 0.01 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        if (next.predators != null) o.predators = next.predators;
        draw();
      },
      /** Hide a bar and its number, e.g. show({ plants: false }) in a step that asks what happens to the plants. */
      show(which) {
        for (const key of ["plants", "herbivores"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=80, y=70 (top-left of the map), cell=84, farm=4, city=2 (squares out of 20; the rest is forest),
   *         showValues=true, click: { farm: app.link("key"), city: app.link("key") } (the student clicks a
   *         square: forest → farm → city → forest) }
   * Returns { update({ farm, city }), show({ species, carbon }), values() }
   * values() -> { forest, farm, city, species (of 100), carbon (tonnes), food (people fed) }   (see simkit.physics.landUse)
   */
  kit.landUse = function (stage, opts) {
    const o = Object.assign({ x: 80, y: 70, cell: 84, farm: 4, city: 2, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-landuse" });
    const shown = { species: o.showValues, carbon: o.showValues };
    const COLS = 5;
    const ROWS = 4;
    const sol = () => kit.physics.landUse(o.farm, o.city, COLS * ROWS);

    function draw() {
      g.textContent = "";
      const s = sol();
      const click = o.click || {};
      for (let i = 0; i < COLS * ROWS; i++) {
        const kind = i < s.city ? "city" : i < s.city + s.farm ? "farm" : "forest";
        const cx = o.x + (i % COLS) * o.cell;
        const cy = o.y + Math.floor(i / COLS) * o.cell;
        const sq = kit.el("g", null, g);
        const u = o.cell;
        kit.el("rect", { x: cx + 2, y: cy + 2, width: u - 4, height: u - 4, rx: 8, fill: kind === "forest" ? "#bfe3c8" : kind === "farm" ? "#f6e3a1" : "#d5d9dd", stroke: "#fff", "stroke-width": 2 }, sq);
        if (kind === "forest") for (const [dx, dy] of [[0.3, 0.38], [0.66, 0.34], [0.48, 0.68]]) kit.el("circle", { cx: cx + u * dx, cy: cy + u * dy, r: u * 0.16, fill: kit.colors.green, stroke: kit.colors.greenDark, "stroke-width": 1.5 }, sq);
        if (kind === "farm") for (let r = 1; r <= 3; r++) kit.el("line", { x1: cx + u * 0.18, y1: cy + (u * r) / 4, x2: cx + u * 0.82, y2: cy + (u * r) / 4, stroke: kit.colors.orange, "stroke-width": 4, "stroke-linecap": "round" }, sq);
        if (kind === "city") for (const [dx, hh] of [[0.2, 0.5], [0.44, 0.66], [0.68, 0.4]]) kit.el("rect", { x: cx + u * dx, y: cy + u * (0.84 - hh), width: u * 0.18, height: u * hh, fill: kit.colors.steel, stroke: kit.colors.ink, "stroke-width": 1.5 }, sq);
        // Forest → farm → city → forest; a step that has no city control switches farm back to forest.
        if (kind === "forest" && click.farm) kit.click(sq, click.farm, () => click.farm(s.farm + 1));
        if (kind === "farm" && click.farm)
          kit.click(sq, click.farm, () => {
            if (kit.linked(click.city)) click.city(s.city + 1);
            click.farm(s.farm - 1);
          });
        if (kind === "city" && click.city) kit.click(sq, click.city, () => click.city(s.city - 1));
      }
      const lx = o.x + COLS * o.cell + 50;
      const rows = [
        [kit.colors.green, `forest: ${s.forest} of 20 squares`],
        [kit.colors.orange, `farms: ${s.farm} · cities: ${s.city}`],
        [kit.colors.ink, shown.species ? `species that still live here: ${s.species} of 100` : "species that still live here: ?"],
        [kit.colors.ink, shown.carbon ? `carbon stored: ${s.carbon} tonnes` : "carbon stored: ?"],
        [kit.colors.ink, `people fed: ${s.food}`],
      ];
      rows.forEach(([color, text], i) => kit.el("text", { x: lx, y: o.y + 40 + i * 44, class: "simkit-label", fill: color, text }, g));
      // Species left, as a bar out of 100.
      const by = o.y + 40 + rows.length * 44;
      kit.el("rect", { x: lx, y: by, width: 300, height: 18, rx: 6, fill: "#fff", stroke: kit.colors.line, "stroke-width": 2 }, g);
      if (shown.species) kit.el("rect", { x: lx, y: by, width: 3 * s.species, height: 18, rx: 6, fill: kit.colors.green, "fill-opacity": 0.7 }, g);
      kit.el("text", { x: lx, y: by + 42, class: "simkit-tick", text: "species left (bar: 0 to 100)" }, g);
    }

    draw();

    return {
      update(next) {
        if (next.farm != null) o.farm = next.farm;
        if (next.city != null) o.city = next.city;
        draw();
      },
      /** show({ species: false }) or show({ carbon: false }) writes "?" for that number (and removes the species bar). */
      show(which) {
        for (const key of ["species", "carbon"]) if (which[key] != null) shown[key] = which[key];
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=70, y=110 (top-left of the first beaker), acid=10, base=10 (mmol of the weak acid HA and its salt A⁻
   *         in 100 mL), added=0 (mmol of strong acid dripped in, 0–20), pKa=4.76 (acetic acid), showValues=true
   *         (the two pH numbers), showGraph=true (pH against acid added, buffer and plain water),
   *         drag: { added: app.link("key") } (the student drags the point along the graph) }
   * Returns { update({ acid, base, added }), show({ values, graph }), values() }
   * values() -> { pH, acidNow, baseNow, waterPH, capacity, exhausted }   (see simkit.physics.buffer)
   */
  kit.buffer = function (stage, opts) {
    const o = Object.assign({ x: 70, y: 110, acid: 10, base: 10, added: 0, pKa: 4.76, showValues: true, showGraph: true }, opts);
    const g = stage.layer({ class: "simkit-buffer" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const COLORS = ["#d7352b", "#e25a2c", "#ec7f2d", "#f2a431", "#f5c93a", "#e6d943", "#b9d14a", "#6fbf5a", "#3fae7c", "#2f9c9f", "#3a82bd", "#4a67c2", "#5a50b8", "#6a3fa6", "#6f2f8f"];
    const gx = o.x + 470;
    const gw = 360;
    const gy = o.y - 30;
    const gh = 300;
    const AX = (a) => gx + (kit.clamp(a, 0, 20) / 20) * gw;
    const PY = (pH) => gy + gh - (kit.clamp(pH, 0, 14) / 14) * gh;
    const drip = o.drag && o.drag.added;
    const dragger = kit.drag(stage, handle, drip, (p) => drip(kit.clamp(((p.x - gx) / gw) * 20, 0, 20)));
    const sol = () => kit.physics.buffer(o.acid, o.base, o.added, o.pKa);

    function draw() {
      pic.textContent = "";
      const s = sol();
      [["buffer", s.pH, 0], ["plain water", s.waterPH, 200]].forEach(([name, pH, dx], i) => {
        const bx = o.x + dx;
        kit.el("rect", { x: bx + 4, y: o.y + 50, width: 142, height: 146, fill: COLORS[kit.clamp(Math.round(pH), 0, 14)], "fill-opacity": 0.45 }, pic);
        kit.el("path", { d: `M ${bx} ${o.y} v 200 h 150 v -200`, fill: "none", stroke: kit.colors.steel, "stroke-width": 6, "stroke-linejoin": "round" }, pic);
        // The buffer's two partners, counted in mmol: the weak acid HA and its salt A⁻ (which catches added acid).
        if (i === 0)
          for (let k = 0; k < 20; k++) {
            const isBase = k < Math.round(s.baseNow);
            const isAcid = !isBase && k < Math.round(s.baseNow) + Math.min(20 - Math.round(s.baseNow), Math.round(s.acidNow));
            if (isBase || isAcid) kit.el("circle", { cx: bx + 24 + (k % 5) * 26, cy: o.y + 76 + Math.floor(k / 5) * 30, r: 9, fill: isBase ? kit.colors.blue : kit.colors.orange, stroke: "#fff", "stroke-width": 1.5 }, pic);
          }
        kit.el("text", { x: bx + 75, y: o.y + 230, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: name }, pic);
        kit.el("text", { x: bx + 75, y: o.y + 258, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: o.showValues ? `pH ${kit.fmt(pH, 2)}` : "pH ?" }, pic);
      });
      kit.el("text", { x: o.x, y: o.y + 296, class: "simkit-label", style: "font-size: 14px; font-weight: 500", fill: kit.colors.blue, text: `● salt A⁻: ${whole(s.baseNow)} mmol` }, pic);
      kit.el("text", { x: o.x, y: o.y + 320, class: "simkit-label", style: "font-size: 14px; font-weight: 500", fill: kit.colors.orange, text: `● weak acid HA: ${whole(s.acidNow)} mmol` }, pic);
      kit.el("text", { x: o.x + 175, y: o.y - 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.red, text: `strong acid added to each: ${whole(o.added)} mmol` }, pic);
      handle.textContent = "";
      if (!o.showGraph) return dragger.refresh();
      kit.el("line", { x1: gx, y1: gy, x2: gx, y2: gy + gh, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      kit.el("line", { x1: gx, y1: gy + gh, x2: gx + gw, y2: gy + gh, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      for (let a = 0; a <= 20; a += 5) kit.el("text", { x: AX(a), y: gy + gh + 22, "text-anchor": "middle", class: "simkit-tick", text: String(a) }, pic);
      for (let v = 0; v <= 14; v += 7) kit.el("text", { x: gx - 10, y: PY(v) + 5, "text-anchor": "end", class: "simkit-tick", text: String(v) }, pic);
      kit.el("text", { x: gx + gw / 2, y: gy + gh + 48, "text-anchor": "middle", class: "simkit-tick", text: "strong acid added (mmol)" }, pic);
      kit.el("text", { x: gx, y: gy - 14, class: "simkit-tick", text: "pH" }, pic);
      const curve = (f) => Array.from({ length: 101 }, (_, k) => `${k ? "L" : "M"} ${AX(k / 5).toFixed(1)} ${PY(f(k / 5)).toFixed(1)}`).join(" ");
      kit.el("path", { d: curve((a) => kit.physics.buffer(o.acid, o.base, a, o.pKa).waterPH), fill: "none", stroke: kit.colors.steel, "stroke-width": 3, "stroke-dasharray": "7 6" }, pic);
      kit.el("path", { d: curve((a) => kit.physics.buffer(o.acid, o.base, a, o.pKa).pH), fill: "none", stroke: kit.colors.purple, "stroke-width": 4, "stroke-linejoin": "round" }, pic);
      kit.el("text", { x: gx + gw + 8, y: PY(kit.physics.buffer(o.acid, o.base, 20, o.pKa).waterPH) - 4, class: "simkit-tick", text: "water" }, pic);
      kit.el("text", { x: AX(6), y: PY(kit.physics.buffer(o.acid, o.base, 6, o.pKa).pH) - 34, "text-anchor": "middle", class: "simkit-label", style: "font-size: 14px; font-weight: 500", fill: kit.colors.purple, text: "buffer" }, pic);
      kit.el("circle", { cx: AX(o.added), cy: PY(s.pH), r: 9, fill: kit.colors.purple, stroke: "#fff", "stroke-width": 2 }, pic);
      if (kit.linked(drip)) kit.grip(handle, AX(o.added), PY(s.pH), 24);
      else kit.el("circle", { cx: AX(o.added), cy: PY(s.pH), r: 24, fill: "#fff", "fill-opacity": 0.01 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["acid", "base", "added"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) writes "pH ?" under both beakers; show({ graph: false }) removes the graph. */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        if (which.graph != null) o.showGraph = which.graph;
        draw();
      },
      values: sol,
    };
  };
})();
