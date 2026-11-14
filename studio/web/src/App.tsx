import { useEffect, useState } from "react";
import { richHtml } from "../../server/math";

type LessonSummary = { id: string; title: string; audience: string };
type DraftSummary = { id: string; request: string; status: string; title?: string };
type Level = { title: string; goal: string; ask?: { label: string; unit?: string }; hints?: string[]; solutionText?: string; explain?: string };
type Draft = {
  id: string;
  request: string;
  audience: string;
  status: "working" | "planned" | "designed" | "ready" | "failed";
  stage: "plan" | "design" | "build";
  activity?: string;
  source?: { text: string };
  plan?: { title: string; audience: string; idea: string; objectives: string[]; components: string[]; fit?: string; note?: string };
  design?: { title: string; subtitle?: string; levels: Level[] };
  error?: string;
  log: { stage: string; what: string; ms?: number }[];
};

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, body === undefined ? undefined : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export function App() {
  const hash = useHash();
  const draftId = hash.match(/^#\/draft\/([a-z0-9-]+)$/)?.[1];
  const lessonId = hash.match(/^#\/lesson\/([a-z0-9-]+)$/)?.[1];
  if (lessonId) return <LessonView id={lessonId} />;
  return (
    <main className="page">
      <header className="top">
        <a href="#/" className="brand"><span className="mark" aria-hidden="true" />Edu Lab</a>
        {hash !== "#/new" && <a className="btn primary" href="#/new">+ New lesson</a>}
      </header>
      {hash === "#/new" ? <NewLesson /> : draftId ? <DraftView id={draftId} /> : <Home />}
    </main>
  );
}

function Home() {
  const [lessons, setLessons] = useState<LessonSummary[] | null>(null);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");
  useEffect(() => {
    api<LessonSummary[]>("/api/lessons").then(setLessons).catch((e: Error) => setError(e.message));
    api<DraftSummary[]>("/api/drafts").then((d) => setDrafts(d.filter((x) => x.status !== "ready"))).catch(() => {});
  }, []);
  const shown = lessons?.filter((l) => filter === "All" || l.audience === filter);
  return (
    <>
      <div className="home-head">
        <h1>Lessons</h1>
        <div className="chips" role="group" aria-label="Audience">
          {["All", ...AUDIENCES].map((a) => (
            <button key={a} className="chip" aria-pressed={a === filter} onClick={() => setFilter(a)}>{a}</button>
          ))}
        </div>
      </div>
      {error && <p className="error">Could not load lessons: {error}</p>}
      {drafts.length > 0 && (
        <ul className="drafts">
          {drafts.map((d) => (
            <li key={d.id}>
              <a href={`#/draft/${d.id}`}>{d.title || d.request}</a>
              <span className={`status ${d.status}`}>{statusLabel(d.status)}</span>
            </li>
          ))}
        </ul>
      )}
      {!lessons && !error && <p className="muted">Loading…</p>}
      <section className="grid">
        {shown?.map((l) => (
          <a key={l.id} className="lesson-card" href={`#/lesson/${l.id}`}>
            <div className="thumb">
              <img src={`/lessons/${l.id}/thumb.png`} alt="" loading="lazy" onLoad={(e) => e.currentTarget.classList.add("loaded")} />
            </div>
            <h3>{l.title}</h3>
            <p>{l.audience}</p>
          </a>
        ))}
      </section>
      {shown?.length === 0 && <p className="muted">No {filter.toLowerCase()} lessons yet.</p>}
    </>
  );
}

const statusLabel = (s: string) => ({ working: "Building…", planned: "Plan ready to review", designed: "Steps ready to review", failed: "Failed" })[s] || s;

const AUDIENCES = ["Middle school", "High school", "Undergraduate"];

function LessonView({ id }: { id: string }) {
  return (
    // The lesson shows its own "← All lessons" link when it is embedded.
    <iframe className="lesson-view" src={`/lessons/${id}`} title="Lesson" />
  );
}

function NewLesson() {
  const [request, setRequest] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[1]);
  const [sourceText, setSourceText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api<Draft>("/api/drafts", { request, audience, sourceText });
      location.hash = `#/draft/${d.id}`;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <form className="panel form" onSubmit={submit}>
      <a href="#/" className="back">← All lessons</a>
      <h1>What should your students learn?</h1>
      <label>
        Lesson request
        <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={4} required minLength={5} placeholder="e.g. Ohm's law: how current depends on voltage and resistance, with series resistors" />
      </label>
      <details className="source" open={!!sourceText}>
        <summary>Source text <span className="muted">(optional)</span></summary>
        <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} rows={6} placeholder="Paste a textbook section or your notes; the lesson will be based on it." />
      </details>
      <fieldset>
        <legend>Audience</legend>
        <div className="segmented">
          {AUDIENCES.map((a) => (
            <button type="button" key={a} aria-pressed={a === audience} onClick={() => setAudience(a)}>{a}</button>
          ))}
        </div>
      </fieldset>
      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={busy}>{busy ? "Starting…" : "Plan the lesson"}</button>
      <p className="muted small">You review the plan and the five steps before anything is built. Takes about two minutes.</p>
    </form>
  );
}

const STEPS = [
  { key: "plan", label: "Plan" },
  { key: "design", label: "Steps" },
  { key: "build", label: "Lesson" },
] as const;

function DraftView({ id }: { id: string }) {
  const [d, setD] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const load = () => api<Draft>(`/api/drafts/${id}`).then(setD).catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);
  useEffect(() => {
    if (d?.status !== "working") return;
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [d?.status]);
  useEffect(() => {
    if (d?.status === "ready") location.replace(`#/lesson/${id}`);
  }, [d?.status]);
  const run = (stage: string, body: object = {}) => api<Draft>(`/api/drafts/${id}/${stage}`, body).then(setD).catch((e: Error) => setError(e.message));

  if (error) return <p className="error">{error}</p>;
  if (!d) return <p className="muted">Loading…</p>;
  if (d.status === "ready") return null;
  const current = STEPS.findIndex((s) => s.key === d.stage);
  return (
    <>
      <a href="#/" className="back">← All lessons</a>
      <p className="request">“{d.request}” <span className="muted">· {d.audience}</span></p>
      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s.key} className={i < current || (i === current && d.status !== "working" && d.status !== "failed") ? "done" : i === current ? "now" : ""}>{s.label}</li>
        ))}
      </ol>
      {d.status === "working" && <Working d={d} />}
      {d.status === "failed" && (
        <div className="panel">
          <h2>Something went wrong</h2>
          <pre className="error">{d.error}</pre>
          <button className="btn primary" onClick={() => run(d.stage)}>Try again</button>
        </div>
      )}
      {d.status === "planned" && d.plan && <PlanReview d={d} run={run} />}
      {d.status === "designed" && d.design && <LevelsReview d={d} run={run} />}
    </>
  );
}

function Working({ d }: { d: Draft }) {
  return (
    <div className="panel working">
      <span className="spinner" aria-hidden="true" />
      <div>
        <strong>{d.activity || "Working…"}</strong>
        <p className="muted small">{d.log.map((l) => `${l.what} (${Math.round((l.ms || 0) / 1000)} s)`).join(" · ") || "This usually takes 10–60 seconds per step."}</p>
      </div>
    </div>
  );
}

function PlanReview({ d, run }: { d: Draft; run: (stage: string, body?: object) => void }) {
  const p = d.plan!;
  const [objectives, setObjectives] = useState(p.objectives.join("\n"));
  return (
    <div className="panel">
      <h2>{p.title}</h2>
      <p>{p.idea}</p>
      <p className="muted small">Uses: {p.components.join(", ")}</p>
      {d.source && (
        <p className="muted small">
          Based on your pasted text ({Math.round(d.source.text.length / 1000) || "<1"}k characters)
        </p>
      )}
      {p.fit === "partial" && p.note && <p className="warn">Partial fit: {p.note}</p>}
      <label>
        Learning objectives <span className="muted">(one per line, edit freely)</span>
        <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={5} />
      </label>
      <div className="row">
        <button className="btn primary" onClick={() => run("design", { objectives: objectives.split("\n") })}>Approve and design the steps</button>
        <button className="btn" onClick={() => run("plan")}>New plan</button>
      </div>
    </div>
  );
}

/** Text with $…$ LaTeX, rendered like in the lesson. */
function Rich({ text }: { text?: string }) {
  if (!text) return null;
  try {
    return <span dangerouslySetInnerHTML={{ __html: richHtml(text) }} />;
  } catch {
    return <>{text}</>;
  }
}

function LevelList({ levels }: { levels: Level[] }) {
  return (
    <ol className="levels">
      {levels.map((l, i) => (
        <li key={i}>
          <div className="level-head">
            <strong>{l.title}</strong>
            <span className="tag">{l.ask ? "question" : "goal"}</span>
          </div>
          <p><Rich text={l.goal} /></p>
          <details>
            <summary>Hints and solution</summary>
            <ul>{(l.hints || []).map((h, j) => <li key={j}><Rich text={h} /></li>)}</ul>
            <p><em>Solution:</em> <Rich text={l.solutionText} /></p>
            <p><em>After solving:</em> <Rich text={l.explain} /></p>
          </details>
        </li>
      ))}
    </ol>
  );
}

function LevelsReview({ d, run }: { d: Draft; run: (stage: string, body?: object) => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="panel">
      <h2>{d.design!.title}</h2>
      <p className="muted">Five steps, checked automatically: each starts unsolved and its solution works.</p>
      <LevelList levels={d.design!.levels} />
      <label>
        Want changes? <span className="muted">(optional)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. make step 2 easier, add a step about power" />
      </label>
      <div className="row">
        <button className="btn primary" onClick={() => run("build")}>Approve and build the lesson</button>
        <button className="btn" disabled={!note.trim()} onClick={() => run("design", { note })}>Redo the steps with my note</button>
      </div>
    </div>
  );
}
