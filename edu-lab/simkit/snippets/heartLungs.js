// kit.heartLungs(stage, { x, y (top-left), activity (0 rest … 10 sprint), showValues })
// → { update({ activity }), show({ heartRate, breathing, output }), values() }
// Physics for derived values: simkit.physics.heart(activity)
//   → { heartRate (= 70 + 11 × activity, beats per minute), stroke (= 70 + 4 × activity, mL per beat),
//       output (= heartRate × stroke ÷ 1000, litres per minute), breathing (= 12 + 3 × activity per minute) }
//   At rest: 70 beats, 12 breaths, 4.9 L per minute. Activity 5 (jog): 125 beats, 27 breaths, 11.3 L per minute.
// Use a slider activity 0–10 (step 1).
// Always visible: the chest with lungs and heart (they grow with activity), three gauges and the activity track.
// A single gauge loses its bar and number with show({ heartRate: false }) (or breathing, output).
// Occupies x … x+760, y … y+440.
// Direct interaction: with drag: { activity: app.link("activity") } the student drags the marker along the track.
// Example state: { activity: 2 }
function (stage, kit, app) {
  const body = kit.heartLungs(stage, { x: 100, y: 50, drag: { activity: app.link("activity") } });
  return {
    update(s, d, info) {
      body.update({ activity: s.activity });
      body.show({ heartRate: !info.hidden.has("heartRate") || info.solved });
    },
  };
}
