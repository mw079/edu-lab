/* simkit.numberLine: a number line with movable markers and the distance between two of them. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=100, y=300, w=800, min=-10, max=10, step (tick spacing, default 1 or 2 or 5 to fit),
   *         markers: [{ id, value, color, label }] (1–3), distance: [idA, idB] (optional: bracket with the
   *         distance between two markers), showValues=true (each marker's number), showDistance=true }
   * Returns { update({ markers: { [id]: { value } } }), showValues(bool), showDistance(bool), values() }
   * values() -> { [id]: value, distance }
   */
  kit.numberLine = function (stage, opts) {
    const o = Object.assign({ x: 100, y: 300, w: 800, min: -10, max: 10, markers: [], distance: null, showValues: true, showDistance: true }, opts);
    const g = stage.layer({ class: "simkit-numberline" });
    const X = (v) => o.x + ((v - o.min) / (o.max - o.min)) * o.w;
    const span = o.max - o.min;
    const step = o.step || (span <= 24 ? 1 : span <= 50 ? 2 : span <= 120 ? 5 : 10);
    const palette = [kit.colors.red, kit.colors.blue, kit.colors.green];
    const markers = o.markers.slice(0, 3).map((m, i) => ({ id: m.id || `m${i + 1}`, value: m.value ?? 0, color: m.color || palette[i], label: m.label || "" }));

    kit.arrowShape(g, o.x + o.w / 2, o.y, o.x + o.w + 24, o.y, { color: kit.colors.ink, width: 3, head: 12 });
    kit.arrowShape(g, o.x + o.w / 2, o.y, o.x - 24, o.y, { color: kit.colors.ink, width: 3, head: 12 });
    for (let v = Math.ceil(o.min / step) * step; v <= o.max + 1e-9; v += step) {
      const zero = Math.abs(v) < 1e-9;
      kit.el("line", { x1: X(v), y1: o.y - (zero ? 14 : 8), x2: X(v), y2: o.y + (zero ? 14 : 8), stroke: kit.colors.ink, "stroke-width": zero ? 3 : 2 }, g);
      kit.el("text", { x: X(v), y: o.y + 34, "text-anchor": "middle", class: "simkit-tick", text: kit.fmt(v, step % 1 ? 1 : 0) }, g);
    }
    const dynamic = kit.el("g", null, g);

    function draw() {
      dynamic.textContent = "";
      // Markers sit above the line; two that are close together are stacked so their labels stay readable.
      const placed = [];
      markers.forEach((m) => {
        const x = X(kit.clamp(m.value, o.min, o.max));
        const level = placed.filter((p) => Math.abs(p - x) < 70).length;
        placed.push(x);
        const top = o.y - 44 - level * 48;
        kit.el("line", { x1: x, y1: o.y, x2: x, y2: top + 14, stroke: m.color, "stroke-width": 3 }, dynamic);
        kit.el("circle", { cx: x, cy: top, r: 14, fill: m.color }, dynamic);
        const text = [m.label, o.showValues ? kit.fmt(m.value, step % 1 ? 1 : 0) : ""].filter(Boolean).join(": ");
        kit.el("text", { x, y: top - 22, "text-anchor": "middle", class: "simkit-label", fill: m.color, text }, dynamic);
      });
      if (o.distance && o.showDistance) {
        const [a, b] = o.distance.map((id) => markers.find((m) => m.id === id));
        if (a && b && a.value !== b.value) {
          const x1 = X(Math.min(a.value, b.value));
          const x2 = X(Math.max(a.value, b.value));
          const y = o.y + 62;
          kit.el("path", { d: `M ${x1} ${y - 8} L ${x1} ${y} L ${x2} ${y} L ${x2} ${y - 8}`, fill: "none", stroke: kit.colors.purple, "stroke-width": 3 }, dynamic);
          kit.el("text", { x: (x1 + x2) / 2, y: y + 24, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.purple, text: `distance = ${kit.fmt(Math.abs(a.value - b.value), step % 1 ? 1 : 0)}` }, dynamic);
        }
      }
    }

    draw();

    return {
      update(next) {
        if (next.markers) markers.forEach((m) => next.markers[m.id] && next.markers[m.id].value != null && (m.value = next.markers[m.id].value));
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      showDistance(visible) {
        o.showDistance = visible;
        draw();
      },
      values() {
        const out = Object.fromEntries(markers.map((m) => [m.id, m.value]));
        if (o.distance) out.distance = Math.abs(out[o.distance[0]] - out[o.distance[1]]);
        return out;
      },
    };
  };
})();
