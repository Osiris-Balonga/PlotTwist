import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import { handleRequest } from "../src/app.js";
import { ConnectionSchema, connectionIdentity, deleteConnection, loadConnection, resolveConnection, saveConnection, sealConnection, unsealConnection } from "../src/services/connections.js";

test("personal connections are encrypted, isolated, validated and removable", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plottwist-connections-"));
  const previous = { ...process.env }; const originalFetch = globalThis.fetch;
  process.env.PLOTTWIST_CONFIG_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  process.env.PLOTTWIST_CONFIG_DIRECTORY = directory;
  delete process.env.PLOTTWIST_CONFIG_REDIS_URL; delete process.env.PLOTTWIST_CONFIG_REDIS_TOKEN; delete process.env.VERCEL;
  const tokenA = "a".repeat(64), tokenB = "b".repeat(64);
  const identityA = connectionIdentity(`Bearer ${tokenA}`)!;
  const identityB = connectionIdentity(`Bearer ${tokenB}`)!;
  const config = { provider: "openai" as const, model: "gpt-test", apiKey: "test-only-key-a" };
  const server = createServer((request, response) => { void handleRequest(request, response); });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const call = (token: string, method = "GET", body?: unknown, suffix = "") => originalFetch(`http://127.0.0.1:${port}/v1/connection${suffix}`, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {})
  });
  const providerKeys: string[] = [];
  globalThis.fetch = async (url, options) => {
    providerKeys.push(new Headers(options?.headers).get("Authorization") ?? "");
    if (String(url).endsWith("/chat/completions")) return new Response(JSON.stringify({
      id: "test-completion", object: "chat.completion", created: 1, model: "gpt-test",
      choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify({
        hint: "A betrayal", question: "Who betrays the group?", choices: ["A", "B", "C"], correctChoiceIndex: 1,
        reveal: "B betrays the group.", viewerProgressSeconds: 120
      }) } }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ data: [{ id: "gpt-test" }, { id: "text-embedding-test" }] }), { status: 200 });
  };
  try {
    assert.equal(connectionIdentity("Bearer admin-token"), undefined);
    assert.equal((await call("invalid")).status, 401);
    assert.throws(() => ConnectionSchema.parse({ ...config, baseUrl: "https://attacker.example" }));
    assert.equal((await call(tokenA, "PUT", config)).status, 200);
    assert.deepEqual(await (await call(tokenA)).json(), { provider: "openai", model: "gpt-test", hasKey: true });
    assert.deepEqual(await (await call(tokenB)).json(), { provider: "openai", model: "", hasKey: false });
    const encrypted = await readFile(path.join(directory, `${identityA}.json`), "utf8");
    assert.equal(encrypted.includes(config.apiKey), false);
    assert.throws(() => unsealConnection(identityB, encrypted));
    assert.notEqual(sealConnection(identityA, config), encrypted);
    await saveConnection(identityB, { ...config, apiKey: "test-only-key-b" });
    assert.equal((await loadConnection(identityA))?.apiKey, config.apiKey);
    assert.equal((await loadConnection(identityB))?.apiKey, "test-only-key-b");
    assert.equal((await call(tokenA, "POST", { provider: "openai", model: "gpt-test" }, "/test")).status, 200);
    assert.equal((await call(tokenB, "POST", { provider: "openai", model: "gpt-test" }, "/test")).status, 200);
    assert.deepEqual(providerKeys.slice(-2), ["Bearer test-only-key-a", "Bearer test-only-key-b"]);
    const quizRequest = { context: { platform: "netflix", contentId: "test-series", currentTimeSeconds: 120, url: "https://www.netflix.com/watch/1", locale: "fr" }, spoilerLevel: "light" };
    for (const token of [tokenA, tokenB]) {
      const response = await originalFetch(`http://127.0.0.1:${port}/v1/quiz`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(quizRequest)
      });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).quiz.reveal, "B betrays the group.");
    }
    assert.deepEqual(providerKeys.slice(-2), ["Bearer test-only-key-a", "Bearer test-only-key-b"]);
    assert.equal((await call(tokenA, "PUT", { provider: "openai", model: "invented-model" })).status, 422);
    assert.equal((await loadConnection(identityA))?.model, "gpt-test");
    await assert.rejects(resolveConnection(identityA, { provider: "groq", model: "anything" }), /fournisseur/);
    assert.equal((await call(tokenA, "DELETE")).status, 200);
    assert.equal(await loadConnection(identityA), undefined);
    assert.equal((await loadConnection(identityB))?.apiKey, "test-only-key-b");
    await deleteConnection(identityB);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>(resolve => server.close(() => resolve()));
    process.env = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
