/* simkit.membrane, simkit.dnaStrand, simkit.mitosis, simkit.predatorPrey: cell and population biology. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=150, y=90, w=700, h=300, left=16, right=4 (particles on each side at the start, 0–20), pores=2
   *         (open channels in the membrane, 0–5), minutes=0 (time passed), showValues=true (the counts),
   *         click: { left: app.link("key"), right: app.link("key") } (the student adds or removes particles with
   *         the + and − buttons under each side) }
   * Particles spread from the crowded side to the other until both sides hold the same number.
   * Returns { update({ left, right, pores, minutes }), show({ values }), values() }
   * values() -> { left, right, difference, rate, equilibrium }   (now, see simkit.physics.diffusion)
   */
  kit.membrane = function (stage, opts) {
    const o = Object.assign({ x: 150, y: 90, w: 700, h: 300, left: 16, right: 4, pores: 2, minutes: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-membrane" });
    const mid = o.x + o.w / 2;
    const sol = () => kit.physics.diffusion(o.left, o.right, o.minutes, o.pores);
    // Fixed scatter positions (the same picture every time): 20 per side.
    const spots = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 20; i++) spots.push([0.08 + 0.8 * rnd(), 0.1 + 0.8 * rnd()]);

    function draw() {
      g.textContent = "";
      const s = sol();
      kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 12, fill: "#e6f1fb", stroke: kit.colors.steel, "stroke-width": 6 }, g);
      // Membrane: a wall with one gap per open channel.
      const pores = kit.clamp(Math.round(o.pores), 0, 5);
      const gapH = 26;
      const seg = o.h / (pores + 1);
      let y0 = o.y;
      for (let i = 0; i <= pores; i++) {
        const y1 = i < pores ? o.y + seg * (i + 1) - gapH / 2 : o.y + o.h;
        kit.el("line", { x1: mid, y1: y0, x2: mid, y2: y1, stroke: kit.colors.green, "stroke-width": 10 }, g);
        y0 = y1 + gapH;
      }
      const side = (count, x0) => {
        const n = kit.clamp(Math.round(count), 0, 20);
        for (let i = 0; i < n; i++) kit.el("circle", { cx: x0 + spots[i][0] * (o.w / 2 - 24) + 6, cy: o.y + spots[i][1] * o.h, r: 9, fill: kit.colors.red, stroke: kit.colors.redDark, "stroke-width": 2 }, g);
      };
      side(s.left, o.x);
      side(s.right, mid + 12);
      // Net flow: an arrow over the membrane, longer when the two sides differ more.
      const len = kit.clamp(Math.abs(s.rate) * 90, 0, 120);
      const ay = o.y - 30;
      if (len >= 12) kit.arrowShape(g, mid - (Math.sign(s.rate) * len) / 2, ay, mid + (Math.sign(s.rate) * len) / 2, ay, { color: kit.colors.orange, width: 6, head: 14 });
      kit.el("text", { x: mid, y: ay - 18, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.orange, text: len >= 12 ? "net flow" : s.difference >= 0.5 ? (pores ? "almost balanced" : "channels closed: no flow") : "balanced: no net flow" }, g);
      const click = o.click || {};
      const count = (value, start, cx, link) => {
        kit.el("text", { x: cx, y: o.y + o.h + 36, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? `${kit.fmt(value, Math.abs(value - Math.round(value)) < 0.05 ? 0 : 1)} particles` : "? particles" }, g);
        if (!kit.linked(link)) return;
        for (const [dx, sign, step] of [[-110, "−", -1], [110, "+", 1]]) {
          const b = kit.el("g", null, g);
          kit.grip(b, cx + dx, o.y + o.h + 30, 22);
          kit.el("text", { x: cx + dx, y: o.y + o.h + 38, "text-anchor": "middle", class: "simkit-label", style: "font-size: 22px", fill: kit.colors.purple, text: sign }, b);
          kit.click(b, link, () => link(start + step));
        }
      };
      count(s.left, o.left, o.x + o.w / 4, click.left);
      count(s.right, o.right, mid + o.w / 4, click.right);
      kit.el("text", { x: mid, y: o.y + o.h + 72, "text-anchor": "middle", class: "simkit-tick", text: `${pores} open channel${pores === 1 ? "" : "s"} · after ${kit.fmt(o.minutes, 0)} min` }, g);
    }

    draw();

    return {
      update(next) {
        for (const key of ["left", "right", "pores", "minutes"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) writes "? particles" under both sides (the dots can still be counted). */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  const BASES = ["", "A", "T", "G", "C"];
  const BASE_COLOR = { A: "green", T: "red", U: "orange", G: "yellow", C: "blue" };

  /**
   * opts: { x=500, y=240 (centre), template="ATGCCA" (2–8 letters of A, T, G, C), bases=[0,…] (the new strand,
   *         one number per template base: 0 = empty, 1 = A, 2 = T, 3 = G, 4 = C), rna=false (true: the new strand
   *         is RNA, so 2 is written U), showMatches=true (bonds for right pairs, a cross for wrong ones, the count),
   *         click: { bases: [app.link("key"), …] } (the student clicks a base of the new strand to change it:
   *         empty → A → T → G → C → empty) }
   * Returns { update({ template, bases: [ … ] }), show({ matches }), values() }
   * values() -> { matches, correct, complete, bonds }   (see simkit.physics.basePairs)
   */
  kit.dnaStrand = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 240, template: "ATGCCA", bases: [], rna: false, showMatches: true }, opts);
    const g = stage.layer({ class: "simkit-dna" });
    const sol = () => kit.physics.basePairs(o.template, o.bases);

    function draw() {
      g.textContent = "";
      const letters = String(o.template).toUpperCase().slice(0, 8).split("");
      const n = letters.length;
      const size = 74;
      const gap = 14;
      const left = o.x - (n * size + (n - 1) * gap) / 2;
      const topY = o.y - 110;
      const botY = o.y + 36;
      const s = sol();
      const box = (parent, bx, by, letter) => {
        const color = letter ? kit.colors[BASE_COLOR[letter]] : "#fff";
        kit.el("rect", { x: bx, y: by, width: size, height: size, rx: 12, fill: color, "fill-opacity": letter ? 0.35 : 1, stroke: letter ? color : kit.colors.steel, "stroke-width": 3 }, parent);
        kit.el("text", { x: bx + size / 2, y: by + size / 2 + 12, "text-anchor": "middle", class: "simkit-label", style: "font-size: 34px", fill: letter ? kit.colors.ink : kit.colors.muted, text: letter || "?" }, parent);
      };
      // Backbones behind the two rows.
      kit.el("line", { x1: left - 16, y1: topY + size / 2, x2: left + n * (size + gap) - gap + 16, y2: topY + size / 2, stroke: kit.colors.steel, "stroke-width": 6 }, g);
      kit.el("line", { x1: left - 16, y1: botY + size / 2, x2: left + n * (size + gap) - gap + 16, y2: botY + size / 2, stroke: kit.colors.steel, "stroke-width": 6 }, g);
      letters.forEach((letter, i) => {
        const bx = left + i * (size + gap);
        box(g, bx, topY, letter);
        const code = Number(o.bases[i]) || 0;
        const mine = code === 2 && o.rna ? "U" : BASES[code];
        const cell = kit.el("g", null, g);
        box(cell, bx, botY, mine);
        const link = o.click && o.click.bases && o.click.bases[i];
        if (link) kit.click(cell, link, () => link((code + 1) % 5));
        if (!code || !o.showMatches) return;
        const cx = bx + size / 2;
        const y1 = topY + size + 8;
        const y2 = botY - 8;
        if (s.matches[i]) {
          // Hydrogen bonds: two for A–T, three for G–C.
          const bonds = letter === "G" || letter === "C" ? 3 : 2;
          for (let k = 0; k < bonds; k++) kit.el("line", { x1: cx + (k - (bonds - 1) / 2) * 12, y1, x2: cx + (k - (bonds - 1) / 2) * 12, y2, stroke: kit.colors.green, "stroke-width": 4, "stroke-dasharray": "5 5" }, g);
        } else kit.el("path", { d: `M ${cx - 11} ${(y1 + y2) / 2 - 11} l 22 22 m 0 -22 l -22 22`, stroke: kit.colors.red, "stroke-width": 5, "stroke-linecap": "round" }, g);
      });
      kit.el("text", { x: left - 30, y: topY + size / 2 + 6, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: "template" }, g);
      kit.el("text", { x: left - 30, y: botY + size / 2 + 6, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: o.rna ? "new RNA" : "new strand" }, g);
      kit.el("text", { x: o.x, y: botY + size + 44, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showMatches ? `${s.correct} of ${n} bases paired correctly` : "pairs correct: ?" }, g);
    }

    draw();

    return {
      update(next) {
        if (next.template != null) o.template = next.template;
        if (next.bases) o.bases = next.bases.slice();
        draw();
      },
      /** show({ matches: false }) removes the bonds, the crosses and the count (for steps that ask which pairs are right). */
      show(which) {
        if (which.matches != null) o.showMatches = which.matches;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=500, y=250 (centre), stage=0 (0 interphase, 1 prophase, 2 metaphase, 3 anaphase, 4 telophase,
   *         5 cytokinesis), pairs=2 (pairs of chromosomes, 1–4), showName=true (the name of the stage),
   *         showCount=true (the number of chromosomes),
   *         click: { stage: app.link("key") } (the student clicks the cell to move to the next stage) }
   * Returns { update({ stage, pairs }), show({ name, count }), values() }
   * values() -> { name, cells, chromosomes, perCell }   (see simkit.physics.mitosis)
   */
  kit.mitosis = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 250, stage: 0, pairs: 2, showName: true, showCount: true }, opts);
    const g = stage.layer({ class: "simkit-mitosis" });
    const COLORS = ["blue", "red", "green", "orange"];
    const sol = () => kit.physics.mitosis(o.stage, o.pairs);

    function draw() {
      g.textContent = "";
      const st = kit.clamp(Math.round(o.stage), 0, 5);
      const pairs = kit.clamp(Math.round(o.pairs), 1, 4);
      const n = pairs * 2; // chromosomes before the copies separate
      const cell = kit.el("g", null, g);
      const membrane = { fill: "#fdf3d8", stroke: kit.colors.orange, "stroke-width": 4 };
      const color = (i) => kit.colors[COLORS[Math.floor(i / 2) % 4]];
      const slot = (i, count, spread) => (i - (count - 1) / 2) * spread;
      // One chromosome drawn as an X (two joined copies), a single rod, or a thin thread.
      const xShape = (cx, cy, i) => {
        kit.el("path", { d: `M ${cx - 9} ${cy - 13} L ${cx + 9} ${cy + 13} M ${cx + 9} ${cy - 13} L ${cx - 9} ${cy + 13}`, stroke: color(i), "stroke-width": 7, "stroke-linecap": "round" }, cell);
      };
      const rod = (cx, cy, i, lean) => kit.el("line", { x1: cx - lean * 9, y1: cy - 12, x2: cx + lean * 9, y2: cy + 12, stroke: color(i), "stroke-width": 7, "stroke-linecap": "round" }, cell);
      const thread = (cx, cy, i) => kit.el("path", { d: `M ${cx - 14} ${cy} q 7 -12 14 0 t 14 0`, fill: "none", stroke: color(i), "stroke-width": 3, "stroke-linecap": "round" }, cell);
      const nucleus = (cx, r, dashed) => kit.el("circle", Object.assign({ cx, cy: o.y, r, fill: "#fff", "fill-opacity": 0.7, stroke: kit.colors.steel, "stroke-width": 3 }, dashed ? { "stroke-dasharray": "7 7" } : {}), cell);
      const inside = (cx, r, count, draw1) => {
        for (let i = 0; i < count; i++) {
          const a = (i / count) * 2 * Math.PI + 0.5;
          draw1(cx + Math.cos(a) * r * 0.5, o.y + Math.sin(a) * r * 0.5, i);
        }
      };
      if (st === 5) {
        for (const dx of [-112, 112]) {
          kit.el("circle", Object.assign({ cx: o.x + dx, cy: o.y, r: 104 }, membrane), cell);
          nucleus(o.x + dx, 54);
          inside(o.x + dx, 54, n, thread);
        }
      } else if (st === 4) {
        // The cell pinches in the middle while a nucleus forms around each set.
        kit.el("path", Object.assign({ d: `M ${o.x} ${o.y - 96} C ${o.x + 80} ${o.y - 170} ${o.x + 215} ${o.y - 120} ${o.x + 215} ${o.y} C ${o.x + 215} ${o.y + 120} ${o.x + 80} ${o.y + 170} ${o.x} ${o.y + 96} C ${o.x - 80} ${o.y + 170} ${o.x - 215} ${o.y + 120} ${o.x - 215} ${o.y} C ${o.x - 215} ${o.y - 120} ${o.x - 80} ${o.y - 170} ${o.x} ${o.y - 96} Z` }, membrane), cell);
        for (const side of [-1, 1]) {
          nucleus(o.x + side * 112, 58, true);
          inside(o.x + side * 112, 58, n, (cx, cy, i) => rod(cx, cy, i, side));
        }
      } else {
        kit.el("circle", Object.assign({ cx: o.x, cy: o.y, r: 150 }, membrane), cell);
        if (st === 0) {
          nucleus(o.x, 78);
          inside(o.x, 78, n, thread);
        } else if (st === 1) {
          nucleus(o.x, 84, true);
          inside(o.x, 84, n, xShape);
        } else {
          // Spindle fibres from the two poles to each chromosome.
          for (let i = 0; i < n; i++) {
            const cy = o.y + slot(i, n, Math.min(40, 230 / n));
            for (const side of [-1, 1]) kit.el("line", { x1: o.x + side * 128, y1: o.y, x2: o.x + (st === 2 ? 0 : side * 62), y2: cy, stroke: kit.colors.steel, "stroke-width": 1 }, cell);
            if (st === 2) xShape(o.x, cy, i);
            else for (const side of [-1, 1]) rod(o.x + side * 62, cy, i, side);
          }
          for (const side of [-1, 1]) kit.el("circle", { cx: o.x + side * 128, cy: o.y, r: 5, fill: kit.colors.steel }, cell);
        }
      }
      const link = o.click && o.click.stage;
      if (kit.linked(link)) kit.el("circle", { cx: o.x, cy: o.y, r: st >= 4 ? 232 : 166, fill: "none", stroke: kit.colors.purple, "stroke-opacity": 0.5, "stroke-width": 2, "stroke-dasharray": "4 5", "pointer-events": "none", class: "simkit-grip" }, g);
      if (link) kit.click(cell, link, () => link(st >= 5 ? 0 : st + 1));
      const s = sol();
      kit.el("text", { x: o.x, y: o.y + 208, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: o.showName ? `${st + 1}. ${s.name}` : `${st + 1}. ?` }, g);
      kit.el("text", { x: o.x, y: o.y + 236, "text-anchor": "middle", class: "simkit-tick", text: o.showCount ? s.cells > 1 ? `2 cells · ${s.perCell} chromosomes in each` : `1 cell · ${s.perCell} chromosomes` : "chromosomes in each cell: ?" }, g);
    }

    draw();

    return {
      update(next) {
        if (next.stage != null) o.stage = next.stage;
        if (next.pairs != null) o.pairs = next.pairs;
        draw();
      },
      /** show({ name: false }) writes "?" for the stage name; show({ count: false }) hides the chromosome count. */
      show(which) {
        if (which.name != null) o.showName = which.name;
        if (which.count != null) o.showCount = which.count;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=110, y=60, w=620, h=340 (the graph), prey0=60, pred0=10 (animals at the start), birth=0.5 (prey
   *         births per animal per year, 0.2–1), hunt=0.02 (how well predators catch prey, 0.01–0.05), years=8
   *         (time shown, 0–20), preyName="rabbits", predName="foxes", showValues=true (the two numbers now),
   *         drag: { years: app.link("key") } (the student drags the time marker along the graph) }
   * The graph is drawn only up to `years`, so later values cannot be read ahead.
   * Returns { update({ prey0, pred0, birth, hunt, years }), show({ values }), values() }
   * values() -> { prey, predators, preyEq, predEq }   (see simkit.physics.predatorPrey)
   */
  kit.predatorPrey = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 60, w: 620, h: 340, prey0: 60, pred0: 10, birth: 0.5, hunt: 0.02, years: 8, preyName: "rabbits", predName: "foxes", showValues: true }, opts);
    const g = stage.layer({ class: "simkit-predprey" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const MAX_T = 20;
    const X = (t) => o.x + (t / MAX_T) * o.w;
    const scrub = o.drag && o.drag.years;
    const dragger = kit.drag(stage, handle, scrub, (p) => scrub(kit.clamp(((p.x - o.x) / o.w) * MAX_T, 0, MAX_T)));
    const sol = () => {
      const s = kit.physics.predatorPrey(o.prey0, o.pred0, o.birth, o.hunt, o.years);
      return { prey: s.prey, predators: s.predators, preyEq: s.preyEq, predEq: s.predEq };
    };

    function draw() {
      pic.textContent = "";
      // The scale comes from the whole 20 years, so it does not jump while the time marker moves.
      const all = kit.physics.predatorPrey(o.prey0, o.pred0, o.birth, o.hunt, MAX_T).series;
      const peak = Math.max(10, ...all.map((r) => Math.max(r[1], r[2])));
      const step = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find((v) => peak / v <= 5) || 5000;
      const top = Math.ceil(peak / step) * step;
      const Y = (v) => o.y + o.h - (Math.min(v, top) / top) * o.h;
      kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, fill: "#fff", stroke: kit.colors.line, "stroke-width": 1 }, pic);
      for (let v = 0; v <= top + 1e-9; v += step) {
        kit.el("line", { x1: o.x, y1: Y(v), x2: o.x + o.w, y2: Y(v), stroke: kit.colors.line, "stroke-width": 1 }, pic);
        kit.el("text", { x: o.x - 10, y: Y(v) + 5, "text-anchor": "end", class: "simkit-tick", text: String(v) }, pic);
      }
      for (let t = 0; t <= MAX_T; t += 5) kit.el("text", { x: X(t), y: o.y + o.h + 24, "text-anchor": "middle", class: "simkit-tick", text: String(t) }, pic);
      kit.el("text", { x: o.x + o.w / 2, y: o.y + o.h + 50, "text-anchor": "middle", class: "simkit-tick", text: "time (years)" }, pic);
      kit.el("line", { x1: o.x, y1: o.y, x2: o.x, y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      kit.el("line", { x1: o.x, y1: o.y + o.h, x2: o.x + o.w, y2: o.y + o.h, stroke: kit.colors.ink, "stroke-width": 2 }, pic);
      const shown = all.filter((r) => r[0] <= o.years + 1e-9);
      const now = kit.physics.predatorPrey(o.prey0, o.pred0, o.birth, o.hunt, o.years);
      const line = (col, color) => kit.el("path", { d: shown.map((r, i) => `${i ? "L" : "M"} ${X(r[0]).toFixed(1)} ${Y(r[col]).toFixed(1)}`).join(" "), fill: "none", stroke: color, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" }, pic);
      line(1, kit.colors.blue);
      line(2, kit.colors.red);
      const tx = X(kit.clamp(o.years, 0, MAX_T));
      kit.el("line", { x1: tx, y1: o.y, x2: tx, y2: o.y + o.h, stroke: kit.colors.muted, "stroke-width": 2, "stroke-dasharray": "6 6" }, pic);
      kit.el("circle", { cx: tx, cy: Y(now.prey), r: 7, fill: kit.colors.blue, stroke: "#fff", "stroke-width": 2 }, pic);
      kit.el("circle", { cx: tx, cy: Y(now.predators), r: 7, fill: kit.colors.red, stroke: "#fff", "stroke-width": 2 }, pic);
      // Legend beside the graph: the numbers at the time marker.
      const lx = o.x + o.w + 36;
      const row = (i, color, name, v) => {
        kit.el("circle", { cx: lx + 8, cy: o.y + 34 + i * 62, r: 8, fill: color }, pic);
        kit.el("text", { x: lx + 26, y: o.y + 40 + i * 62, class: "simkit-label", fill: color, text: name }, pic);
        kit.el("text", { x: lx + 26, y: o.y + 64 + i * 62, class: "simkit-label", fill: kit.colors.ink, text: o.showValues ? kit.fmt(v, 0) : "?" }, pic);
      };
      row(0, kit.colors.blue, o.preyName, now.prey);
      row(1, kit.colors.red, o.predName, now.predators);
      kit.el("text", { x: lx, y: o.y + 170, class: "simkit-tick", text: `after ${kit.fmt(o.years, 1)} years` }, pic);
      handle.textContent = "";
      if (kit.linked(scrub)) kit.grip(handle, tx, o.y + o.h, 22);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["prey0", "pred0", "birth", "hunt", "years"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) writes "?" for both numbers (the curves stay). */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };
})();
