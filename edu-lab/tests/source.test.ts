import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanText, sourceBlock } from "../server/source.ts";

test("pasted source text is tidied, cut to size and wrapped for the prompt", () => {
  const t = cleanText("A  \t b\r\n\n\n\nc" + "x".repeat(20000));
  assert.match(t, /^A b\n\nc/);
  assert.ok(t.length < 12100 && t.endsWith("[…text cut here…]"));
  assert.match(sourceBlock({ text: "Momentum is conserved." }), /pasted by the teacher[\s\S]*Momentum is conserved\./);
});
