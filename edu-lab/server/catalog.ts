// The component catalogue the generator chooses from (simkit/catalog.json + simkit/snippets/<id>.js).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./env.ts";

type CatalogEntry = { id: string; kind: "simulation" | "picture"; name: string; topics: string[]; summary: string };

export function catalog(): CatalogEntry[] {
  return JSON.parse(readFileSync(join(ROOT, "simkit", "catalog.json"), "utf8"));
}

/** One line per component, for the planning prompt. */
export function catalogSummary(): string {
  return catalog()
    .map((c) => `- ${c.id} (${c.kind}): ${c.name}. ${c.summary} Topics: ${c.topics.join(", ")}.`)
    .join("\n");
}

/** Usage example (API comment + example scene) for one component. */
export function snippet(id: string): string {
  const file = join(ROOT, "simkit", "snippets", `${id}.js`);
  if (!/^[A-Za-z0-9]+$/.test(id) || !existsSync(file)) throw new Error(`Unknown component "${id}"`);
  return readFileSync(file, "utf8");
}

/** The API comment block at the top of a snippet (no example code), for the design prompt. */
export function snippetApi(id: string): string {
  return snippet(id)
    .split("\n")
    .filter((l) => l.startsWith("//"))
    .join("\n");
}
