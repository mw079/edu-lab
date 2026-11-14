// kit.arrow(stage, { x, y, dx, dy, color, label, labelSide: "above" | "below", width })
// → { update({ x, y, dx, dy, label, color }), show(bool) }      (dx, dy in stage pixels; y grows downwards)
// Scale physical values to pixels yourself, e.g. 10 px per newton. Draw the object with kit.el first.
// Example state: { F1: 20, F2: 12 }   (two forces on a block, net force)
function (stage, kit) {
  const g = stage.layer();
  kit.el("rect", { x: 440, y: 250, width: 120, height: 80, rx: 8, fill: kit.colors.steel }, g);
  kit.el("text", { x: 500, y: 296, "text-anchor": "middle", class: "simkit-label", fill: "#fff", text: "Block" }, g);
  const right = kit.arrow(stage, { x: 560, y: 290, dx: 0, dy: 0, color: kit.colors.red });
  const left = kit.arrow(stage, { x: 440, y: 290, dx: 0, dy: 0, color: kit.colors.blue });
  const net = kit.arrow(stage, { x: 500, y: 380, dx: 0, dy: 0, color: kit.colors.green, labelSide: "below" });
  const PX = 10;
  return {
    update(s, d, info) {
      right.update({ dx: s.F1 * PX, label: `F₁ = ${s.F1} N` });
      left.update({ dx: -s.F2 * PX, label: `F₂ = ${s.F2} N` });
      net.update({ dx: (s.F1 - s.F2) * PX, label: info.hidden.has("net") ? "F_net = ?" : `F_net = ${s.F1 - s.F2} N` });
    },
  };
}
