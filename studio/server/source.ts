// Source material for a lesson: text the teacher pasted (a textbook section, lecture notes, …).
// The app never reads from the web; the teacher copies the text they want the lesson based on.

export type Source = { text: string };

const MAX_CHARS = 12000;

export function cleanText(text: string): string {
  const t = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) + "\n[…text cut here…]" : t;
}

/** The source as a block for a prompt, shortened to `max` characters. */
export function sourceBlock(s: Source, max = MAX_CHARS): string {
  const text = s.text.length > max ? s.text.slice(0, max) + "\n[…]" : s.text;
  return `Source material pasted by the teacher. Base the lesson on the ideas in it, but write your own wording; do not copy its sentences.\n<<<\n${text}\n>>>`;
}
