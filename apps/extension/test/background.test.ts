import assert from "node:assert/strict";
import test from "node:test";

test("streaming scripts get only preferences and cannot manage personal connections", async () => {
  const data: Record<string, unknown> = { "preferences:v1": { enabled: false, apiUrl: "https://attacker.example" }, "personalConnectionCredential:v1": "a".repeat(64) };
  let listener: (message: unknown, sender: unknown, respond: (result: unknown) => void) => boolean;
  let accessLevel = "";
  const originalChrome = (globalThis as any).chrome;
  (globalThis as any).chrome = {
    runtime: { id: "test-extension", getURL: (value: string) => `chrome-extension://test-extension/${value}`, onMessage: { addListener: (handler: typeof listener) => { listener = handler; } } },
    storage: {
      local: {
        setAccessLevel: async (value: { accessLevel: string }) => { accessLevel = value.accessLevel; },
        get: async (key: string) => ({ [key]: data[key] }), set: async () => {}, remove: async () => {}
      },
      session: { setAccessLevel: async () => {} }, onChanged: { addListener: () => {} }
    }
  };
  try {
    await import("../src/background/index.ts");
    const sender = { id: "test-extension", url: "https://www.netflix.com/watch/1" };
    const send = (message: unknown) => new Promise<any>(resolve => listener(message, sender, resolve));
    assert.equal(accessLevel, "TRUSTED_CONTEXTS");
    for (const type of ["CONNECTION_GET", "CONNECTION_SAVE", "CONNECTION_DELETE", "CONNECTION_MODELS", "CONNECTION_TEST"]) {
      assert.deepEqual(await send({ type }), { error: "Accès refusé." });
    }
    const preferences = await send({ type: "GET_PREFERENCES" });
    assert.equal(preferences.enabled, false);
    assert.equal("apiUrl" in preferences, false);
    assert.equal(JSON.stringify(preferences).includes("a".repeat(64)), false);
  } finally { (globalThis as any).chrome = originalChrome; }
});
