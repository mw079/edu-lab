// Protection for a hosted copy: a password for the teacher app, and a daily cap on model work so a shared link
// cannot spend the API key without limit. Both are off unless set (EDU_PASSWORD, EDU_DAILY_LIMIT).
import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** The browser's own sign-in box (HTTP Basic). Any user name works; only the password is checked. */
export function passwordGate(password: string): RequestHandler {
  return (req, res, next) => {
    if (!password || req.path === "/api/health") return next();
    const [scheme, encoded] = (req.headers.authorization || "").split(" ");
    const given = scheme === "Basic" && encoded ? Buffer.from(encoded, "base64").toString().split(":").slice(1).join(":") : "";
    if (same(given, password)) return next();
    res.set("WWW-Authenticate", 'Basic realm="Edu Lab", charset="UTF-8"').status(401).send("Enter the demo password to use Edu Lab.");
  };
}

/** At most `limit` model runs (new lessons, change requests, retries) per day (UTC). Counts reset on restart. */
export function dailyLimit(limit: number, now = () => new Date()): RequestHandler {
  let day = "", used = 0;
  return (_req, res, next) => {
    if (!(limit > 0)) return next();
    const today = now().toISOString().slice(0, 10);
    if (today !== day) (day = today), (used = 0);
    if (used >= limit) return res.status(429).json({ error: `This demo allows ${limit} lessons or changes a day, and today's are used up. Try again tomorrow.` });
    // Only requests that actually start model work (202) count; a refused or invalid one does not.
    res.on("finish", () => res.statusCode === 202 && used++);
    next();
  };
}
