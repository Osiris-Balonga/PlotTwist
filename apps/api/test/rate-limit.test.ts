import assert from "node:assert/strict";
import test from "node:test";
import { DailyRateLimiter, getDailyRequestLimit } from "../src/services/rate-limit.js";

test("uses a configurable positive daily request limit", () => {
  assert.equal(getDailyRequestLimit(undefined), 10);
  assert.equal(getDailyRequestLimit("3"), 3);
  assert.throws(() => getDailyRequestLimit("0"), /positive integer/);
  assert.throws(() => getDailyRequestLimit("many"), /positive integer/);
});

test("rejects requests after the daily allowance is consumed", () => {
  const limiter = new DailyRateLimiter(2);
  const now = Date.UTC(2026, 7, 24, 12);

  assert.deepEqual(limiter.consume("installation", now), {
    allowed: true,
    limit: 2,
    remaining: 1,
    resetAt: Date.UTC(2026, 7, 25)
  });
  assert.equal(limiter.consume("installation", now).remaining, 0);
  assert.equal(limiter.consume("installation", now).allowed, false);
});

test("resets the allowance at the next UTC day", () => {
  const limiter = new DailyRateLimiter(1);
  const firstDay = Date.UTC(2026, 7, 24, 23, 59);

  assert.equal(limiter.consume("installation", firstDay).allowed, true);
  assert.equal(limiter.consume("installation", firstDay + 30_000).allowed, false);
  assert.equal(limiter.consume("installation", Date.UTC(2026, 7, 25)).allowed, true);
});
