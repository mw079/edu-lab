// Math in lesson text: LaTeX between $…$ is rendered with KaTeX when the lesson is assembled, so lessons
// need no math library at run time (only KaTeX's stylesheet and fonts, inlined by lesson.ts).
// Used by the server and the teacher app.
import katex from "katex";

export type Rich = string | { html: string };

const MATH = /(?<!\\)\$([^$]+?)(?<!\\)\$/g;

export const hasMath = (text: unknown): text is string => typeof text === "string" && /(?<!\\)\$[^$]+?(?<!\\)\$/.test(text);

/**
 * Undo JSON escapes a model often gets wrong: "\frac" in JSON is a form feed plus "rac", "\times" a tab plus
 * "imes". Inside math such control characters are never intended, so turn them back into backslashes.
 */
export function repairLatex(latex: string): string {
  const map: Record<string, string> = { "\f": "\\f", "\t": "\\t", "\b": "\\b", "\r": "\\r", "\v": "\\v", "\n": "\\n" };
  // "kg·m/s": KaTeX cannot set the middle dot (U+00B7) inside \text{}, the dot operator (U+22C5) works everywhere.
  return latex.replace(/[\f\t\b\r\v\n]/g, (c) => map[c]).replace(/\u00b7/g, "\u22c5");
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** One LaTeX expression as HTML. Throws on invalid LaTeX. */
export const mathHtml = (latex: string, display = false) =>
  katex.renderToString(repairLatex(latex), { throwOnError: true, strict: "ignore", output: "html", displayMode: display });

/** Text with $…$ math as HTML (plain parts escaped; "\$" is a literal dollar sign). Throws on invalid LaTeX. */
export function richHtml(text: string): string {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(MATH)) {
    out += escapeHtml(text.slice(last, m.index).replace(/\\\$/g, "$"));
    out += mathHtml(m[1]);
    last = m.index! + m[0].length;
  }
  return out + escapeHtml(text.slice(last).replace(/\\\$/g, "$"));
}

/** The form the lesson shell understands: plain strings stay strings, text with math becomes { html }. */
export const rich = (text: unknown): unknown => (hasMath(text) ? { html: richHtml(text) } : text);

/** The LaTeX error in a piece of text, or null. */
export function mathError(text: unknown, wholeIsMath = false): string | null {
  if (typeof text !== "string") return null;
  try {
    if (wholeIsMath) mathHtml(text);
    else richHtml(text);
    return null;
  } catch (e) {
    return (e as Error).message.replace(/^KaTeX parse error: /, "");
  }
}
