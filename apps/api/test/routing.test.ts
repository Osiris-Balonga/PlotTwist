import assert from "node:assert/strict";
import test from "node:test";
import { resolveRequestPath } from "../src/app.js";

test("preserves local request paths", () => {
  assert.equal(resolveRequestPath(new URL("http://localhost:8787/health")), "/health");
});

test("restores paths forwarded through the Vercel function rewrite", () => {
  assert.equal(resolveRequestPath(new URL("https://example.com/api?__plottwist_path=")), "/");
  assert.equal(resolveRequestPath(new URL("https://example.com/api?__plottwist_path=privacy")), "/privacy");
  assert.equal(resolveRequestPath(new URL("https://example.com/api?__plottwist_path=v1/quiz")), "/v1/quiz");
});
