// No imports: lesson.ts uses this inside the sandbox, which may read only a few files (see sandbox.ts).

/** Text for HTML: & < > " escaped. */
export const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
