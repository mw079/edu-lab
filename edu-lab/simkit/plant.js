/* simkit.waterPlant: pondweed in a tank under a lamp; oxygen bubbles show the rate of photosynthesis. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=300, y=120, w=300, h=340 (the tank), light=60 (% lamp brightness), co2=0.04 (% CO2 in the water),
   *         temp=25 (°C), showValues=true (the three settings as labels) }
   * Bubbles rise at simkit.physics.photosynthesis(light, co2, temp).rate per minute (sped up 6× to watch).
   * Returns { update({ light, co2, temp }), showValues(bool), values() }   values() -> { rate, limiting }
   */
  kit.waterPlant = function (stage, opts) {
    const o = Object.assign({ x: 300, y: 120, w: 300, h: 340, light: 60, co2: 0.04, temp: 25, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-plant" });
    const waterTop = o.y + 34;
    // Lamp at the upper left, shining down onto the tank.
    const lx = o.x - 110;
    const ly = o.y + 20;
    kit.el("polygon", { points: `${lx - 26},${ly - 10} ${lx + 8},${ly - 26} ${lx + 30},${ly + 22} ${lx - 4},${ly + 38}`, fill: kit.colors.steel }, g);
    const bulb = kit.el("circle", { cx: lx + 14, cy: ly + 28, r: 14, fill: kit.colors.yellow, stroke: kit.colors.orange, "stroke-width": 2 }, g);
    const lightLabel = kit.el("text", { x: lx - 24, y: ly + 74, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.ink }, g);
    // Tank and water.
    kit.el("rect", { x: o.x, y: waterTop, width: o.w, height: o.y + o.h - waterTop, fill: "#dceefb" }, g);
    // Cone of light from the lamp across the plant.
    const rays = kit.el("polygon", { points: `${lx + 14},${ly + 28} ${o.x + o.w - 8},${waterTop + 16} ${o.x + 40},${o.y + o.h - 8}`, fill: kit.colors.yellow }, g);
    const bubblesG = kit.el("g", null, g);
    // Pondweed: a stem with leaves, cut end pointing up (bubbles leave from there).
    const sx = o.x + o.w / 2;
    const base = o.y + o.h - 14;
    const tip = waterTop + 70;
    kit.el("path", { d: `M ${sx} ${base} C ${sx - 30} ${base - 80}, ${sx + 30} ${tip + 80}, ${sx} ${tip}`, fill: "none", stroke: kit.colors.greenDark, "stroke-width": 6, "stroke-linecap": "round" }, g);
    for (let i = 0; i < 7; i++) {
      const t = 0.12 + i * 0.12;
      const y = base + (tip - base) * t;
      const x = sx + Math.sin(t * Math.PI * 2) * 11;
      const side = i % 2 ? 1 : -1;
      kit.el("ellipse", { cx: x + side * 22, cy: y, rx: 22, ry: 8, fill: kit.colors.green, transform: `rotate(${side * -24} ${x + side * 22} ${y})` }, g);
    }
    kit.el("path", { d: `M ${o.x} ${o.y} L ${o.x} ${o.y + o.h} L ${o.x + o.w} ${o.y + o.h} L ${o.x + o.w} ${o.y}`, fill: "none", stroke: kit.colors.steel, "stroke-width": 6, "stroke-linejoin": "round", "stroke-linecap": "round" }, g);
    const co2Label = kit.el("text", { x: o.x + o.w + 22, y: o.y + o.h - 60, class: "simkit-label", fill: kit.colors.ink }, g);
    const tempLabel = kit.el("text", { x: o.x + o.w + 22, y: o.y + o.h - 30, class: "simkit-label", fill: kit.colors.redDark }, g);

    const sol = () => kit.physics.photosynthesis(o.light, o.co2, o.temp);
    let bubbles = [];
    let due = 0;

    function draw() {
      kit.set(rays, { opacity: 0.55 * (o.light / 100) });
      kit.set(bulb, { opacity: 0.25 + 0.75 * (o.light / 100) });
      kit.set(lightLabel, { text: o.showValues ? `Light ${kit.fmt(o.light, 0)}%` : "Lamp" });
      kit.set(co2Label, { text: o.showValues ? `CO₂ ${kit.fmt(o.co2, 2)}%` : "" });
      kit.set(tempLabel, { text: o.showValues ? `${kit.fmt(o.temp, 0)} °C` : "" });
    }

    stage.onFrame((dt) => {
      const perSecond = (sol().rate / 60) * 6; // sped up so the stream is easy to compare
      due += perSecond * dt;
      while (due >= 1 && bubbles.length < 60) {
        due -= 1;
        bubbles.push({ x: sx + (Math.random() - 0.5) * 10, y: tip, el: kit.el("circle", { r: 5, fill: "#fff", stroke: kit.colors.blue, "stroke-width": 2 }, bubblesG) });
      }
      if (perSecond === 0) due = 0;
      for (const b of bubbles) {
        b.y -= 70 * dt;
        kit.set(b.el, { cx: b.x.toFixed(1), cy: b.y.toFixed(1) });
        if (b.y < waterTop + 6) b.el.remove();
      }
      bubbles = bubbles.filter((b) => b.y >= waterTop + 6);
    });

    draw();

    return {
      update(next) {
        Object.assign(o, Object.fromEntries(Object.entries(next).filter(([, v]) => v != null)));
        draw();
      },
      showValues(visible) {
        o.showValues = visible;
        draw();
      },
      values: sol,
    };
  };
})();
