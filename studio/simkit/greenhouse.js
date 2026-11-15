/* simkit.greenhouse: sunlight in, heat out, and the gases that hold some of the heat back. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=110, y=70, w=600, h=370, co2=420 (ppm, 150–1200), albedo=0.3 (fraction of sunlight reflected,
   *         0.1–0.6), showValues=true (the temperature) }
   * Returns { update({ co2, albedo }), show({ temperature }), showValues(bool), values() }
   * values() -> { temperature (°C, Earth's average) }   (see simkit.physics.greenhouse)
   */
  kit.greenhouse = function (stage, opts) {
    const o = Object.assign({ x: 110, y: 70, w: 600, h: 370, co2: 420, albedo: 0.3, showValues: true }, opts);
    const g = stage.layer({ class: "simkit-greenhouse" });
    let showT = o.showValues;
    const groundY = o.y + o.h - 60;
    const airY = o.y + 110;
    const sol = () => ({ temperature: kit.physics.greenhouse(o.co2, o.albedo) });

    function draw() {
      g.textContent = "";
      const v = sol();
      kit.el("rect", { x: o.x, y: o.y, width: o.w, height: o.h, rx: 12, fill: "#1f2740" }, g);
      // Atmosphere: hazier with more CO2.
      const haze = kit.clamp((o.co2 - 150) / 1050, 0, 1);
      kit.el("rect", { x: o.x, y: airY, width: o.w, height: groundY - airY, fill: "#9fc4ea", "fill-opacity": 0.35 + 0.45 * haze }, g);
      kit.el("rect", { x: o.x, y: groundY, width: o.w, height: o.y + o.h - groundY, fill: "#6f9a5b" }, g);
      // Sunlight: 5 rays in; the share given by the albedo bounces back to space.
      const reflected = Math.round(kit.clamp(o.albedo, 0, 1) * 5);
      for (let i = 0; i < 5; i++) {
        const x = o.x + 50 + i * 46;
        kit.arrowShape(g, x, o.y + 14, x + 26, groundY - 6, { color: kit.colors.yellow, width: 5, head: 12 });
        if (i < reflected) kit.arrowShape(g, x + 30, groundY - 10, x + 52, o.y + 60, { color: kit.colors.yellow, width: 3, head: 10 });
      }
      // Heat from the ground: 6 rays up; more of them are turned back as CO2 rises.
      const trapped = Math.round(kit.clamp(1 + 1.6 * Math.log2(Math.max(o.co2, 150) / 150), 1, 6));
      for (let i = 0; i < 6; i++) {
        const x = o.x + 330 + i * 44;
        if (i < trapped) {
          kit.el("path", { d: `M ${x} ${groundY - 6} L ${x} ${airY + 70} Q ${x + 12} ${airY + 44} ${x + 22} ${airY + 70}`, fill: "none", stroke: kit.colors.red, "stroke-width": 4 }, g);
          kit.arrowShape(g, x + 22, airY + 70, x + 22, groundY - 6, { color: kit.colors.red, width: 4, head: 11 });
        } else kit.arrowShape(g, x, groundY - 6, x, o.y + 16, { color: kit.colors.red, width: 4, head: 11 });
      }
      kit.el("text", { x: o.x + 150, y: o.y + o.h + 28, "text-anchor": "middle", class: "simkit-tick", fill: kit.colors.orange, style: "font-weight: 600", text: `sunlight (${kit.fmt(o.albedo * 100, 0)}% reflected)` }, g);
      kit.el("text", { x: o.x + 440, y: o.y + o.h + 28, "text-anchor": "middle", class: "simkit-tick", fill: kit.colors.redDark, style: "font-weight: 600", text: "heat from the ground" }, g);
      const tx = o.x + o.w + 30;
      kit.el("text", { x: tx, y: airY + 24, class: "simkit-label", fill: kit.colors.blueDark, text: `CO₂ in the air: ${kit.fmt(o.co2, 0)} ppm` }, g);
      kit.el("text", { x: tx, y: o.y + o.h / 2 + 6, class: "simkit-label", fill: kit.colors.ink, text: "average temperature" }, g);
      kit.el("text", { x: tx, y: o.y + o.h / 2 + 44, class: "simkit-label", style: "font-size: 28px", fill: kit.colors.redDark, text: showT ? `${kit.fmt(v.temperature, 1)} °C` : "? °C" }, g);
    }

    draw();

    return {
      update(next) {
        if (next.co2 != null) o.co2 = next.co2;
        if (next.albedo != null) o.albedo = next.albedo;
        draw();
      },
      /** show({ temperature: false }) writes "? °C". */
      show(which) {
        if (which.temperature != null) showT = which.temperature;
        draw();
      },
      showValues(visible) {
        showT = visible;
        draw();
      },
      values: sol,
    };
  };
})();
