// The hosted copy's password and daily limit, on a real Express server with no model behind it.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express from "express";
import { dailyLimit, passwordGate } from "../server/guard.ts";

async function serve(app: express.Express) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, close: () => server.close() };
}
const basic = (pw: string) => ({ authorization: "Basic " + Buffer.from(`teacher:${pw}`).toString("base64") });

test("the password gate asks for the password, accepts the right one and leaves the health check open", async () => {
  const app = express();
  app.use(passwordGate("s3cret:pass"));
  app.get(["/app/", "/api/health"], (_req, res) => res.send("ok"));
  const { url, close } = await serve(app);
  try {
    const none = await fetch(url + "/app/");
    assert.equal(none.status, 401);
    assert.match(none.headers.get("www-authenticate") || "", /^Basic/);
    assert.equal((await fetch(url + "/app/", { headers: basic("wrong") })).status, 401);
    assert.equal((await fetch(url + "/app/", { headers: basic("s3cret:pass") })).status, 200);
    assert.equal((await fetch(url + "/api/health")).status, 200);
  } finally {
    close();
  }
});

test("no password set means no gate", async () => {
  const app = express();
  app.use(passwordGate(""));
  app.get("/app/", (_req, res) => res.send("ok"));
  const { url, close } = await serve(app);
  try {
    assert.equal((await fetch(url + "/app/")).status, 200);
  } finally {
    close();
  }
});

test("the daily limit counts only started work and resets the next day", async () => {
  let now = new Date("2026-11-18T10:00:00Z");
  const app = express();
  app.use(dailyLimit(2, () => now));
  app.post("/start", (_req, res) => res.status(202).send("started"));
  app.post("/invalid", (_req, res) => res.status(400).send("bad request"));
  const { url, close } = await serve(app);
  const post = (path: string) => fetch(url + path, { method: "POST" }).then((r) => r.status);
  try {
    assert.equal(await post("/invalid"), 400); // not counted
    assert.equal(await post("/start"), 202);
    assert.equal(await post("/start"), 202);
    assert.equal(await post("/start"), 429);
    now = new Date("2026-11-19T00:01:00Z");
    assert.equal(await post("/start"), 202);
  } finally {
    close();
  }
});
