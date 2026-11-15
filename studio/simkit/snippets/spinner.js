// kit.spinner(stage, { x, y (centre), r, groups: [{ id, label, color, count }] (2–4), showValues })
// → { update({ groups: { [id]: { count } } }), showValues(bool), spin({ times }) → Promise<id>, reset(), stop(), values() }
// values() → { total, p: { [id]: probability }, tally: { [id]: results so far }, spins }
// Derived values are plain arithmetic: P(red) = s.red / (s.red + s.blue); expected results in n spins = n × P.
// Always visible: the wheel with its equal slices (they can be counted) and the number of spins. The tally
// per colour is hidden with showValues(false). Spin results are random, so check steps on the slice counts or
// on a typed answer, never on the tally. Changing a count clears the tally.
// Leaves 260 px free to the right of x + r for the tally.
// Example state: { red: 3, blue: 1 }   actions: [{ id: "spin", label: "Spin" }, { id: "spin20", label: "Spin 20 times" }]
function (stage, kit) {
  const wheel = kit.spinner(stage, { x: 330, y: 290, r: 170,
    groups: [{ id: "red", label: "red", color: kit.colors.red }, { id: "blue", label: "blue", color: kit.colors.blue }] });
  return {
    update(s) { wheel.update({ groups: { red: { count: s.red }, blue: { count: s.blue } } }); },
    reset() { wheel.reset(); },
    stop() { wheel.stop(); },
    spin() { return wheel.spin({ times: 1 }); },
    spin20() { return wheel.spin({ times: 20 }); },
  };
}
