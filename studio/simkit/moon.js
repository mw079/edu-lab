/* simkit.moonPhases: the Moon on its orbit around the Earth, lit by the Sun, and how it looks from Earth. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=590, y=280 (the Earth), R=170 (orbit radius in px), angle=0 (degrees along the orbit, counter-
   *         clockwise; 0 = new moon on the Sun's side, 180 = full moon), showName=true, showView=true }
   * Sunlight comes from the right. The view from Earth is drawn 400 px to the left of the Earth.
   * Returns { update({ angle }), show({ name, view }), values() }
   * values() -> { name, lit (0–1), day }   (see simkit.physics.moonPhase)
   */
  kit.moonPhases = function (stage, opts) {
    const o = Object.assign({ x: 590, y: 280, R: 170, angle: 0, showName: true, showView: true }, opts);
    const g = stage.layer({ class: "simkit-moon" });
    const sol = () => kit.physics.moonPhase(o.angle);
    const dark = "#3b4250";
    const lit = "#f4ecd2";
    // Sunlight arrows at the right.
    const sx = o.x + o.R + 150;
    for (let i = -2; i <= 2; i++) kit.arrowShape(g, sx + 60, o.y + i * 70, sx, o.y + i * 70, { color: kit.colors.yellow, width: 5, head: 14 });
    kit.el("text", { x: sx + 30, y: o.y - 2 * 70 - 22, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.orange, text: "sunlight" }, g);
    kit.el("circle", { cx: o.x, cy: o.y, r: o.R, fill: "none", stroke: kit.colors.line, "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
    // Earth: night side on the left.
    kit.el("circle", { cx: o.x, cy: o.y, r: 30, fill: kit.colors.blue, stroke: kit.colors.ink, "stroke-width": 2 }, g);
    kit.el("path", { d: `M ${o.x} ${o.y - 30} A 30 30 0 0 0 ${o.x} ${o.y + 30} Z`, fill: kit.colors.blueDark, opacity: 0.8 }, g);
    kit.el("text", { x: o.x, y: o.y + 52, "text-anchor": "middle", class: "simkit-tick", text: "Earth" }, g);
    const moonG = kit.el("g", null, g);
    // View from Earth.
    const vx = o.x - 400;
    const VR = 62;
    const viewG = kit.el("g", null, g);

    function draw() {
      moonG.textContent = "";
      viewG.textContent = "";
      const a = (o.angle * Math.PI) / 180;
      const mx = o.x + o.R * Math.cos(a);
      const my = o.y - o.R * Math.sin(a);
      kit.el("circle", { cx: mx, cy: my, r: 18, fill: dark, stroke: kit.colors.ink, "stroke-width": 2 }, moonG);
      kit.el("path", { d: `M ${mx} ${my - 18} A 18 18 0 0 1 ${mx} ${my + 18} Z`, fill: lit }, moonG); // the half facing the Sun
      if (!o.showView) return;
      const v = sol();
      const norm = ((o.angle % 360) + 360) % 360;
      const waxing = norm <= 180;
      kit.el("text", { x: vx, y: o.y - VR - 26, "text-anchor": "middle", class: "simkit-tick", text: "seen from Earth" }, viewG);
      kit.el("circle", { cx: vx, cy: o.y, r: VR, fill: dark, stroke: kit.colors.ink, "stroke-width": 2 }, viewG);
      // Lit part: a half disc on the lit side plus (gibbous) or minus (crescent) a half ellipse.
      const rx = Math.abs(Math.cos(a)) * VR;
      const gibbous = v.lit > 0.5;
      const side = waxing ? 1 : 0; // sweep of the outer arc: right side when waxing
      if (v.lit > 0.003)
        kit.el("path", { d: `M ${vx} ${o.y - VR} A ${VR} ${VR} 0 0 ${side} ${vx} ${o.y + VR} A ${rx.toFixed(2)} ${VR} 0 0 ${gibbous ? side : 1 - side} ${vx} ${o.y - VR} Z`, fill: lit }, viewG);
      if (o.showName) kit.el("text", { x: vx, y: o.y + VR + 34, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink, text: v.name }, viewG);
    }

    draw();

    return {
      update(next) {
        if (next.angle != null) o.angle = next.angle;
        draw();
      },
      /** show({ name: false }) hides the phase name; show({ view: false }) hides the whole view from Earth. */
      show(which) {
        if (which.name != null) o.showName = which.name;
        if (which.view != null) o.showView = which.view;
        draw();
      },
      values: sol,
    };
  };
})();
