/* simkit.codonChain, simkit.robotGrid, simkit.cuboidNet, simkit.ratioLine, simkit.samplingBox. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=220 (centre), mrna="AUGGCUUGGUAA" (2–5 codons), picks=[0,…] (the student's amino acid per
   *         codon: 0 = empty, k = the k-th name in the list under the picture), showMatches=true (ticks and
   *         crosses and the count), showTable=true (which codons stand for each offered amino acid),
   *         click: { picks: [app.link("key"), …] } (the student clicks a bead to step through the amino acids) }
   * Returns { update({ mrna, picks: [ … ] }), show({ matches, table }), values() }
   * values() -> { codons, protein, choices, answer, matches, correct, complete }   (see simkit.physics.translate)
   */
  kit.codonChain = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 220, mrna: "AUGGCUUGGUAA", picks: [], showMatches: true, showTable: true }, opts);
    const g = stage.layer({ class: "simkit-codons" });
    const BASE_COLOR = { A: "green", U: "orange", G: "yellow", C: "blue" };
    const sol = () => kit.physics.translate(o.mrna, o.picks);

    function draw() {
      g.textContent = "";
      const s = sol();
      const n = s.codons.length;
      const cw = 150;
      const left = o.x - (n * cw) / 2;
      const topY = o.y - 120;
      kit.el("text", { x: left - 16, y: topY + 34, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: "mRNA" }, g);
      kit.el("text", { x: left - 16, y: topY + 176, "text-anchor": "end", class: "simkit-label", fill: kit.colors.ink, text: "protein" }, g);
      s.codons.forEach((codon, i) => {
        const cx = left + i * cw + cw / 2;
        // One codon: three letters in a frame.
        kit.el("rect", { x: cx - 64, y: topY, width: 128, height: 54, rx: 10, fill: "#fff", stroke: kit.colors.steel, "stroke-width": 2 }, g);
        codon.split("").forEach((letter, k) => {
          kit.el("rect", { x: cx - 58 + k * 40, y: topY + 6, width: 36, height: 42, rx: 6, fill: kit.colors[BASE_COLOR[letter]] || "#fff", "fill-opacity": 0.35 }, g);
          kit.el("text", { x: cx - 40 + k * 40, y: topY + 36, "text-anchor": "middle", class: "simkit-label", style: "font-size: 22px", fill: kit.colors.ink, text: letter }, g);
        });
        kit.el("line", { x1: cx, y1: topY + 58, x2: cx, y2: topY + 128, stroke: kit.colors.steel, "stroke-width": 2, "stroke-dasharray": "4 5" }, g);
        if (i) kit.el("line", { x1: cx - cw + 40, y1: topY + 168, x2: cx - 40, y2: topY + 168, stroke: kit.colors.steel, "stroke-width": 5 }, g);
        const pick = Number(o.picks[i]) || 0;
        const name = pick ? s.choices[pick - 1] || "?" : "";
        const bead = kit.el("g", null, g);
        const right = s.matches[i];
        kit.el("circle", { cx, cy: topY + 168, r: 40, fill: !pick ? "#fff" : name === "Stop" ? "#e6e8ea" : kit.colors.purple, "fill-opacity": pick && name !== "Stop" ? 0.3 : 1, stroke: !pick ? kit.colors.steel : o.showMatches ? (right ? kit.colors.green : kit.colors.red) : kit.colors.purple, "stroke-width": pick && o.showMatches ? 5 : 3 }, bead);
        kit.el("text", { x: cx, y: topY + 176, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: pick ? kit.colors.ink : kit.colors.muted, text: name || "?" }, bead);
        const link = o.click && o.click.picks && o.click.picks[i];
        if (link) kit.click(bead, link, () => link((pick + 1) % (s.choices.length + 1)));
        if (pick && o.showMatches) kit.el("text", { x: cx, y: topY + 236, "text-anchor": "middle", class: "simkit-label", fill: right ? kit.colors.green : kit.colors.red, text: right ? "✓" : "✗" }, g);
      });
      kit.el("text", { x: o.x, y: topY + 274, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showMatches ? `${s.correct} of ${n} amino acids right` : "amino acids right: ?" }, g);
      if (!o.showTable) return;
      // Codon chart for the amino acids on offer, numbered as the sliders count them.
      const all = "UUU UUC UUA UUG CUU CUC CUA CUG AUU AUC AUA AUG GUU GUC GUA GUG UCU UCC UCA UCG CCU CCC CCA CCG ACU ACC ACA ACG GCU GCC GCA GCG UAU UAC UAA UAG CAU CAC CAA CAG AAU AAC AAA AAG GAU GAC GAA GAG UGU UGC UGA UGG CGU CGC CGA CGG AGU AGC AGA AGG GGU GGC GGA GGG".split(" ");
      const cols = 3;
      s.choices.forEach((name, k) => {
        const codons = all.filter((c) => kit.physics.codon(c) === name);
        const tx = o.x - 440 + (k % cols) * 300;
        const ty = topY + 318 + Math.floor(k / cols) * 26;
        kit.el("text", { x: tx, y: ty, class: "simkit-tick", text: `${k + 1}. ${name}: ${codons.slice(0, 4).join(" ")}${codons.length > 4 ? " …" : ""}` }, g);
      });
    }

    draw();

    return {
      update(next) {
        if (next.mrna != null) o.mrna = next.mrna;
        if (next.picks) o.picks = next.picks.slice();
        draw();
      },
      /** show({ matches: false }) removes ticks, crosses and the count; show({ table: false }) removes the codon chart. */
      show(which) {
        if (which.matches != null) o.showMatches = which.matches;
        if (which.table != null) o.showTable = which.table;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=90, y=70 (top-left of the grid), cell=62, cols=8, rows=6, repeat=4, forward=2, turn=1 (0 none,
   *         1 left, 2 right), targetX, targetY (a flag on that square, optional), showPath=true (false: the robot
   *         waits at the start, for steps that ask where it will end),
   *         click: { repeat, forward, turn } (app.link per key: the student clicks a program line to change it) }
   * The robot starts on square (1, 1), bottom left, facing east; x counts to the right, y counts up.
   * Returns { update({ repeat, forward, turn, targetX, targetY }), show({ path }), run() -> Promise, stop(), values() }
   * values() -> { x, y, facing, path, moves, crashed }   (see simkit.physics.robot)
   */
  kit.robotGrid = function (stage, opts) {
    const o = Object.assign({ x: 90, y: 70, cell: 62, cols: 8, rows: 6, repeat: 4, forward: 2, turn: 1, showPath: true }, opts);
    const g = stage.layer({ class: "simkit-robot" });
    const CX = (gx) => o.x + (gx - 0.5) * o.cell;
    const CY = (gy) => o.y + (o.rows - gy + 0.5) * o.cell;
    let anim = null;
    let progress = null; // squares moved so far while the program runs
    const sol = () => kit.physics.robot(o.repeat, o.forward, o.turn, o.cols, o.rows);
    const ANGLE = { east: 0, north: -90, west: 180, south: 90 };

    function draw() {
      g.textContent = "";
      for (let c = 0; c <= o.cols; c++) kit.el("line", { x1: o.x + c * o.cell, y1: o.y, x2: o.x + c * o.cell, y2: o.y + o.rows * o.cell, stroke: kit.colors.line, "stroke-width": c % o.cols ? 1 : 2 }, g);
      for (let r = 0; r <= o.rows; r++) kit.el("line", { x1: o.x, y1: o.y + r * o.cell, x2: o.x + o.cols * o.cell, y2: o.y + r * o.cell, stroke: kit.colors.line, "stroke-width": r % o.rows ? 1 : 2 }, g);
      for (let c = 1; c <= o.cols; c++) kit.el("text", { x: CX(c), y: o.y + o.rows * o.cell + 22, "text-anchor": "middle", class: "simkit-tick", text: String(c) }, g);
      for (let r = 1; r <= o.rows; r++) kit.el("text", { x: o.x - 12, y: CY(r) + 5, "text-anchor": "end", class: "simkit-tick", text: String(r) }, g);
      if (o.targetX > 0 && o.targetY > 0) {
        const fx = CX(o.targetX);
        const fy = CY(o.targetY);
        kit.el("rect", { x: fx - o.cell / 2 + 3, y: fy - o.cell / 2 + 3, width: o.cell - 6, height: o.cell - 6, rx: 8, fill: kit.colors.green, "fill-opacity": 0.2, stroke: kit.colors.green, "stroke-width": 2 }, g);
        kit.el("path", { d: `M ${fx - 8} ${fy + 18} v -36 l 22 9 l -22 9`, fill: kit.colors.green, stroke: kit.colors.greenDark, "stroke-width": 2, "stroke-linejoin": "round" }, g);
      }
      const s = sol();
      const full = o.showPath || progress != null;
      const upTo = progress != null ? Math.min(progress, s.path.length - 1) : full ? s.path.length - 1 : 0;
      const whole = Math.floor(upTo);
      const pts = s.path.slice(0, whole + 1).map(([px, py]) => [CX(px), CY(py)]);
      let here = pts[pts.length - 1];
      let heading = "east";
      if (whole < s.path.length - 1 && upTo > whole) {
        const [nx, ny] = [CX(s.path[whole + 1][0]), CY(s.path[whole + 1][1])];
        here = [here[0] + (nx - here[0]) * (upTo - whole), here[1] + (ny - here[1]) * (upTo - whole)];
        pts.push(here);
      }
      // Heading: the direction of the last move drawn, or the final facing once the program has finished.
      if (pts.length > 1) {
        const [ax, ay] = pts[pts.length - 2];
        heading = Math.abs(here[0] - ax) > Math.abs(here[1] - ay) ? (here[0] > ax ? "east" : "west") : here[1] < ay ? "north" : "south";
      }
      if (upTo >= s.path.length - 1 && full) heading = s.facing;
      if (pts.length > 1) kit.el("polyline", { points: pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "), fill: "none", stroke: kit.colors.purple, "stroke-width": 4, "stroke-dasharray": "2 9", "stroke-linecap": "round" }, g);
      kit.el("circle", { cx: CX(1), cy: CY(1), r: 6, fill: kit.colors.steel }, g);
      const bot = kit.el("g", { transform: `translate(${here[0].toFixed(1)} ${here[1].toFixed(1)}) rotate(${ANGLE[heading]})` }, g);
      kit.el("rect", { x: -20, y: -17, width: 40, height: 34, rx: 9, fill: kit.colors.blue, stroke: kit.colors.blueDark, "stroke-width": 2 }, bot);
      kit.el("path", { d: "M 8 -9 L 20 0 L 8 9 Z", fill: "#fff" }, bot);
      if (s.crashed && upTo >= s.path.length - 1 && full) kit.el("text", { x: o.x + (o.cols * o.cell) / 2, y: o.y - 14, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.red, text: "the robot hit the wall and stopped" }, g);
      // The program, beside the grid; each changeable line can be clicked.
      const lx = o.x + o.cols * o.cell + 46;
      const click = o.click || {};
      kit.el("text", { x: lx, y: o.y + 26, class: "simkit-label", fill: kit.colors.ink, text: "Program" }, g);
      const lines = [
        ["repeat", `repeat ${kit.fmt(o.repeat, 0)} times:`, 0, () => (o.repeat >= 6 ? 1 : o.repeat + 1)],
        ["forward", `move forward ${kit.fmt(o.forward, 0)}`, 22, () => (o.forward >= 4 ? 1 : o.forward + 1)],
        ["turn", ["do not turn", "turn left", "turn right"][kit.clamp(Math.round(o.turn), 0, 2)], 22, () => (o.turn + 1) % 3],
      ];
      lines.forEach(([key, text, indent, next], i) => {
        const row = kit.el("g", null, g);
        const ly = o.y + 54 + i * 54;
        const on = kit.linked(click[key]);
        kit.el("rect", { x: lx + indent, y: ly, width: 232 - indent, height: 44, rx: 10, fill: "#fff", stroke: on ? kit.colors.purple : kit.colors.steel, "stroke-width": 2, "stroke-dasharray": on ? "4 5" : null }, row);
        kit.el("text", { x: lx + indent + 14, y: ly + 28, class: "simkit-label", fill: kit.colors.ink, text }, row);
        if (click[key]) kit.click(row, click[key], () => click[key](next()));
      });
      kit.el("text", { x: lx, y: o.y + 244, class: "simkit-tick", text: "starts at (1, 1), facing east" }, g);
      if (full && upTo >= s.path.length - 1) kit.el("text", { x: lx, y: o.y + 272, class: "simkit-label", fill: kit.colors.ink, text: `ends at (${s.x}, ${s.y}), facing ${s.facing}` }, g);
    }

    function stop() {
      if (anim) anim.cancel();
      anim = null;
      progress = null;
    }

    draw();

    return {
      update(next) {
        stop();
        for (const key of ["repeat", "forward", "turn", "targetX", "targetY"]) if (next[key] !== undefined) o[key] = next[key];
        draw();
      },
      /** show({ path: false }) keeps the robot at the start until run() is called (for steps that ask where it ends). */
      show(which) {
        if (which.path != null) o.showPath = which.path;
        draw();
      },
      values: sol,
      stop() {
        stop();
        draw();
      },
      /** Run the program: the robot drives its path square by square. */
      run() {
        stop();
        const moves = sol().moves;
        if (!moves) {
          draw();
          return Promise.resolve(true);
        }
        anim = stage.animate(kit.clamp(moves * 0.3, 1, 6), (p) => {
          progress = p * moves;
          draw();
        });
        return anim.then((done) => {
          progress = null;
          draw();
          return done;
        });
      },
    };
  };

  /**
   * opts: { x=500, y=330 (centre of the base), unit=48 (px per length unit), l=3, w=2, h=2 (1–5), fold=0 (0 = flat
   *         net, 100 = closed box), showValues=true (areas on the faces and the totals),
   *         drag: { fold: app.link("key") } (the student lifts the lid to fold the net) }
   * The net is a base with four sides and a lid, drawn in a slanted 3-D view.
   * Returns { update({ l, w, h, fold }), show({ values }), values() }
   * values() -> { surface, volume, base, front, side }   (see simkit.physics.cuboid)
   */
  kit.cuboidNet = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 330, unit: 48, l: 3, w: 2, h: 2, fold: 0, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-net" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const lift = o.drag && o.drag.fold;
    const dragger = kit.drag(stage, handle, lift, (p, start, from) => lift(kit.clamp(from + (start.y - p.y) * 0.6 + (start.x - p.x) * 0.3, 0, 100)), () => o.fold);
    const sol = () => kit.physics.cuboid(o.l, o.w, o.h);
    // Slanted view: x to the right, y back and to the right, z up.
    const P = ([x, y, z]) => [o.x + (x + y * 0.45) * o.unit, o.y - (y * 0.42 + z) * o.unit];

    function draw() {
      pic.textContent = "";
      const { l, w, h } = o;
      const t = (kit.clamp(o.fold, 0, 100) / 100) * (Math.PI / 2);
      const c = Math.cos(t);
      const s = Math.sin(t);
      const x0 = -l / 2;
      const x1 = l / 2;
      const y0 = -w / 2;
      const y1 = w / 2;
      // Each side swings up around its edge of the base; the lid hangs on the back side and swings the same angle again.
      const top = [0, y1 + h * c + w * Math.cos(2 * t), h * s + w * Math.sin(2 * t)];
      const faces = [
        { name: "base", area: l * w, pts: [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]] },
        { name: "back", area: l * h, pts: [[x0, y1, 0], [x1, y1, 0], [x1, y1 + h * c, h * s], [x0, y1 + h * c, h * s]] },
        { name: "lid", area: l * w, pts: [[x0, y1 + h * c, h * s], [x1, y1 + h * c, h * s], [x1, top[1], top[2]], [x0, top[1], top[2]]] },
        { name: "left", area: w * h, pts: [[x0, y0, 0], [x0, y1, 0], [x0 - h * c, y1, h * s], [x0 - h * c, y0, h * s]] },
        { name: "right", area: w * h, pts: [[x1, y0, 0], [x1, y1, 0], [x1 + h * c, y1, h * s], [x1 + h * c, y0, h * s]] },
        { name: "front", area: l * h, pts: [[x0, y0, 0], [x1, y0, 0], [x1, y0 - h * c, h * s], [x0, y0 - h * c, h * s]] },
      ];
      const COLOR = { base: kit.colors.blue, lid: kit.colors.blue, back: kit.colors.green, front: kit.colors.green, left: kit.colors.orange, right: kit.colors.orange };
      // Far faces first, so nearer ones cover them.
      const depth = (f) => f.pts.reduce((sum, p) => sum + p[1] - p[2] * 0.01, 0) / 4;
      faces.sort((a, b) => depth(b) - depth(a));
      for (const f of faces) {
        const q = f.pts.map(P);
        kit.el("polygon", { points: q.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "), fill: COLOR[f.name], "fill-opacity": 0.45, stroke: kit.colors.ink, "stroke-width": 2, "stroke-linejoin": "round" }, pic);
        if (o.showValues && o.fold < 15) {
          const cx = q.reduce((sum, p) => sum + p[0], 0) / 4;
          const cy = q.reduce((sum, p) => sum + p[1], 0) / 4;
          kit.el("text", { x: cx, y: cy + 5, "text-anchor": "middle", class: "simkit-tick", fill: kit.colors.ink, text: String(f.area) }, pic);
        }
      }
      const v = sol();
      const ty = o.y + (w / 2 + h) * 0.42 * o.unit + 64;
      kit.el("text", { x: o.x, y: Math.min(ty, 500), "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `length ${l} · width ${w} · height ${h}` }, pic);
      kit.el("text", { x: o.x, y: Math.min(ty, 500) + 28, "text-anchor": "middle", class: "simkit-tick", text: o.showValues ? `surface area ${v.surface} square units · volume ${v.volume} cubes` : "surface area ? · volume ?" }, pic);
      handle.textContent = "";
      if (kit.linked(lift)) {
        const lid = faces.find((f) => f.name === "lid").pts.map(P);
        kit.grip(handle, (lid[2][0] + lid[3][0]) / 2, (lid[2][1] + lid[3][1]) / 2, 22);
      }
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["l", "w", "h", "fold"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ values: false }) removes the face areas and writes "?" for surface area and volume. */
      show(which) {
        if (which.values != null) o.showValues = which.values;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=130, y=200 (left end of the upper line), w=740, a=2, b=3 (the ratio a : b, 1–9), amount=4 (of the
   *         first quantity, 0 … 6 × a), labelA="cups of flour", labelB="eggs", showB=true (false: the matching
   *         amount is "?"), drag: { amount: app.link("key") } (the student drags the marker along the upper line) }
   * Two number lines, one above the other; every a on the upper line lines up with b on the lower one.
   * Returns { update({ a, b, amount }), show({ b }), values() }
   * values() -> { y (matching amount of the second quantity), unitRate, scale }   (see simkit.physics.ratio)
   */
  kit.ratioLine = function (stage, opts) {
    const o = Object.assign({ x: 130, y: 200, w: 740, a: 2, b: 3, amount: 4, labelA: "cups of flour", labelB: "eggs", showB: true }, opts);
    const g = stage.layer({ class: "simkit-ratio" });
    const pic = kit.el("g", null, g);
    const handle = kit.el("g", null, g);
    const STEPS = 6;
    const slide = o.drag && o.drag.amount;
    const dragger = kit.drag(stage, handle, slide, (p) => slide(kit.clamp(((p.x - o.x) / o.w) * STEPS * o.a, 0, STEPS * o.a)));
    const sol = () => kit.physics.ratio(o.a, o.b, o.amount);
    const num = (v) => kit.fmt(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 2);

    function draw() {
      pic.textContent = "";
      const y2 = o.y + 130;
      const s = sol();
      for (const [ly, color, label] of [[o.y, kit.colors.blue, o.labelA], [y2, kit.colors.red, o.labelB]]) {
        kit.el("line", { x1: o.x, y1: ly, x2: o.x + o.w, y2: ly, stroke: color, "stroke-width": 4, "stroke-linecap": "round" }, pic);
        kit.el("text", { x: o.x, y: ly === o.y ? ly - 46 : ly + 62, class: "simkit-label", fill: color, text: label }, pic);
      }
      for (let k = 0; k <= STEPS; k++) {
        const tx = o.x + (k / STEPS) * o.w;
        kit.el("line", { x1: tx, y1: o.y - 10, x2: tx, y2: o.y + 10, stroke: kit.colors.blue, "stroke-width": 3 }, pic);
        kit.el("line", { x1: tx, y1: y2 - 10, x2: tx, y2: y2 + 10, stroke: kit.colors.red, "stroke-width": 3 }, pic);
        kit.el("line", { x1: tx, y1: o.y + 12, x2: tx, y2: y2 - 12, stroke: kit.colors.line, "stroke-width": 1, "stroke-dasharray": "4 5" }, pic);
        kit.el("text", { x: tx, y: o.y - 18, "text-anchor": "middle", class: "simkit-tick", text: num(k * o.a) }, pic);
        // In a step that asks for the matching amount, only the first pair is printed on the lower line.
        kit.el("text", { x: tx, y: y2 + 30, "text-anchor": "middle", class: "simkit-tick", text: o.showB || k <= 1 ? num(k * o.b) : "" }, pic);
      }
      const mx = o.x + (kit.clamp(o.amount, 0, STEPS * o.a) / (STEPS * o.a)) * o.w;
      kit.el("line", { x1: mx, y1: o.y, x2: mx, y2: y2, stroke: kit.colors.purple, "stroke-width": 3 }, pic);
      kit.el("circle", { cx: mx, cy: o.y, r: 9, fill: kit.colors.purple, stroke: "#fff", "stroke-width": 2 }, pic);
      kit.el("circle", { cx: mx, cy: y2, r: 9, fill: kit.colors.purple, stroke: "#fff", "stroke-width": 2 }, pic);
      kit.el("text", { x: o.x + o.w / 2, y: y2 + 112, "text-anchor": "middle", class: "simkit-label", style: "font-size: 20px", fill: kit.colors.ink, text: `${num(o.amount)} ${o.labelA}  →  ${o.showB ? num(s.y) : "?"} ${o.labelB}` }, pic);
      kit.el("text", { x: o.x + o.w / 2, y: y2 + 140, "text-anchor": "middle", class: "simkit-tick", text: `ratio ${num(o.a)} : ${num(o.b)}` }, pic);
      handle.textContent = "";
      if (kit.linked(slide)) kit.grip(handle, mx, o.y, 22);
      dragger.refresh();
    }

    draw();

    return {
      update(next) {
        for (const key of ["a", "b", "amount"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ b: false }) writes "?" for the matching amount and leaves the lower line's later numbers blank. */
      show(which) {
        if (which.b != null) o.showB = which.b;
        draw();
      },
      values: sol,
    };
  };

  /**
   * opts: { x=90, y=80, percent=40 (% red in the population, 10–90), size=20 (marbles per sample, 5–100),
   *         count=1 (samples taken so far, 1–60), showTruth=true (the population's real percentage),
   *         showInterval=true (the 95 % interval around the newest sample),
   *         click: { count: app.link("key") } (the student clicks the jar to take another sample) }
   * Returns { update({ percent, size, count }), show({ truth, interval }), values() }
   * values() -> { results, last, mean, standardError, low, high, contains }   (see simkit.physics.sampling)
   */
  kit.samplingBox = function (stage, opts) {
    const o = Object.assign({ x: 90, y: 80, percent: 40, size: 20, count: 1, showTruth: true, showInterval: true }, opts);
    const g = stage.layer({ class: "simkit-sampling" });
    const sol = () => kit.physics.sampling(o.percent, o.size, o.count);

    function draw() {
      g.textContent = "";
      const s = sol();
      // The jar: 100 marbles in the population's proportion (hidden behind frosted glass if the truth is hidden).
      const jar = kit.el("g", null, g);
      const jw = 230;
      const jh = 250;
      kit.el("rect", { x: o.x, y: o.y, width: jw, height: jh, rx: 22, fill: "#fff", stroke: kit.colors.steel, "stroke-width": 6 }, jar);
      const reds = Math.round(o.percent);
      for (let i = 0; i < 100; i++) {
        const k = (i * 37) % 100; // spread the reds through the jar
        kit.el("circle", { cx: o.x + 22 + (i % 10) * 20.6, cy: o.y + 24 + Math.floor(i / 10) * 22.4, r: 8, fill: !o.showTruth ? "#d9dde1" : k < reds ? kit.colors.red : kit.colors.blue }, jar);
      }
      const link = o.click && o.click.count;
      if (kit.linked(link)) kit.el("rect", { x: o.x - 10, y: o.y - 10, width: jw + 20, height: jh + 20, rx: 28, fill: "none", stroke: kit.colors.purple, "stroke-opacity": 0.5, "stroke-width": 2, "stroke-dasharray": "4 5", "pointer-events": "none", class: "simkit-grip" }, g);
      if (link) kit.click(jar, link, () => link(o.count + 1));
      kit.el("text", { x: o.x + jw / 2, y: o.y + jh + 32, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: o.showTruth ? `population: ${kit.fmt(o.percent, 0)}% red` : "population: ?% red" }, g);
      kit.el("text", { x: o.x + jw / 2, y: o.y + jh + 56, "text-anchor": "middle", class: "simkit-tick", text: `samples of ${kit.fmt(o.size, 0)} marbles` }, g);
      // Dot plot of every sample's result; the newest one is ringed.
      const px = o.x + jw + 90;
      const pw = 500;
      const base = o.y + jh - 20;
      const PX = (v) => px + (v / 100) * pw;
      kit.el("line", { x1: px, y1: base, x2: px + pw, y2: base, stroke: kit.colors.ink, "stroke-width": 2 }, g);
      for (let v = 0; v <= 100; v += 10) {
        kit.el("line", { x1: PX(v), y1: base, x2: PX(v), y2: base + 8, stroke: kit.colors.ink, "stroke-width": 2 }, g);
        if (v % 20 === 0) kit.el("text", { x: PX(v), y: base + 26, "text-anchor": "middle", class: "simkit-tick", text: `${v}%` }, g);
      }
      kit.el("text", { x: px + pw / 2, y: base + 54, "text-anchor": "middle", class: "simkit-tick", text: "red marbles in each sample" }, g);
      if (o.showTruth) kit.el("line", { x1: PX(o.percent), y1: o.y, x2: PX(o.percent), y2: base, stroke: kit.colors.muted, "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
      const stacks = {};
      s.results.forEach((v, i) => {
        const bin = Math.round(v / 5) * 5;
        const level = (stacks[bin] = (stacks[bin] || 0) + 1);
        const newest = i === s.results.length - 1;
        kit.el("circle", { cx: PX(bin), cy: base - 12 - (level - 1) * 15, r: 6.5, fill: kit.colors.purple, "fill-opacity": newest ? 1 : 0.5, stroke: newest ? kit.colors.ink : "none", "stroke-width": 2 }, g);
      });
      if (o.showInterval) {
        const iy = o.y - 6;
        kit.el("line", { x1: PX(s.low), y1: iy, x2: PX(s.high), y2: iy, stroke: kit.colors.orange, "stroke-width": 5, "stroke-linecap": "round" }, g);
        kit.el("circle", { cx: PX(s.last), cy: iy, r: 6, fill: kit.colors.orange, stroke: "#fff", "stroke-width": 2 }, g);
      }
      const n = s.results.length;
      kit.el("text", { x: px + pw / 2, y: o.y - 46, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: `sample ${n}: ${kit.fmt(s.last, 0)}% red${o.showInterval ? ` · 95% interval ${kit.fmt(s.low, 0)}–${kit.fmt(s.high, 0)}%` : ""}` }, g);
      kit.el("text", { x: px + pw / 2, y: base + 84, "text-anchor": "middle", class: "simkit-tick", text: `${n} sample${n === 1 ? "" : "s"} · average of the samples ${kit.fmt(s.mean, 1)}%` }, g);
    }

    draw();

    return {
      update(next) {
        for (const key of ["percent", "size", "count"]) if (next[key] != null) o[key] = next[key];
        draw();
      },
      /** show({ truth: false }) greys the jar and hides the real percentage; show({ interval: false }) removes the interval. */
      show(which) {
        if (which.truth != null) o.showTruth = which.truth;
        if (which.interval != null) o.showInterval = which.interval;
        draw();
      },
      values: sol,
    };
  };
})();
