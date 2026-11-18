// Fireworks chat-completions client (OpenAI-compatible). Text and image inputs.
import { config } from "./env.ts";

const URL = "https://api.fireworks.ai/inference/v1/chat/completions";

export type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type Message = { role: "system" | "user" | "assistant"; content: string | Part[] };
export type ChatOptions = { model?: string; maxTokens?: number; temperature?: number; timeoutMs?: number; retries?: number; reasoningEffort?: "low" | "medium" | "high" };
export type ChatResult = { text: string; reasoning: string; ms: number; usage: { prompt_tokens?: number; completion_tokens?: number } };

type ChatFn = (messages: Message[], opts: ChatOptions) => Promise<ChatResult>;
let fake: ChatFn | null = null;
/** Tests answer in place of the model (null restores the real API). */
export function setChatForTests(fn: ChatFn | null) {
  fake = fn;
}

export async function chat(messages: Message[], opts: ChatOptions = {}): Promise<ChatResult> {
  if (fake) return fake(messages, opts);
  if (!config.fireworksKey) throw new Error("FIREWORKS_API_KEY is not set (edu-lab/.env)");
  const body = JSON.stringify({
    model: opts.model || config.model,
    messages,
    max_tokens: opts.maxTokens ?? 8000,
    temperature: opts.temperature ?? 0.4,
    ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
  });
  const retries = opts.retries ?? 2;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const started = Date.now();
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.fireworksKey}`, "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(opts.timeoutMs ?? 240_000),
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Fireworks HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`Fireworks HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
      const data = (await res.json()) as {
        choices: { message: { content?: string; reasoning_content?: string }; finish_reason?: string }[];
        usage?: ChatResult["usage"];
      };
      const msg = data.choices?.[0]?.message || {};
      return { text: msg.content || "", reasoning: msg.reasoning_content || "", ms: Date.now() - started, usage: data.usage || {} };
    } catch (err) {
      lastError = err;
      if ((err as Error).name !== "TimeoutError" && !(err instanceof TypeError)) throw err;
    }
  }
  throw lastError;
}

/** Pull the first JSON object/array out of a model reply (handles ```json fences and surrounding prose). */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const src = fenced ? fenced[1] : text;
  const start = src.search(/[[{]/);
  if (start < 0) throw new Error("No JSON found in model reply");
  const open = src[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return JSON.parse(src.slice(start, i + 1)) as T;
  }
  throw new Error("Unterminated JSON in model reply");
}
