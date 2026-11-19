import { useEffect, useState } from "react";
import { AUDIENCES } from "../../server/audience";
import { richHtml } from "../../server/math";

type LessonSummary = { id: string; title: string; audience: string; own: boolean };
type DraftSummary = { id: string; request: string; status: string; title?: string };
type Level = { title: string; goal: string; ask?: { label: string; unit?: string }; hints?: string[]; solutionText?: string; explain?: string };
type Draft = {
  id: string;
  request: string;
  audience: string;
  status: "working" | "planned" | "designed" | "built" | "ready" | "failed";
  stage: "plan" | "design" | "build" | "revise";
  activity?: string;
  source?: { text: string };
  plan?: { title: string; audience: string; idea: string; objectives: string[]; components: string[]; fit?: string; note?: string };
  design?: { title: string; subtitle?: string; levels: Level[] };
  error?: string;
  version?: number;
  hasPrevious?: boolean;
  componentNames?: string[];
  startedAt?: string;
  notice?: { applied: boolean; text: string };
  revisions?: { at: string; note: string; step?: number }[];
  log: { at: string; stage: string; what: string; ms?: number }[];
};

async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const res = await fetch(path, body === undefined ? (method ? { method } : undefined) : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api(`/api/drafts/${id}`, undefined, "DELETE");
      setLessons((list) => list && list.filter((l) => l.id !== id));
      setDrafts((list) => list.filter((d) => d.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <>
      {/* How a lesson is made (npm run demo-video), loaded only when played. */}
      <video className="demo" controls preload="none" playsInline poster="/video/creating-a-lesson.jpg" aria-label="Video: creating a lesson in Edu Lab">
        <source src="/video/creating-a-lesson.mp4" type="video/mp4" />
      </video>
      <div className="home-head">
        <h1>Lessons</h1>
        <div className="chips" role="group" aria-label="Audience">
          {["All", ...AUDIENCES].map((a) => (
            <button key={a} className="chip" aria-pressed={a === filter} onClick={() => setFilter(a)}>{a}</button>
          ))}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {drafts.length > 0 && (
        <ul className="drafts">
          {drafts.map((d) => (
            <li key={d.id}>
              <a href={`#/draft/${d.id}`}>{d.title || d.request}</a>
              <span className={`status ${d.status}`}>{statusLabel(d.status)}</span>
              {d.status !== "working" && <button className="link quiet" onClick={() => remove(d.id, d.title || d.request)}>Delete</button>}
            </li>
          ))}
        </ul>
      )}
      {!lessons && !error && <p className="muted">Loading…</p>}
      <section className="grid">
        {shown?.map((l) => (
          <div key={l.id} className="lesson-card">
            <a href={`#/lesson/${l.id}`}>
              <div className="thumb">
                <img
                  src={`/lessons/${l.id}/thumb.png`}
                  alt=""
                  loading="lazy"
                  onLoad={(e) => e.currentTarget.parentElement?.classList.add("loaded")}
                  onError={(e) => e.currentTarget.parentElement?.classList.add("failed")}
                />
              </div>
              <h3>{l.title}</h3>
            </a>
            <p>
              {l.audience}
              {l.own && <button className="link quiet delete" onClick={() => remove(l.id, l.title)}>Delete</button>}
            </p>
          </div>
        ))}
      </section>
      {shown?.length === 0 && <p className="muted">No {filter.toLowerCase()} lessons yet.</p>}
    </>
  );
}

const statusLabel = (s: string) => ({ working: "Building…", planned: "Plan ready to review", designed: "Steps ready to review", built: "Lesson ready to review", failed: "Failed" })[s] || s;


/** A lesson in the app. The teacher's own lessons get a bar above it: approve the preview, ask for changes, undo. */
function LessonView({ id }: { id: string }) {
  // undefined while loading, null for a built-in example (no draft behind it)
  const [d, setD] = useState<Draft | null | undefined>(undefined);
  useEffect(() => {
    api<Draft>(`/api/drafts/${id}`).then(setD).catch(() => setD(null));
  }, [id]);
  useEffect(() => {
    if (d && d.status !== "built" && d.status !== "ready") location.replace(`#/draft/${id}`); // still being made or changed
  }, [d?.status]);
  if (d === undefined) return null;
  return (
    <div className="lesson-page">
      {d && <ReviewBar d={d} onChange={setD} />}
      {/* The lesson shows its own "← All lessons" link when it is embedded. ?v= reloads it after a change. */}
      <iframe className="lesson-view" src={`/lessons/${id}${d?.version ? `?v=${d.version}` : ""}`} title="Lesson" />
    </div>
  );
}

function ReviewBar({ d, onChange }: { d: Draft; onChange: (d: Draft) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [step, setStep] = useState(0);
  const [viewing, setViewing] = useState(0); // the step the lesson shows (1–5), 0 = exploring or unknown
  useEffect(() => {
    const on = (e: MessageEvent) => {
      // The lesson runs sandboxed (no origin of its own), so the message is recognised by the frame it comes from.
      if (e.source === document.querySelector<HTMLIFrameElement>("iframe.lesson-view")?.contentWindow && e.data?.source === "edu-lab" && typeof e.data.step === "number") setViewing(e.data.step >= 0 && e.data.step < 5 ? e.data.step + 1 : 0);
    };
    addEventListener("message", on);
    return () => removeEventListener("message", on);
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const post = async (path: string, body: object = {}) => {
    setBusy(true);
    setError("");
    try {
      return await api<Draft>(`/api/drafts/${d.id}/${path}`, body);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const approve = async () => {
    const next = await post("approve");
    if (next) onChange(next);
  };
  const undo = async () => {
    const next = await post("undo");
    if (next) onChange(next);
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await post("revise", { note, step: step || undefined })) location.hash = `#/draft/${d.id}`;
  };
  const preview = d.status === "built";
  return (
    <section className={`review-bar${preview ? " preview" : ""}`} aria-label="Review this lesson">
      <div className="review-row">
        <div className="review-text">
          {preview ? (
            <p><strong>Preview.</strong> <span className="muted">Try every step, then approve it or ask for changes.</span></p>
          ) : (
            <p><span className="badge">✓ Approved</span> <span className="muted">This lesson is in the overview.</span></p>
          )}
          {d.notice && <p className={`notice small${d.notice.applied ? "" : " warn"}`}>{d.notice.applied ? d.notice.text : `Not changed: ${d.notice.text} The lesson stays as it was.`}</p>}
        </div>
        <div className="row">
          {d.hasPrevious && <button className="link quiet" disabled={busy} onClick={undo}>Undo last change</button>}
          <button
            className="btn"
            aria-expanded={open}
            disabled={busy}
            onClick={() => {
              if (!open) setStep(viewing); // the step the teacher is looking at
              setOpen(!open);
            }}
          >
            Request changes
          </button>
          {preview && <button className="btn primary" disabled={busy} onClick={approve}>Approve</button>}
        </div>
      </div>
      {open && (
        <form className="review-form" onSubmit={send}>
          <select value={step} onChange={(e) => setStep(Number(e.target.value))} aria-label="Which part">
            <option value={0}>Whole lesson</option>
            {(d.design?.levels || []).map((l, i) => (
              <option key={i} value={i + 1}>Step {i + 1}: {l.title}</option>
            ))}
          </select>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} required autoFocus placeholder="e.g. Use a 9 V battery in this step, or: make the resistor labels bigger" />
          <button className="btn primary" disabled={busy || note.trim().length < 3}>Send</button>
        </form>
      )}
      {error && <p className="error small">{error}</p>}
    </section>
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
        <textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && e.currentTarget.form?.requestSubmit()}
          rows={4}
          required
          minLength={5}
          autoFocus
          placeholder="e.g. Ohm's law: how current depends on voltage and resistance, with series resistors"
        />
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
      <p className="muted small">You review the plan, the five steps and the finished lesson before it goes into the overview. About two minutes in all.</p>
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
  const [sending, setSending] = useState(false); // a button's request is on its way: no second click
  // A successful load clears an earlier error (e.g. a dropped connection while polling).
  const load = () =>
    api<Draft>(`/api/drafts/${id}`)
      .then((next) => {
        setD(next);
        setError("");
      })
      .catch((e: Error) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);
  useEffect(() => {
    if (d?.status !== "working") return;
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [d?.status]);
  useEffect(() => {
    if (d?.status === "built" || d?.status === "ready") location.replace(`#/lesson/${id}`); // preview or approved
  }, [d?.status]);
  const run = (stage: string, body: object = {}) => {
    if (sending) return;
    setSending(true);
    setError("");
    api<Draft>(`/api/drafts/${id}/${stage}`, body)
      .then(setD)
      .catch((e: Error) => setError(e.message))
      .finally(() => setSending(false));
  };

  // Errors are shown above the page, which stays usable; without a draft there is nothing else to show.
  const banner = error && <p className="error banner" role="alert">{error}</p>;
  if (!d) return banner || <p className="muted">Loading…</p>;
  if (d.status === "built" || d.status === "ready") return null;
  const current = STEPS.findIndex((s) => s.key === (d.stage === "revise" ? "build" : d.stage));
  return (
    <>
      <a href="#/" className="back">← All lessons</a>
      <p className="request">“{d.request}” <span className="muted">· {d.audience}</span></p>
      {banner}
      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s.key} className={i < current || (i === current && d.status !== "working" && d.status !== "failed") ? "done" : i === current ? "now" : ""}>{s.label}</li>
        ))}
      </ol>
      {d.status === "working" && <Working d={d} />}
      {d.status === "failed" && (
        <div className="panel">
          <h2>{{ plan: "The plan could not be made", design: "The steps did not pass the checks", build: "The simulation could not be made to work", revise: "The change could not be made" }[d.stage]}</h2>
          <p className="muted">The model's answers did not pass the automatic checks in time. Trying again usually works; everything you approved so far is kept.</p>
          <details className="details">
            <summary>Technical details</summary>
            <pre className="error small">{d.error}</pre>
          </details>
          <button className="btn primary" disabled={sending} onClick={() => run(d.stage)}>Try again</button>
        </div>
      )}
      {d.status === "planned" && d.plan && <PlanReview d={d} run={run} sending={sending} />}
      {d.status === "designed" && d.design && <LevelsReview d={d} run={run} sending={sending} />}
    </>
  );
}

function Working({ d }: { d: Draft }) {
  // Only what happened in the stage that is running now (for a change request: since it was asked).
  const request = d.stage === "revise" ? d.revisions?.at(-1) : undefined;
  const since = request?.at || d.startedAt;
  const log = since ? d.log.filter((l) => l.at >= since) : d.log;
  return (
    <div className="panel working">
      <span className="spinner" aria-hidden="true" />
      <div>
        {request && <p className="small">Your request{request.step ? ` (step ${request.step})` : ""}: “{request.note}”</p>}
        <strong>{d.activity || "Working…"}</strong>
        <p className="muted small">{log.length ? `Done: ${log.map((l) => `${l.what.toLowerCase()} (${Math.round((l.ms || 0) / 1000)} s)`).join(" · ")}` : "This usually takes 10–60 seconds per step."}</p>
      </div>
    </div>
  );
}

function PlanReview({ d, run, sending }: { d: Draft; run: (stage: string, body?: object) => void; sending: boolean }) {
  const p = d.plan!;
  const [objectives, setObjectives] = useState(p.objectives.join("\n"));
  return (
    <div className="panel">
      <h2>{p.title}</h2>
      <p>{p.idea}</p>
      <p className="muted small">Uses: {(d.componentNames?.length ? d.componentNames : p.components).join(", ")}</p>
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
        <button className="btn primary" disabled={sending || !objectives.trim()} onClick={() => run("design", { objectives: objectives.split("\n") })}>Approve and design the steps</button>
        <button className="btn" disabled={sending} onClick={() => run("plan")}>New plan</button>
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

function LevelsReview({ d, run, sending }: { d: Draft; run: (stage: string, body?: object) => void; sending: boolean }) {
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
        <button className="btn primary" disabled={sending} onClick={() => run("build")}>Approve and build the lesson</button>
        <button className="btn" disabled={sending || !note.trim()} onClick={() => run("design", { note })}>Redo the steps with my note</button>
      </div>
    </div>
  );
}
