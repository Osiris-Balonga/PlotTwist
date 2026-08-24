import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const DEFAULT_DAILY_REQUEST_LIMIT = 10;

function nextUtcMidnight(now: number): number {
  const date = new Date(now);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
}

export function getDailyRequestLimit(value = process.env.QUIZ_DAILY_REQUEST_LIMIT): number {
  if (!value) return DEFAULT_DAILY_REQUEST_LIMIT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("QUIZ_DAILY_REQUEST_LIMIT must be a positive integer.");
  }
  return parsed;
}

export function getAnonymousClientKey(request: IncomingMessage): string {
  const clientId = request.headers["x-plottwist-client-id"];
  const source = typeof clientId === "string" && clientId.length <= 128
    ? `installation:${clientId}`
    : `network:${request.socket.remoteAddress ?? "unknown"}`;

  return createHash("sha256").update(source).digest("hex");
}

export class DailyRateLimiter {
  readonly #entries = new Map<string, RateLimitEntry>();

  constructor(readonly limit: number) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error("Rate limit must be a positive integer.");
  }

  consume(key: string, now = Date.now()): RateLimitDecision {
    if (this.#entries.size > 10_000) {
      for (const [entryKey, entry] of this.#entries) {
        if (entry.resetAt <= now) this.#entries.delete(entryKey);
      }
    }
    const existing = this.#entries.get(key);
    const entry = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: nextUtcMidnight(now) }
      : existing;

    if (entry.count >= this.limit) {
      return { allowed: false, limit: this.limit, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    this.#entries.set(key, entry);
    return {
      allowed: true,
      limit: this.limit,
      remaining: this.limit - entry.count,
      resetAt: entry.resetAt
    };
  }
}

export const quizRateLimiter = new DailyRateLimiter(getDailyRequestLimit());
