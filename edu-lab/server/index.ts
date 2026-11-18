// Edu Lab server: teacher app API + lesson pages.
import express from "express";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AUDIENCES, audienceLevel } from "./audience.ts";
import { ROOT, config } from "./env.ts";
import { buildLessonHtml } from "./lesson.ts";
import { lessonSourceFromDir } from "./design.ts";
import { thumbnail } from "./thumbnail.ts";
import { dailyLimit, passwordGate } from "./guard.ts";
import { catalog } from "./catalog.ts";
import { DATA, approveDraft, deleteDraft, getDraft, hasPrevious, listDrafts, newDraft, recoverInterrupted, runStage, undoRevision, type Stage } from "./pipeline.ts";

const app = express();
app.use(express.json({ limit: "400kb" }));

// The public website (../docs: the demo video and the example lessons) at /, open to everyone. It is static, so
// no AI runs there. Everything after this (the teacher app at /app/, the API) sits behind the password, if set.
const SITE = join(ROOT, "..", "docs");
if (existsSync(join(SITE, "index.html"))) app.use(express.static(SITE, { index: "index.html" }));
app.use(passwordGate(config.password));
// Model work (new lessons, change requests, retries) counts toward the daily limit.
const limit = dailyLimit(config.dailyLimit);
const MODEL_WORK = /^\/api\/drafts(\/[^/]+\/(revise|plan|design|build))?$/;
app.use((req, res, next) => (req.method === "POST" && MODEL_WORK.test(req.path) ? limit(req, res, next) : next()));
const EXAMPLES = join(ROOT, "examples");
const ID = /^[a-z0-9-]+$/;

const isExample = (id: string) => existsSync(join(EXAMPLES, id, "design.json"));


function listLessons() {
  const examples = readdirSync(EXAMPLES)
    .filter((id) => ID.test(id) && isExample(id))
    .map((id) => {
      const d = JSON.parse(readFileSync(join(EXAMPLES, id, "design.json"), "utf8"));
      return { id, title: d.title as string, audience: audienceLevel(d.audience), own: false };
    });
  const generated = listDrafts()
    .filter((d) => d.status === "ready" && d.design && !d.eval)
    .map((d) => ({ id: d.id, title: d.design!.title, audience: audienceLevel(d.audience), own: true }));
  return [...generated, ...examples];
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: config.model, hasKey: Boolean(config.fireworksKey) });
});

app.get("/api/lessons", (_req, res) => {
  try {
    res.json(listLessons());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------- Drafts: request -> plan -> design -> build ----------

app.get("/api/drafts", (_req, res) => {
  res.json(listDrafts().filter((d) => !d.eval).map(({ id, request, status, stage, createdAt, plan }) => ({ id, request, status, stage, createdAt, title: plan?.title })));
});

const draftJson = (id: string) => {
  const d = getDraft(id);
  if (!d) return null;
  // The plan screen shows components by name ("Rock cycle"), not by id ("rockCycle").
  const names = new Map(catalog().map((c) => [c.id, c.name]));
  return { ...d, hasPrevious: hasPrevious(id), componentNames: (d.plan?.components || []).map((c) => names.get(c) || c) };
};

app.get("/api/drafts/:id", (req, res) => {
  const d = draftJson(req.params.id);
  return d ? res.json(d) : res.status(404).json({ error: "Draft not found" });
});

// ---------- After the preview: approve, ask for changes, undo the last change ----------

const BUSY = "This lesson is still being worked on. Try again when it has finished.";

app.post("/api/drafts/:id/approve", (req, res) => {
  const r = approveDraft(req.params.id);
  if (r === "missing") return res.status(404).json({ error: "Lesson not found" });
  if (r === "busy") return res.status(409).json({ error: BUSY });
  if (r === "not-built") return res.status(409).json({ error: "Only a built lesson waiting for review can be approved." });
  res.json(draftJson(req.params.id));
});

app.post("/api/drafts/:id/revise", (req, res) => {
  const d = getDraft(req.params.id);
  if (!d) return res.status(404).json({ error: "Lesson not found" });
  if (d.status !== "built" && d.status !== "ready") return res.status(409).json({ error: "Only a built lesson can be changed." });
  const note = String(req.body?.note || "").trim().slice(0, 1000);
  if (note.length < 3) return res.status(400).json({ error: "Describe the change you want." });
  const step = Number(req.body?.step) || undefined;
  if (!runStage(d, "revise", { note, step })) return res.status(409).json({ error: BUSY });
  res.status(202).json(draftJson(d.id));
});

app.post("/api/drafts/:id/undo", (req, res) => {
  const r = undoRevision(req.params.id);
  if (r === "missing") return res.status(404).json({ error: "Lesson not found" });
  if (r === "busy") return res.status(409).json({ error: BUSY });
  if (r === "nothing") return res.status(409).json({ error: "There is no earlier version to go back to." });
  res.json(draftJson(req.params.id));
});

// Deletes a lesson the teacher created, finished or not. The built-in examples cannot be deleted.
app.delete("/api/drafts/:id", (req, res) => {
  const result = deleteDraft(req.params.id);
  if (result === "missing") return res.status(404).json({ error: "Lesson not found" });
  if (result === "busy") return res.status(409).json({ error: "This lesson is still being built. Try again when it has finished." });
  res.json({ ok: true });
});

app.post("/api/drafts", (req, res) => {
  const request = String(req.body?.request || "").trim().slice(0, 2000);
  const audience = String(req.body?.audience || "");
  if (!AUDIENCES.includes(audience)) return res.status(400).json({ error: `Audience must be one of: ${AUDIENCES.join(", ")}` });
  if (request.length < 5) return res.status(400).json({ error: "Describe the lesson in a sentence or two." });
  if (!config.fireworksKey) return res.status(500).json({ error: "FIREWORKS_API_KEY is not set in edu-lab/.env" });
  const sourceText = req.body?.sourceText ? String(req.body.sourceText).slice(0, 60000) : undefined;
  const d = newDraft(request, audience, sourceText);
  runStage(d, "plan");
  res.status(202).json(d);
});

app.post("/api/drafts/:id/:stage(plan|design|build)", (req, res) => {
  const d = getDraft(req.params.id);
  if (!d) return res.status(404).json({ error: "Draft not found" });
  const stage = req.params.stage as Stage;
  const objectives = Array.isArray(req.body?.objectives) ? req.body.objectives.map(String).map((s: string) => s.trim()).filter(Boolean).slice(0, 6) : undefined;
  const note = req.body?.note ? String(req.body.note).slice(0, 1000) : undefined;
  if (!runStage(d, stage, { objectives, note })) return res.status(409).json({ error: "This draft is already working." });
  res.status(202).json(draftJson(d.id));
});

// ---------- Lesson pages ----------

/** The lesson as one HTML file. Built on request so edits to simkit/template show up immediately. */
function lessonHtml(id: string): string | null {
  if (!ID.test(id)) return null;
  // The title comes from the design data, so serving a page never runs the lesson's code on the server.
  if (isExample(id)) {
    const dir = join(EXAMPLES, id);
    return buildLessonHtml(lessonSourceFromDir(dir), JSON.parse(readFileSync(join(dir, "design.json"), "utf8")).title);
  }
  const generated = join(DATA, id, "lesson.js");
  return existsSync(generated) ? buildLessonHtml(readFileSync(generated, "utf8"), getDraft(id)?.design?.title) : null;
}

app.get("/lessons/:id", (req, res) => {
  const html = lessonHtml(req.params.id);
  return html ? res.type("html").send(html) : res.status(404).send("Lesson not found");
});

app.get("/lessons/:id/thumb.png", async (req, res) => {
  const html = lessonHtml(req.params.id);
  if (!html) return res.status(404).end();
  try {
    res.sendFile(await thumbnail(req.params.id, html));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// The teacher app (npm run build) at /app/.
const web = join(ROOT, "dist", "web");
if (existsSync(web)) app.use("/app", express.static(web));

recoverInterrupted();
app.listen(config.port, config.host, () => {
  const guard = `${config.password ? "password on" : "no password"}, ${config.dailyLimit > 0 ? `${config.dailyLimit} runs a day` : "no daily limit"}`;
  console.log(`Edu Lab on http://${config.host}:${config.port}  (model: ${config.model}, key: ${config.fireworksKey ? "set" : "MISSING"}, ${guard})`);
});
