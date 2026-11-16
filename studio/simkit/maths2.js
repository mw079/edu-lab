/* simkit.openSets, simkit.shapeBuilder, simkit.axisTrick, simkit.confidenceIntervals. */
(function () {
  "use strict";
  const kit = window.simkit;
  const whole = (v) => kit.fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1);

  /**
   * opts: { x=500, y=230 (centre), sets=[0,0,0,0,0,0] (1 = chosen, in the order {a}, {b}, {c}, {a,b}, {a,c}, {b,c};
   *         the empty set and {a,b,c} are always chosen), showCheck=true (the verdict and what is missing),
   *         click: { sets: [app.link("key"), …] } (the student clicks a card to choose or drop that set) }
   * Returns { update({ sets: [ … ] }), show({ check }), values() }
   * values() -> { count, open, isTopology, missing }   (see simkit.physics.topology)
   */
  kit.openSets = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 230, sets: [0, 0, 0, 0, 0, 0], showCheck: true }, opts);
    const g = stage.layer({ class: "simkit-opensets" });
    const CARDS = [[0, -1], [1, 0], [2, 1], [4, 2], [3, 3], [5, 4], [6, 5], [7, -1]]; // [members as bits a=1 b=2 c=4, index in sets]
    const sol = () => kit.physics.topology(o.sets);

    function draw() {
      g.textContent = "";
      const s = sol();
      const cw = 190;
      const ch = 124;
      const left = o.x - (4 * cw + 3 * 20) / 2;
      const top = o.y - 170;
      CARDS.forEach(([mask, idx], i) => {
        const cx = left + (i % 4) * (cw + 20);
        const cy = top + Math.floor(i / 4) * (ch + 22);
        const on = idx < 0 || Number(o.sets[idx]) === 1;
        const link = idx >= 0 && o.click && o.click.sets && o.click.sets[idx];
        const card = kit.el("g", null, g);
        kit.el("rect", { x: cx, y: cy, width: cw, height: ch, rx: 14, fill: on ? kit.colors.purple : "#fff", "fill-opacity": on ? 0.14 : 1, stroke: on ? kit.colors.purple : kit.colors.steel, "stroke-width": on ? 4 : 2, "stroke-dasharray": on ? null : "5 6" }, card);
        // The three points; the members of this set are filled and ringed together.
        const members = [0, 1, 2].filter((k) => mask & (1 << k));
        if (members.length) {
          const x0 = cx + 45 + members[0] * 50;
          const x1 = cx + 45 + members[members.length - 1] * 50;
          kit.el("rect", { x: x0 - 22, y: cy + 20, width: x1 - x0 + 44, height: 44, rx: 22, fill: "none", stroke: kit.colors.ink, "stroke-width": 2 }, card);
        }
        ["a", "b", "c"].forEach((letter, k) => {
          const inSet = mask & (1 << k);
          // {a, c} skips b: b is drawn hollow inside the ring.
          kit.el("circle", { cx: cx + 45 + k * 50, cy: cy + 42, r: 13, fill: inSet ? kit.colors.ink : "#fff", stroke: kit.colors.steel, "stroke-width": 2 }, card);
          kit.el("text", { x: cx + 45 + k * 50, y: cy + 47, "text-anchor": "middle", class: "simkit-label", style: `font-size: 14px; fill: ${inSet ? "#fff" : kit.colors.muted}`, text: letter }, card);
        });
        const name = mask === 0 ? "∅ (empty)" : `{${["a", "b", "c"].filter((_, k) => mask & (1 << k)).join(", ")}}`;
        kit.el("text", { x: cx + cw / 2, y: cy + 92, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: name }, card);
        kit.el("text", { x: cx + cw / 2, y: cy + 114, "text-anchor": "middle", class: "simkit-tick", text: idx < 0 ? "always open" : on ? "open" : "not chosen" }, card);
        if (link) kit.click(card, link, () => link(on ? 0 : 1));
      });
      const vy = top + 2 * ch + 22 + 44;
      // The verdict never states how many sets are open: steps ask students to count them on the cards.
      const verdict = !o.showCheck ? "Do these open sets form a topology?" : s.isTopology ? "✓ These open sets form a topology" : "✗ Not a topology yet";
      kit.el("text", { x: o.x, y: vy, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: !o.showCheck ? kit.colors.ink : s.isTopology ? kit.colors.green : kit.colors.red, text: verdict }, g);
      if (o.showCheck && s.missing) kit.el("text", { x: o.x, y: vy + 30, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `${s.missing} is not open` }, g);
    }

    draw();

    return {
      update(next) {
        if (next.sets) o.sets = next.sets.slice();
        draw();
      },
      /** show({ check: false }) removes the verdict and the missing set (for steps that ask "is this a topology?"). */
      show(which) {
        if (which.check != null) o.showCheck = which.check;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=110, y=470 (bottom-left corner of the rectangle), unit=40 (px per unit), w=6 (2–10), h=4 (1–6),
   *         t=3 (height of the triangle on top, 0–4), showValues=true (areas and perimeter),
   *         drag: { w, h, t } (app.link per key: the student drags the rectangle's top-right corner and the peak) }
   * Returns { update({ w, h, t }), show({ values }), values() }
   * values() -> { rectangle, triangle, area, perimeter, slant }   (see simkit.physics.composite)
   */
  kit.shapeBuilder = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 470, unit: 40, w: 6, h: 4, t: 3, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-shapes" });
    const pic = kit.el("g", null, g);
    const u = o.unit;
    const links = o.drag || {};
    const corner = kit.el("g", null, g);
    const peak = kit.el("g", null, g);
    const cornerDrag = kit.drag(stage, corner, [links.w, links.h], (p) => {
      if (kit.linked(links.w)) links.w(kit.clamp((p.x - o.x) / u, 2, 10));
      if (kit.linked(links.h)) links.h(kit.clamp((o.y - p.y) / u, 1, 6));
    });
    const peakDrag = kit.drag(stage, peak, links.t, (p) => links.t(kit.clamp((o.y - p.y) / u - o.h, 0, 4)));
    const sol = () => kit.physics.composite(o.w, o.h, o.t);

    function draw() {
      pic.textContent = "";
      const s = sol();
      for (let c = 0; c <= 10; c++) kit.el("line", { x1: o.x + c * u, y1: o.y, x2: o.x + c * u, y2: o.y - 10 * u, stroke: kit.colors.line, "stroke-width": 1 }, pic);
      for (let r = 0; r <= 10; r++) kit.el("line", { x1: o.x, y1: o.y - r * u, x2: o.x + 10 * u, y2: o.y - r * u, stroke: kit.colors.line, "stroke-width": 1 }, pic);
      const right = o.x + o.w * u;
      const topY = o.y - o.h * u;
      const peakY = topY - o.t * u;
      kit.el("rect", { x: o.x, y: topY, width: o.w * u, height: o.h * u, fill: kit.colors.blue, "fill-opacity": 0.35, stroke: kit.colors.blueDark, "stroke-width": 3, "stroke-linejoin": "round" }, pic);
      if (o.t > 0) {
        kit.el("polygon", { points: `${o.x},${topY} ${right},${topY} ${o.x + (o.w * u) / 2},${peakY}`, fill: kit.colors.orange, "fill-opacity": 0.4, stroke: kit.colors.orange, "stroke-width": 3, "stroke-linejoin": "round" }, pic);
        kit.el("line", { x1: o.x + (o.w * u) / 2, y1: topY, x2: o.x + (o.w * u) / 2, y2: peakY, stroke: kit.colors.ink, "stroke-width": 1.5, "stroke-dasharray": "5 5" }, pic);
        if (o.t >= 1) kit.el("text", { x: o.x + (o.w * u) / 2 + 8, y: (topY + peakY) / 2 + 12, class: "simkit-tick", text: whole(o.t) }, pic);
      }
      kit.el("text", { x: o.x + (o.w * u) / 2, y: o.y + 22, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: whole(o.w) }, pic);
      kit.el("text", { x: o.x - 12, y: (o.y + topY) / 2 + 5, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: whole(o.h) }, pic);
      const lx = o.x + 10 * u + 50;
      const rows = o.showValues
        ? [[kit.colors.blue, `rectangle: ${whole(o.w)} × ${whole(o.h)} = ${whole(s.rectangle)}`], [kit.colors.orange, `triangle: ½ × ${whole(o.w)} × ${whole(o.t)} = ${whole(s.triangle)}`], [kit.colors.ink, `area: ${whole(s.area)} square units`], [kit.colors.ink, `perimeter: ${kit.fmt(s.perimeter, 1)} units`]]
        : [[kit.colors.blue, "rectangle: ?"], [kit.colors.orange, "triangle: ?"], [kit.colors.ink, "area: ? square units"], [kit.colors.ink, "perimeter: ? units"]];
      rows.forEach(([color, text], i) => kit.el("text", { x: lx, y: o.y - 300 + i * 40, class: "simkit-label", fill: color, text }, pic));
      corner.textContent = "";
      peak.textContent = "";
      if (kit.linked(links.w) || kit.linked(links.h)) kit.grip(corner, right, topY, 22);
      else kit.el("circle", { cx: right, cy: topY, r: 22, fill: "#fff", "fill-opacity": 0.01 }, corner);
      kit.el("circle", { cx: right, cy: topY, r: 7, fill: kit.colors.blueDark, stroke: "#fff", "stroke-width": 2 }, corner);
      if (kit.linked(links.t)) kit.grip(peak, o.x + (o.w * u) / 2, peakY, 22);
      else kit.el("circle", { cx: o.x + (o.w * u) / 2, cy: peakY, r: 22, fill: "#fff", "fill-opacity": 0.01 }, peak);
      kit.el("circle", { cx: o.x + (o.w * u) / 2, cy: peakY, r: 7, fill: kit.colors.orange, stroke: "#fff", "stroke-width": 2 }, peak);
      cornerDrag.refresh();
      peakDrag.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["w", "h", "t"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) writes "?" for the two part areas, the total area and the perimeter (side lengths stay). */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=130, y=70 (top-left of the chart), w=380, h=340, a=82, b=86 (the two values), labelA="Brand A",
   *         labelB="Brand B", max=100 (top of the axis), start=0 (where the axis begins), unit="%",
   *         showValues=true (the two comparisons beside the chart),
   *         drag: { start: app.link("key") } (the student drags the bottom of the axis up and down) }
   * Returns { update({ a, b, start }), show({ values }), values() }
   * values() -> { looks (how many times as tall bar B is drawn), real (b ÷ a), percentMore, honest }   (see simkit.physics.axisTrick)
   */
  kit.axisTrick = function (stage, opts) {
    const o = Object.assign({ x: 130, y: 70, w: 380, h: 340, a: 82, b: 86, labelA: "Brand A", labelB: "Brand B", max: 100, start: 0, unit: "%", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-axistrick" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const cut = o.drag && o.drag.start;
    const top = () => Math.min(o.a, o.b) - 2;
    const dragger = kit.drag(stage, handle, cut, (p, begin, from) => cut(kit.clamp(from + ((begin.y - p.y) / o.h) * o.max, 0, top())), () => o.start);
    const sol = () => kit.physics.axisTrick(o.a, o.b, o.start);

    function draw() {
      pic.textContent = "";
      const s = sol();
      const start = kit.clamp(o.start, 0, top());
      const Y = (v) => o.y + o.h - ((kit.clamp(v, start, o.max) - start) / (o.max - start)) * o.h;
      kit.el("line", { x1: o.x, y1: o.y, x2: o.x, y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      kit.el("line", { x1: o.x, y1: o.y + o.h, x2: o.x + o.w, y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      for (let k = 0; k <= 4; k++) {
        const v = start + ((o.max - start) * k) / 4;
        kit.el("line", { x1: o.x, y1: Y(v), x2: o.x + o.w, y2: Y(v), stroke: kit.colors.line, "stroke-width": 1 }, pic);
        kit.el("text", { x: o.x - 12, y: Y(v) + 5, "text-anchor": "end", class: "simkit-tick", style: k === 0 && start > 0 ? `fill: ${kit.textColor(kit.colors.red)}; font-weight: 700` : null, text: `${whole(v)}${o.unit}` }, pic);
      }
      [[o.a, o.labelA, kit.colors.steel, 0.28], [o.b, o.labelB, kit.colors.blue, 0.72]].forEach(([v, label, color, at]) => {
        const cx = o.x + o.w * at;
        kit.el("rect", { x: cx - 55, y: Y(v), width: 110, height: o.y + o.h - Y(v), fill: color, "fill-opacity": 0.8 }, pic);
        kit.el("text", { x: cx, y: Y(v) - 10, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `${whole(v)}${o.unit}` }, pic);
        kit.el("text", { x: cx, y: o.y + o.h + 26, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: label }, pic);
      });
      const lx = o.x + o.w + 70;
      kit.el("text", { x: lx, y: o.y + 70, class: "simkit-label", fill: kit.colors.ink, text: "In the picture" }, pic);
      kit.el("text", { x: lx, y: o.y + 100, class: "simkit-label", style: "font-size: 20px", fill: kit.colors.blue, text: o.showValues ? `${o.labelB}'s bar is ${kit.fmt(s.looks, 2)} × as tall` : `${o.labelB}'s bar is ? × as tall` }, pic);
      kit.el("text", { x: lx, y: o.y + 170, class: "simkit-label", fill: kit.colors.ink, text: "In the numbers" }, pic);
      kit.el("text", { x: lx, y: o.y + 200, class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: o.showValues ? `${o.labelB} is ${kit.fmt(s.real, 2)} × ${o.labelA}` : `${o.labelB} is ? × ${o.labelA}` }, pic);
      kit.el("text", { x: lx, y: o.y + 270, class: "simkit-label", fill: start > 0 ? kit.colors.red : kit.colors.green, text: start > 0 ? `the axis starts at ${whole(start)}${o.unit}, not at 0` : "the axis starts at 0" }, pic);
      handle.textContent = "";
      if (kit.linked(cut)) kit.grip(handle, o.x, o.y + o.h, 22);
      else kit.el("circle", { cx: o.x, cy: o.y + o.h, r: 22, fill: "#fff", "fill-opacity": 0.01 }, handle);
      kit.el("circle", { cx: o.x, cy: o.y + o.h, r: 7, fill: kit.colors.purple, stroke: "#fff", "stroke-width": 2 }, handle);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["a", "b", "start"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) writes "?" for both comparisons (the chart and its numbers stay). */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=100, y=60 (top-left of the chart), w=500, h=370, percent=40 (% red in the population), size=50
   *         (per sample, 10–200), level=95 (80, 90, 95 or 99), count=20 (samples, 1–50), showTruth=true (the
   *         population's real value and which intervals miss it),
   *         click: { count: app.link("key") } (the student clicks the button to take 5 more samples) }
   * Returns { update({ percent, size, level, count }), show({ truth }), values() }
   * values() -> { list, hits, misses, coverage (%), z, halfWidth }   (see simkit.physics.intervals)
   */
  kit.confidenceIntervals = function (stage, opts) {
    const o = Object.assign({ x: 100, y: 60, w: 500, h: 370, percent: 40, size: 50, level: 95, count: 20, showTruth: true }, opts);
    const g = stage.layer({ class: "simkit-intervals" });
    const sol = () => kit.physics.intervals(o.percent, o.size, o.level, o.count);

    function draw() {
      g.textContent = "";
      const s = sol();
      const n = s.list.length;
      const X = (v) => o.x + (v / 100) * o.w;
      kit.el("line", { x1: o.x, y1: o.y + o.h, x2: o.x + o.w, y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      for (let v = 0; v <= 100; v += 10) {
        kit.el("line", { x1: X(v), y1: o.y + o.h, x2: X(v), y2: o.y + o.h + 8, stroke: kit.colors.ink, "stroke-width": 2 }, g);
        if (v % 20 === 0) kit.el("text", { x: X(v), y: o.y + o.h + 26, "text-anchor": "middle", class: "simkit-tick", text: `${v}%` }, g);
      }
      kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 54, "text-anchor": "middle", class: "simkit-tick", text: "one line per sample: its interval for the % red" }, g);
      if (o.showTruth) kit.el("line", { x1: X(o.percent), y1: o.y - 10, x2: X(o.percent), y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
      const row = Math.min(18, o.h / n);
      s.list.forEach((it, i) => {
        const ly = o.y + 8 + i * row;
        const color = o.showTruth && !it.hit ? kit.colors.red : kit.colors.blue;
        kit.el("line", { x1: X(it.low), y1: ly, x2: X(it.high), y2: ly, stroke: color, "stroke-width": Math.min(4, row * 0.5), "stroke-linecap": "round" }, g);
        kit.el("circle", { cx: X(it.mid), cy: ly, r: Math.min(4.5, row * 0.4), fill: color }, g);
      });
      const lx = o.x + o.w + 60;
      const rows = [
        [kit.colors.ink, `${kit.fmt(o.level, 0)}% confidence intervals`],
        [kit.colors.ink, `${n} sample${n === 1 ? "" : "s"} of ${kit.fmt(o.size, 0)}`],
        [kit.colors.ink, o.showTruth ? `real value: ${kit.fmt(o.percent, 0)}% red` : "real value: ?"],
        [kit.colors.blue, o.showTruth ? `${s.hits} contain the real value` : "? contain the real value"],
        [kit.colors.red, o.showTruth ? `${s.misses} miss it` : "? miss it"],
      ];
      rows.forEach(([color, text], i) => kit.el("text", { x: lx, y: o.y + 30 + i * 40, class: "simkit-label", fill: color, text }, g));
      const link = o.click && o.click.count;
      const btn = kit.el("g", null, g);
      kit.el("rect", { x: lx, y: o.y + 230, width: 250, height: 48, rx: 12, fill: "#fff", stroke: kit.linked(link) ? kit.colors.purple : kit.colors.steel, "stroke-width": 2, "stroke-dasharray": kit.linked(link) ? "4 5" : null }, btn);
      kit.el("text", { x: lx + 125, y: o.y + 260, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: "take 5 more samples" }, btn);
      if (link) kit.click(btn, link, () => link(Math.min(50, n + 5)));
    }

    draw();

    return {
      update(next) {
        for (const key of ["percent", "size", "level", "count"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ truth: false }) removes the real value's line, colours every interval alike and writes "?" for the counts. */
      show(which) {
        if (which.truth != null) o.showTruth = which.truth;
        draw();
      },
      values: sol,
    };
  };
})();
