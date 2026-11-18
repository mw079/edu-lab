// A hosted demo keeps no lessons: created lessons nobody has used for a while are erased, examples never are.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

process.env.EDU_DATA_DIR = mkdtempSync(join(tmpdir(), "edu-lab-data-"));
const p = await import("../server/pipeline.ts");

const MIN = 60_000;

test("a lesson is erased 14 minutes after it was last used, and using it keeps it", () => {
  const start = Date.now();
  const idle = p.newDraft("Idle lesson", "High school");
  const used = p.newDraft("Used lesson", "High school");
  for (const d of [idle, used]) Object.assign(d, { status: "built" }), p.saveDraft(d);
  p.touchDraft(idle.id, start);
  p.touchDraft(used.id, start);

  assert.deepEqual(p.expireDrafts(14 * MIN, start + 10 * MIN), []);
  p.touchDraft(used.id, start + 10 * MIN); // someone opens it again
  assert.deepEqual(p.expireDrafts(14 * MIN, start + 15 * MIN), [idle.id]);
  assert.equal(p.getDraft(idle.id), null);
  assert.ok(p.getDraft(used.id));
  assert.deepEqual(p.expireDrafts(14 * MIN, start + 25 * MIN), [used.id]);
});

test("examples are never erased, and the trash is emptied", () => {
  const d = p.newDraft("Thrown away", "High school");
  Object.assign(d, { status: "built" }), p.saveDraft(d);
  assert.equal(p.deleteDraft(d.id), "ok");
  assert.ok(existsSync(join(process.env.EDU_DATA_DIR!, "trash")));
  p.expireDrafts(14 * MIN);
  assert.ok(!existsSync(join(process.env.EDU_DATA_DIR!, "trash")));
  assert.ok(existsSync("examples/momentum/design.json"));
});
