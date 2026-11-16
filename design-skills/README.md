# Design skills (reference copies)

Three public design-skill repos for coding agents, cloned on 2026-11-15 as shallow copies (latest commit
only). They are reference material: nothing in them has been installed or run.

| Repo | Link | Local copy | Commit | License |
|---|---|---|---|---|
| Emil Kowalski, skills | https://github.com/emilkowalski/skills | `emil-skills/` | `64eb3de` (2026-11-15) | MIT |
| Paul Bakaus, impeccable | https://github.com/pbakaus/impeccable | `impeccable/` | `2b86d9c` (2026-11-14) | Apache-2.0 |
| Leonxlnx, taste-skill | https://github.com/Leonxlnx/taste-skill | `taste-skill/` | `f6b7657` (2026-11-07) | MIT |

To update a copy: `git -C <folder> pull`.

## emilkowalski/skills

Animation and UI polish. 20 skills, one folder each under `skills/`, plus `ui-cheatsheet.md` and
`performance-cheatsheet.md` at the root.

- Install: `npx skills@latest add emilkowalski/skills`
- Start with: `skills/emil-design-eng/SKILL.md` (philosophy and rules), `ui-cheatsheet.md`
- Skills: emil-design-eng, animate, animate-expo, review-animations, improve-animations,
  find-animation-opportunities, remove-animations, choreograph, animation-performance, animation-vocabulary,
  apple-design, gestures, pick-ui-library, prototype, mobile-native, break-ui, learn-taste, ask-emil,
  ask-sonner, write-swift

Key rules:
- Don't animate actions people repeat many times a day, or anything started from the keyboard.
- Ease-out for entering and exiting, ease-in-out for movement on screen, never ease-in for UI.
- Most UI motion under 300 ms; exits faster than entrances.
- Pressed buttons scale to about 0.97; never animate from scale(0).
- Animate only transform and opacity.
- With reduced motion, use fewer and gentler animations rather than none.

## pbakaus/impeccable

"The design vocabulary for your coding agent": about 24 slash commands to steer, review and finish a
frontend, plus a rule-based "slop" detector. Grew out of Anthropic's frontend-design skill.

- Install: `npx impeccable install`, then `/impeccable init`. Claude Code: `/plugin marketplace add pbakaus/impeccable`
- Start with: `skill/SKILL.src.md`, `skill/reference/craft-floor.md` (the minimum bar), then the playbook
  per command in `skill/reference/` (typeset, colorize, layout, animate, critique, audit, polish, …)
- Commands, grouped as in its README:
  - Steer: bolder, quieter, distill, colorize, typeset, layout, animate, delight, overdrive
  - Review: critique, audit
  - Finish: polish, harden, clarify, adapt, optimize, onboard
  - Iterate live: live, generate
  - Plan and set up: shape, init, document, extract

Key rules:
- Body text contrast at least 4.5:1.
- Line length 65–75 characters.
- More space above a heading than below it.
- Secondary text tinted from the main hue, not plain grey.
- Every state designed: hover, focus, disabled, loading, error, empty.
- One deliberate motion moment rather than the same entrance on every section.
- Avoid: identical icon-heading-text cards, nested cards, gradient text, decorative glass, eyebrow labels
  above headings, emoji as icons.

Before using it: it installs hooks that run on UI edits, its live mode can start an agent with permission
checks bypassed, and it contacts impeccable.style even with telemetry turned off.

## Leonxlnx/taste-skill

One skill, `design-taste-frontend`, aimed at company and marketing websites, checked in a real browser.
Older variants moved to `Leonxlnx/taste-skill-classics`.

- Install: `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`.
  Claude Code: `/plugin marketplace add Leonxlnx/taste-skill`
- Start with: `skills/taste-skill/SKILL.md`, then `references/` (motion, layout-v4, copy, cards, icons, …)
- Needs Node 22+ and Chrome; its scripts fetch photos and icons over the network.

Key rules:
- Motion tokens of 90–240 ms for interface changes, no bounce or overshoot.
- Hover effects are small: cards lift 2 px, photos zoom 1.02–1.03.
- No carousels, tilt effects, scroll-jacking or parallax on text.
- Touch targets at least 44 px.
- No violet accents and no invented reviews or numbers.

Before using it: a Stop hook in its SKILL.md runs `scripts/gate.mjs` automatically when Claude Code finishes.

## Relevance to Edu Lab

- **Motion timings and easings** (Emil, impeccable) fit the lesson page's feedback and the drag interaction.
- **impeccable's craft floor** is a checklist for the student UI and the teacher app.
- **taste-skill** targets marketing sites, so most of it does not apply.
