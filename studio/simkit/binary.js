/* simkit.binaryBits: a row of bits with their place values and the number they stand for. */
(function () {
  "use strict";
  const kit = window.simkit;

  /**
   * opts: { x=500, y=250 (centre of the row), bits=8 (1–8), value=0 (0 … 2^bits − 1), showValue=true (the
   *         decimal number), showPlaces=true (128, 64, … above the bits),
   *         click: { bits: [app.link("key"), …] highest place first } or { value: app.link("key") } (the student
   *         can click a bit to flip it) }
   * Returns { update({ value }) or update({ bits: [0 or 1, …] highest place first }), show({ value, places }), values() }
   * values() -> { value, bits: [ … ] }
   */
  kit.binaryBits = function (stage, opts) {
    const o = Object.assign({ x: 500, y: 250, bits: 8, value: 0, showValue: true, showPlaces: true }, opts);
    const g = stage.layer({ class: "simkit-binary" });
    const n = kit.clamp(Math.round(o.bits), 1, 8);
    const size = 78;
    const gap = 14;
    const left = o.x - (n * size + (n - 1) * gap) / 2;
    const sol = () => ({ value: kit.clamp(Math.round(o.value), 0, 2 ** n - 1), bits: kit.physics.bits(o.value, n) });

    function draw() {
      g.textContent = "";
      const v = sol();
      v.bits.forEach((bit, i) => {
        const bx = left + i * (size + gap);
        const place = 2 ** (n - 1 - i);
        if (o.showPlaces) kit.el("text", { x: bx + size / 2, y: o.y - size / 2 - 16, "text-anchor": "middle", class: "simkit-label", fill: kit.colors.muted, text: String(place) }, g);
        const box = kit.el("g", null, g);
        kit.el("rect", { x: bx, y: o.y - size / 2, width: size, height: size, rx: 12, fill: bit ? kit.colors.yellow : "#fff", stroke: bit ? kit.colors.orange : kit.colors.steel, "stroke-width": 3 }, box);
        kit.el("text", { x: bx + size / 2, y: o.y + 13, "text-anchor": "middle", class: "simkit-label", style: "font-size: 36px", fill: kit.colors.ink, text: String(bit) }, box);
        // Clicking a bit flips it: through that bit's own link, or through one link for the whole number.
        const click = o.click || {};
        if (click.bits && click.bits[i]) kit.click(box, click.bits[i], () => click.bits[i](bit ? 0 : 1));
        else if (click.value) kit.click(box, click.value, () => click.value(bit ? v.value - place : v.value + place));
      });
      const ones = v.bits.map((bit, i) => (bit ? 2 ** (n - 1 - i) : 0)).filter(Boolean);
      const sum = o.showPlaces && ones.length > 1 ? `${ones.join(" + ")} = ` : "";
      kit.el("text", { x: o.x, y: o.y + size / 2 + 56, "text-anchor": "middle", class: "simkit-label", style: "font-size: 26px", fill: kit.colors.blueDark, text: o.showValue ? `${sum}${v.value}` : "= ?" }, g);
    }

    draw();

    return {
      update(next) {
        if (next.bits) o.value = next.bits.slice(0, n).reduce((sum, bit, i) => sum + (bit ? 2 ** (n - 1 - i) : 0), 0);
        if (next.value != null) o.value = next.value;
        draw();
      },
      /** show({ value: false }) writes "= ?" under the bits; show({ places: false }) removes the place values. */
      show(which) {
        if (which.value != null) o.showValue = which.value;
        if (which.places != null) o.showPlaces = which.places;
        draw();
      },
      values: sol,
    };
  };
})();
