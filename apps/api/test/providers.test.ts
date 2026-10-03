import assert from "node:assert/strict";
import test from "node:test";
import { PROVIDERS, type ProviderId } from "@plottwist/providers";
import { ConnectionSchema, listModels } from "../src/services/connections.js";
import { generateQuiz } from "../src/services/quiz-generator.js";

for (const provider of ["deepseek", "kimi", "gemini"] as ProviderId[]) {
  test(`${provider}: lists models and generates quizzes using its own fixed endpoint and personal key`, async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];
    const key = `fixture-${provider}-key`;
    const model = `${provider}-test-model`;
    globalThis.fetch = async (url, options) => {
      calls.push(String(url));
      assert.equal(new Headers(options?.headers).get("Authorization"), `Bearer ${key}`);
      assert.equal(options?.redirect, "error");
      if (String(url).endsWith("/models")) return new Response(JSON.stringify({ data: [{ id: model }] }));
      const body = JSON.parse(options?.body as string);
      assert.equal(body.model, model);
      return new Response(JSON.stringify({ id: "test-completion", object: "chat.completion", created: 1, model,
        choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify({
          hint: "A betrayal", question: "Who betrays the group?", choices: ["A", "B", "C"], correctChoiceIndex: 1,
          reveal: "B betrays the group.", viewerProgressSeconds: 120
        }) } }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
      }), { headers: { "Content-Type": "application/json" } });
    };
    try {
      const config = { provider, model, apiKey: key };
      assert.equal(ConnectionSchema.parse(config).provider, provider);
      assert.deepEqual(await listModels(config), [model]);
      assert.equal((await generateQuiz({ context: { platform: "netflix", contentId: "test", currentTimeSeconds: 120,
        url: "https://www.netflix.com/watch/1", locale: "fr" }, spoilerLevel: "light" }, config)).reveal, "B betrays the group.");
      assert.deepEqual(calls, [`${PROVIDERS[provider].baseUrl}/models`, `${PROVIDERS[provider].baseUrl}/chat/completions`]);
    } finally { globalThis.fetch = originalFetch; }
  });
}
