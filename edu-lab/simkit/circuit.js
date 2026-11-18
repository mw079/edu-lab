/* simkit.circuit: battery with resistors/bulbs in series or parallel, animated charge flow. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=140, y=110, w=600, h=320, layout: "series"|"parallel", V=9,
   *         parts: [{ id, type: "resistor"|"bulb", R, label }]  (1-4 parts),
   *         showValues=true (current/voltage labels next to parts), flow=true }
   * Returns { update({ V, layout, parts: { [id]: { R } } }), showValues(bool), values() }
 * Changing layout redraws the circuit (e.g. a step that switches from series to parallel).
   * values() -> { totalR, current, parts: { [id]: { R, I, V, P } } }
   */
  kit.circuit = function (stage, opts) {
    const o = Object.assign({ x: 140, y: 110, w: 600, h: 320, layout: "series", V: 9, parts: [], showValues: true, flow: true }, opts);
    const parts = o.parts.slice(0, 4).map((p, i) => ({ id: p.id || `R${i + 1}`, type: p.type || "resistor", R: p.R ?? 10, label: p.label || p.id || `R${i + 1}` }));
    const g = stage.layer({ class: "simkit-circuit" });
    const wires = kit.el("g", null, g);
    const dotsG = kit.el("g", null, g);
    const bodies = kit.el("g", null, g);
    const labels = kit.el("g", null, g);
    const L = o.x;
    const R = o.x + o.w;
    const T = o.y;
    const B = o.y + o.h;
    const midY = (T + B) / 2;
    let solved;
    let showValues = o.showValues;

    let slots, segments, partEls;

    // Battery (vertical on the left side; long plate = + at the top). Drawn once.
    const bat = kit.el("g", null, g);
    const batLabel = kit.el("text", { x: L + 52, y: midY + 6, "text-anchor": "start", class: "simkit-label", fill: kit.colors.ink }, g);

    // (Re)build everything that depends on the layout: wires, parts, labels, charge dots.
    function build() {
      [wires, dotsG, bodies, labels].forEach((el) => (el.textContent = ""));
      // Geometry: where each part sits and the loop each charge path follows.
      slots = parts.map((p, i) => {
        if (o.layout === "parallel") {
          // The last branch forms the right-hand side of the circuit.
          return { x: L + (o.w * (i + 1)) / parts.length, y: midY, vertical: true };
        }
        return { x: L + (o.w * (i + 1)) / (parts.length + 1), y: T, vertical: false };
      });

      // Straight wire segments in the direction of conventional current (out of + at the top).
      // current(sol) gives the current through that segment.
      function buildSegments() {
        const segs = [];
        const add = (x1, y1, x2, y2, current) => segs.push({ x1, y1, x2, y2, current });
        add(L, midY, L, T, (sol) => sol.current);
        if (o.layout === "parallel") {
          let prev = L;
          slots.forEach((sl, i) => {
            const remaining = (sol) => sol.parts.slice(i).reduce((sum, q) => sum + q.I, 0);
            add(prev, T, sl.x, T, remaining);
            add(sl.x, T, sl.x, B, (sol) => sol.parts[i].I);
            add(sl.x, B, prev, B, remaining);
            prev = sl.x;
          });
        } else {
          add(L, T, R, T, (sol) => sol.current);
          add(R, T, R, B, (sol) => sol.current);
          add(R, B, L, B, (sol) => sol.current);
        }
        add(L, B, L, midY, (sol) => sol.current);
        return segs;
      }
      segments = buildSegments();
      segments.forEach((sg) => kit.el("line", { x1: sg.x1, y1: sg.y1, x2: sg.x2, y2: sg.y2, stroke: kit.colors.ink, "stroke-width": 4, "stroke-linecap": "square" }, wires));

      bat.textContent = "";
      kit.el("rect", { x: L - 40, y: midY - 30, width: 80, height: 60, fill: kit.colors.paper }, bat);
      kit.el("line", { x1: L - 34, x2: L + 34, y1: midY - 10, y2: midY - 10, stroke: kit.colors.ink, "stroke-width": 4 }, bat);
      kit.el("line", { x1: L - 18, x2: L + 18, y1: midY + 10, y2: midY + 10, stroke: kit.colors.ink, "stroke-width": 8 }, bat);
      kit.el("text", { x: L + 44, y: midY - 14, class: "simkit-tick", text: "+" }, bat);

      partEls = parts.map((p, i) => {
        const s = slots[i];
        const pg = kit.el("g", { transform: `translate(${s.x} ${s.y})${s.vertical ? " rotate(90)" : ""}` }, bodies);
        kit.el("rect", { x: -48, y: -22, width: 96, height: 44, fill: kit.colors.paper }, pg);
        let glow = null;
        if (p.type === "bulb") {
          glow = kit.el("circle", { cx: 0, cy: 0, r: 44, fill: kit.colors.yellow, opacity: 0 }, pg);
          kit.el("line", { x1: -48, x2: -22, y1: 0, y2: 0, stroke: kit.colors.ink, "stroke-width": 4 }, pg);
          kit.el("line", { x1: 22, x2: 48, y1: 0, y2: 0, stroke: kit.colors.ink, "stroke-width": 4 }, pg);
          kit.el("circle", { cx: 0, cy: 0, r: 22, fill: "#fff", "fill-opacity": 0.6, stroke: kit.colors.ink, "stroke-width": 3 }, pg);
          kit.el("path", { d: "M -15 -15 L 15 15 M -15 15 L 15 -15", stroke: kit.colors.ink, "stroke-width": 3 }, pg);
        } else {
          const pts = [`-48,0`, `-36,0`];
          for (let k = 0; k < 6; k++) pts.push(`${-30 + k * 12},${k % 2 ? 12 : -12}`);
          pts.push(`36,0`, `48,0`);
          kit.el("polyline", { points: pts.join(" "), fill: "none", stroke: kit.colors.ink, "stroke-width": 4, "stroke-linejoin": "round" }, pg);
        }
        const name = kit.el("text", { "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, labels);
        const value = kit.el("text", { "text-anchor": "middle", class: "simkit-tick" }, labels);
        if (s.vertical) {
          kit.set(name, { x: s.x + 58, y: s.y - 4, "text-anchor": "start" });
          kit.set(value, { x: s.x + 58, y: s.y + 16, "text-anchor": "start" });
        } else {
          kit.set(name, { x: s.x, y: s.y - 34 });
          kit.set(value, { x: s.x, y: s.y + 44 });
        }
        return { glow, name, value };
      });

      // Charge-flow dots: evenly spaced on each segment, moving at a speed proportional to its current.
      const SPACING = 44;
      segments.forEach((sg) => {
        sg.len = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1);
        const count = Math.max(1, Math.round(sg.len / SPACING));
        sg.gap = sg.len / count;
        sg.offset = 0;
        sg.speed = 0;
        sg.dots = Array.from({ length: count }, () => kit.el("circle", { r: 5, fill: kit.colors.yellow, stroke: kit.colors.orange, "stroke-width": 1.5 }, dotsG));
      });
    }

    function placeDots() {
      segments.forEach((sg) => {
        sg.dots.forEach((d, i) => {
          const f = ((sg.offset + i * sg.gap) % sg.len) / sg.len;
          kit.set(d, { cx: (sg.x1 + (sg.x2 - sg.x1) * f).toFixed(1), cy: (sg.y1 + (sg.y2 - sg.y1) * f).toFixed(1) });
        });
      });
    }

    function solve() {
      solved = kit.physics.circuit(o.layout === "parallel" ? "parallel" : "series", o.V, parts.map((p) => p.R));
      const maxP = 12;
      parts.forEach((p, i) => {
        const v = solved.parts[i];
        const el = partEls[i];
        kit.set(el.name, { text: `${p.label} = ${kit.fmt(p.R, p.R % 1 ? 1 : 0)} Ω` });
        kit.set(el.value, { text: showValues ? `${kit.fmt(v.I, 2)} A · ${kit.fmt(v.V, 2)} V` : "" });
        if (el.glow) kit.set(el.glow, { opacity: kit.clamp(v.P / maxP, 0, 1) * 0.85 });
      });
      kit.set(batLabel, { text: `${kit.fmt(o.V, o.V % 1 ? 1 : 0)} V` });
      segments.forEach((sg) => (sg.speed = kit.clamp(sg.current(solved) * 40, 0, 400)));
    }

    build();
    solve();
    placeDots();
    if (o.flow) {
      stage.onFrame((dt) => {
        segments.forEach((sg) => (sg.offset = (sg.offset + sg.speed * dt) % sg.len));
        placeDots();
      });
    }

    return {
      update(next) {
        if (next.V != null) o.V = next.V;
        if (next.layout && next.layout !== o.layout) {
          o.layout = next.layout === "parallel" ? "parallel" : "series";
          build();
          placeDots();
        }
        if (next.parts) parts.forEach((p) => next.parts[p.id] && next.parts[p.id].R != null && (p.R = next.parts[p.id].R));
        solve();
      },
      showValues(visible) {
        showValues = visible;
        solve();
      },
      values() {
        return {
          totalR: solved.totalR,
          current: solved.current,
          parts: Object.fromEntries(parts.map((p, i) => [p.id, solved.parts[i]])),
        };
      },
    };
  };
})();
