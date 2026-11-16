# Edu Lab

A teacher describes a science lesson in one sentence; Edu Lab generates a five-step interactive simulation,
checks it automatically in a real browser and lets the teacher review it. Students then use the lesson as one
offline HTML file, with no AI running.

![Dragging the incoming ray in a generated lesson on Snell's law, then solving the step](docs/img/drag.gif)

**Try the lessons:** open [`docs/index.html`](docs/index.html) in a browser (six example lessons, no install).
The same folder can be served with GitHub Pages.

![Overview of the example lessons](docs/img/overview.png)

## How it works, in short

- The model's part is kept small so a small, cheap model is enough: it picks components from a library of 90
  tested SVG science components, writes the five steps as data (about 60 lines of JSON) and a short drawing
  function (about 30 lines). The page, the step logic and the components are fixed code.
- Every step of every lesson is played and solved in headless Chrome before the teacher sees it; errors and
  layout problems go back to the model for a fix. A vision pass then looks at screenshots of each step.
- In 53 components the student drags or clicks the object itself; the slider stays in step.
- A lesson takes about 90 seconds to generate.

Inspired by Google's "Harnessing Generative UI for Education: Tailored Learning Interactives"
(arXiv 2609.20738).

## Where things are

| Path | What |
|---|---|
| [`studio/`](studio/README.md) | The app: generator, checks, component library, teacher app, evaluation results |
| [`studio/DESIGN.md`](studio/DESIGN.md) | Design rules for the lesson page, the components and the teacher app |
| [`studio/DEMO.md`](studio/DEMO.md) | A four-minute demo script |
| `docs/` | Six exported example lessons (`npm run export` in `studio/`) |
