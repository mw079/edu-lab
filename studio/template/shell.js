/* Lesson shell: the fixed student UI around a generated lesson (see template/CONTRACT.md).
 *
 * Layout: the simulation on the left, one card on the right: goal, the controls this step needs,
 * Check and hints. Key ideas (formulas) open from the header. Only the controls a step needs are shown. After the last
 * step the lesson opens into free exploration with everything unlocked.
 */
(function () {
  "use strict";

  const test = (window.__lesson = { errors: [], ready: false });
  const logError = (msg) => test.errors.push(String(msg));
  window.addEventListener("error", (e) => logError(e.message || e));
  window.addEventListener("unhandledrejection", (e) => logError((e.reason && e.reason.message) || e.reason));

  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children || []) if (c != null) node.append(c);
    return node;
  }

  // Lesson text is a string, or { html } when it contains math (rendered with KaTeX when the lesson was built).
  function rich(value) {
    if (value && typeof value === "object" && typeof value.html === "string") {
      const span = document.createElement("span");
      span.innerHTML = value.html;
      return span;
    }
    return value == null ? "" : String(value);
  }

  window.defineLesson = function (config) {
    try {
      mount(config);
    } catch (err) {
      logError("mount: " + (err && err.message));
      document.getElementById("app").append(h("p", { class: "fatal", text: "This lesson failed to load: " + (err && err.message) }));
      throw err;
    }
  };

  function mount(config) {
    const levels = config.levels;
    const controls = config.controls || [];
    const progress = levels.map(() => ({ solved: false, hints: 0 }));
    const EXPLORE = levels.length; // index of the free-exploration step after the last level
    let current = 0;
    let state = {};
    let derived = {};
    let busy = false;
    document.title = config.title;

    // ---------- Layout ----------
    const steps = h("nav", { class: "steps", "aria-label": "Steps" });
    const stageHost = h("div", { class: "stage" });
    const readouts = h("div", { class: "readouts", "aria-live": "polite" });
    const head = h("div", { class: "head", "aria-live": "polite" });
    const panel = h("div", { class: "panel" });
    const foot = h("div", { class: "foot" });
    const card = h("section", { class: "card" }, [head, panel, foot]);

    // Key ideas: a formula sheet that opens from the header, so the task card stays short.
    const formulas = config.formulas || [];
    const sheet = h("div", { class: "sheet", id: "ideas", role: "dialog", "aria-label": "Key ideas", hidden: true }, [
      h("h3", { text: "Key ideas" }),
      h("ul", {}, formulas.map((f) => h("li", {}, [h("div", { class: "formula" }, [rich(f.expr || f)]), f.meaning ? h("p", {}, [rich(f.meaning)]) : null]))),
    ]);
    const ideasBtn = h("button", { class: "pill", id: "ideas-btn", text: "Key ideas", "aria-expanded": "false", "aria-controls": "ideas", hidden: !formulas.length });
    const toggleIdeas = (open) => {
      sheet.hidden = !open;
      ideasBtn.setAttribute("aria-expanded", String(open));
    };
    ideasBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleIdeas(sheet.hidden);
    });
    document.addEventListener("click", (e) => !sheet.hidden && !sheet.contains(e.target) && toggleIdeas(false));
    document.addEventListener("keydown", (e) => e.key === "Escape" && toggleIdeas(false));

    document.getElementById("app").append(
      h("header", { class: "top" }, [
        h("div", { class: "title" }, [
          window.parent !== window ? h("a", { class: "back", href: "/#/", target: "_top", text: "← All lessons" }) : null,
          h("h1", { text: config.title }),
        ]),
        h("div", { class: "nav" }, [ideasBtn, steps]),
        sheet,
      ]),
      h("main", { class: "main" }, [h("div", { class: "sim" }, [stageHost, readouts]), card])
    );

    const view = config.scene(window.simkit.stage(stageHost, config.stage || {}), window.simkit) || {};

    // ---------- Controls (built once, shown per step) ----------
    const rows = {};
    for (const c of controls) {
      let sync;
      let input;
      if (c.type === "select") {
        const buttons = c.options.map((o) => h("button", { class: "seg", id: "ctl-" + c.key + "-" + o.value, text: o.label, onclick: () => set(c.key, o.value) }));
        const group = h("div", { class: "segmented", role: "group", "aria-label": c.label }, buttons);
        input = [h("label", { text: c.label }), group];
        sync = (v) => buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(c.options[i].value) === String(v)));
      } else {
        const decimals = (String(c.step || 1).split(".")[1] || "").length;
        const range = h("input", { type: "range", id: "ctl-" + c.key, min: c.min, max: c.max, step: c.step || 1, "aria-label": c.label });
        const out = h("output", { for: "ctl-" + c.key });
        range.addEventListener("input", () => set(c.key, Number(range.value)));
        input = [h("div", { class: "control-head" }, [h("label", { for: "ctl-" + c.key, text: c.label }), out]), range];
        sync = (v) => {
          range.value = v;
          range.style.setProperty("--pct", ((Number(v) - c.min) / (c.max - c.min)) * 100 + "%");
          out.textContent = Number(v).toFixed(decimals).replace(/^-/, "−") + (c.unit ? " " + c.unit : "");
        };
      }
      rows[c.key] = { el: h("div", { class: "control" }, input), sync };
      panel.append(rows[c.key].el);
    }
    const actionBtns = {};
    const actionRow = h("div", { class: "actions" });
    for (const a of config.actions || []) {
      actionBtns[a.id] = h("button", { class: "btn", "data-action": a.id, text: a.label, onclick: () => runAction(a) });
      actionRow.append(actionBtns[a.id]);
    }
    if (actionRow.childNodes.length) panel.append(actionRow);

    // ---------- State ----------
    const level = () => levels[current];
    const exploring = () => current === EXPLORE;
    const solved = () => exploring() || progress[current].solved;
    // After solving, the step's actions unlock (e.g. "Run collision" to see it happen); its controls stay
    // as they were so the card stays small. Explore unlocks everything.
    const isAction = (key) => (config.actions || []).some((a) => a.id === key);
    const locked = (key) => !exploring() && (level().lock || []).includes(key) && !(progress[current].solved && isAction(key));
    const hidden = (key) => !solved() && (level().hide || []).includes(key);

    function set(key, value) {
      if (locked(key) || busy) return;
      state = { ...state, [key]: value };
      update();
    }

    function update() {
      derived = { ...state, ...(config.model ? config.model(state) : {}) };
      if (view.update) view.update(state, derived, { level: current, solved: solved(), hidden: new Set(solved() ? [] : level().hide || []) });
      for (const c of controls) {
        rows[c.key].sync(state[c.key]);
        rows[c.key].el.hidden = locked(c.key);
      }
      for (const [id, b] of Object.entries(actionBtns)) {
        b.hidden = locked(id);
        b.disabled = busy;
      }
      panel.hidden = controls.every((c) => locked(c.key)) && Object.keys(actionBtns).every(locked);
      const shown = exploring() || !level().show ? config.readouts || [] : (config.readouts || []).filter((r) => level().show.includes(r.key));
      readouts.replaceChildren(
        ...shown.map((r) =>
          h("div", { class: "readout" + (hidden(r.key) ? " unknown" : "") }, [
            h("span", { text: r.label }),
            h("b", { text: hidden(r.key) ? "?" : fmt(derived[r.key], r.digits) + (r.unit ? " " + r.unit : "") }),
          ])
        )
      );
      renderSteps();
    }

    function fmt(v, digits) {
      return typeof v === "number" ? window.simkit.fmt(v, digits == null ? 2 : digits) : typeof v === "boolean" ? (v ? "yes" : "no") : String(v);
    }

    async function runAction(a) {
      if (busy) return;
      busy = true;
      update();
      try {
        await a.run(view, state, derived);
      } catch (err) {
        logError("action " + a.id + ": " + err.message);
      }
      busy = false;
      update();
    }

    // ---------- Step navigation ----------
    function renderSteps() {
      const reachable = (i) => i === 0 || progress[i - 1].solved;
      steps.replaceChildren(
        ...levels.map((lv, i) =>
          h("button", {
            class: "step" + (progress[i].solved ? " done" : ""),
            text: progress[i].solved && i !== current ? "✓" : String(i + 1),
            title: lv.title,
            "aria-label": `Step ${i + 1}: ${lv.title}`,
            "aria-current": i === current ? "step" : null,
            disabled: !reachable(i),
            onclick: () => goTo(i),
          })
        ),
        h("button", { class: "step explore", text: "Explore", "aria-current": exploring() ? "step" : null, disabled: !progress[EXPLORE - 1].solved, onclick: () => goTo(EXPLORE) })
      );
    }

    function goTo(i) {
      if (i < 0 || i > EXPLORE) return;
      if (view.stop) view.stop();
      busy = false;
      current = i;
      state = { ...config.state, ...(exploring() ? {} : level().setup || {}) };
      if (view.reset) view.reset(state);
      update();
      renderCard();
    }

    // ---------- Task card ----------
    let answerInput = null;
    const feedback = h("p", { class: "feedback", role: "status" });
    const hintList = h("ol", { class: "hints" });

    function renderCard() {
      answerInput = null;
      feedback.textContent = "";
      feedback.className = "feedback";
      hintList.replaceChildren();
      if (exploring()) {
        head.replaceChildren(h("p", { class: "kicker", text: "Explore" }), h("h2", { text: "Everything is unlocked" }), config.debrief ? h("p", {}, [rich(config.debrief)]) : null, h("p", { class: "muted", text: "Try extreme values and predict what will happen before you look." }));
        foot.replaceChildren(h("div", { class: "row" }, [h("button", { class: "link quiet reset", text: "Reset", onclick: () => goTo(current) })]));
        return;
      }
      const lv = level();
      const p = progress[current];
      const body = [h("p", { class: "kicker", text: `Step ${current + 1} of ${levels.length} · ${lv.title}` }), h("h2", {}, [rich(lv.goal)])];
      // Answer box sits with the goal; Check, feedback and hints sit below the controls.
      if (lv.ask) {
        answerInput = h("input", { id: "answer-input", type: "text", inputmode: "decimal", autocomplete: "off", "aria-label": lv.ask.label, placeholder: lv.ask.label });
        answerInput.addEventListener("keydown", (e) => e.key === "Enter" && check());
        body.push(h("div", { class: "answer" }, [answerInput, lv.ask.unit ? h("span", { text: lv.ask.unit }) : null]));
      }
      const hints = lv.hints || [];
      const hintBtn = h("button", { class: "link", id: "hint-btn", onclick: () => showHint(hintBtn) });
      setHintLabel(hintBtn);
      head.replaceChildren(...body);
      foot.replaceChildren(
        h("div", { class: "row" }, [
          h("button", { class: "btn" + (p.solved ? "" : " primary"), id: "check-btn", text: p.solved ? "Check again" : "Check", onclick: check }),
          h("button", { class: "btn primary", id: "next-btn", text: current === levels.length - 1 ? "Explore freely →" : "Next step →", hidden: !p.solved, onclick: () => goTo(current + 1) }),
          hints.length || lv.solutionText ? hintBtn : null,
          h("button", { class: "link quiet reset", text: "Reset", onclick: () => goTo(current) }),
        ]),
        feedback,
        hintList
      );
      if (p.solved) say("ok", lv.explain || "", lv.ask ? "Correct!" : "You did it!");
    }

    function say(kind, text, title) {
      feedback.className = "feedback " + kind;
      feedback.replaceChildren(...(title ? [h("strong", { text: "✓ " + title })] : []), rich(text));
    }

    function setHintLabel(btn) {
      const hints = level().hints || [];
      const n = progress[current].hints;
      btn.textContent = n < hints.length ? (n ? "Another hint" : "Hint") : "Show solution";
      btn.hidden = progress[current].solved || (n > hints.length) || (n === hints.length && !level().solutionText);
    }

    function showHint(btn) {
      const lv = level();
      const p = progress[current];
      const hints = lv.hints || [];
      if (p.hints < hints.length) hintList.append(h("li", {}, [rich(hints[p.hints])]));
      else {
        hintList.append(
          h("li", { class: "solution" }, [
            h("span", {}, [rich(lv.solutionText)]),
            h("button", { class: "link", text: lv.ask ? "Fill in the answer" : "Set it up for me", onclick: () => applySolution(current) }),
          ])
        );
      }
      p.hints++;
      setHintLabel(btn);
    }

    function check() {
      const lv = level();
      const p = progress[current];
      if (busy) return p.solved;
      let answer;
      if (lv.ask) {
        answer = parseFloat(answerInput.value.replace(",", ".").replace(/[^\d.eE+-]/g, ""));
        if (!Number.isFinite(answer)) {
          say("warn", "Type a number first.");
          answerInput.focus();
          return false;
        }
      }
      let ok = false;
      let msg = "";
      try {
        ok = !!lv.check(state, derived, answer);
        if (!ok && lv.feedback) msg = lv.feedback(state, derived, answer) || "";
      } catch (err) {
        logError("check: " + err.message);
      }
      if (!ok) {
        say("no", msg || (p.solved ? "Not with these values. Change something and check again." : "Not yet. Change something and check again."));
        return false;
      }
      if (p.solved) {
        say("ok", lv.explain || "", lv.ask ? "Correct!" : "Still correct!");
        return true;
      }
      p.solved = true;
      update();
      renderCard();
      return true;
    }

    function applySolution(i) {
      if (i !== current) goTo(i);
      const { answer, ...values } = levels[i].solution || {};
      state = { ...state, ...values };
      if (answer != null && answerInput) answerInput.value = String(answer);
      update();
    }

    // ---------- Test hooks (used by automated checks) ----------
    Object.assign(test, {
      config,
      levelCount: levels.length,
      current: () => current,
      goTo,
      state: () => ({ ...state }),
      derived: () => ({ ...derived }),
      applySolution,
      solved: (i) => progress[i == null ? current : i].solved,
      check,
      isSolvedNow: (answer) => !!levels[current].check(state, derived, answer),
    });

    goTo(0);
    test.ready = true;
  }
})();
