# Demo script (about 4 minutes)

Before you start: `npm run build && npm start`, open http://127.0.0.1:8787, and have one lesson already
generated in case the live one is slow. A new lesson takes about 90 seconds to build (70–100 s in the last check).

## 1. What it is (20 s)

> "Edu Lab turns a teacher's one-sentence request into a five-step interactive science lesson. It follows the
> idea of Google's learning-interactives paper, but it is built to work with a small, cheap model."

Show the overview page: picture cards, audience filter.

## 2. A finished lesson, as a student (60 s)

Open **The Pendulum's Period**.

- Step 1: drag the bob to 20° on the picture. Point out that the slider follows and the dashed ring marks
  what can be grabbed. Press **Check**.
- Step 2: change the length until the period is 2.5 s. Press **Hint** once to show the graded hints.
- Step 3: a question step. Point out that the controls are locked and the answer is hidden ("?"), so it
  cannot be read off or found by dragging.
- Open **Key ideas** to show the formula sheet.
- Press **Set it up for me** on any step (after the hints): the picture moves to the solution instead of
  jumping, and solving a step is the one animated moment. Dragging and sliders follow the pointer exactly.

> "No AI runs here. The lesson is one offline HTML file."

### Showcase lessons

Six lessons that show the range; the first four can be dragged directly.

| Lesson | Audience | Show |
|---|---|---|
| The Pendulum's Period | High school | drag the bob; graph of the swing |
| Snell's Law at Glass | High school | swing the incoming ray by its end; the refracted ray follows |
| Hooke's Law with a Spring | High school | pull the block; the pointer on the ruler reads the stretch |
| Slope and Y-Intercept Explorer | Middle school | drag the y-intercept and a point on the line |
| Ohm's Law with Series Resistors | High school | moving charges and a live graph (sliders) |
| Atoms in Motion | Undergraduate | built from a pasted textbook section (sliders) |

## 3. Make a new lesson, as a teacher (90 s)

Click **+ New lesson**. Type a request, for example *"Why some things float and others sink"*, choose
**Middle school**, submit.

- While the plan appears: "The model first picks components from a library of 57 and writes objectives.
  The teacher can edit them."
- Approve the plan. While the steps are written: "It only writes data and short formulas. The app, the level
  logic and the drawings of the objects are fixed code."
- Approve the steps. While it builds: "Every step is now played automatically in a real browser. If a step
  cannot be solved, or labels overlap, the errors go back to the model for a fix. Then the same model looks at
  screenshots of each step."

Open the lesson when it is ready and solve step 1.

## 4. Why it is built this way (40 s)

> "Google's system lets a large model write the whole page and then critiques it for up to ten rounds. Here
> the model's part is kept small: about 60 lines of JSON and 30 lines of drawing code per lesson, on top of
> a tested component library. That is why a small model gets a working lesson in about 90 seconds."

Numbers to quote (from the last full evaluation run, see `README.md`): lessons that build, average time,
and how many visual problems the review step finds and fixes.

## 5. What is not done (20 s)

- 20 of the 57 components can be dragged or clicked so far; the rest use sliders.
- The review step still reports some problems that are not real, so its findings are suggestions and never
  block a lesson.
- Topics outside the library (for example cell biology or plate tectonics) get a weak fit; the plan step says
  so instead of pretending.

## If something goes wrong

- The build fails: open a lesson generated earlier and continue from section 2.
- The model is slow: talk through section 4 while it runs.
