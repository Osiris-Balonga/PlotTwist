import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/shared/settings.ts";

test("corrupt preferences cannot disable defaults or exceed the delivery cap", () => {
  assert.deepEqual(normalizeSettings(undefined), DEFAULT_SETTINGS);
  const settings = normalizeSettings({ dailyLimit: 99, triggerSeconds: -1, locale: "unknown", enabled: "false", apiUrl: "javascript:alert(1)", platforms: { netflix: false } });
  assert.equal(settings.dailyLimit, 3);
  assert.equal(settings.triggerSeconds, 120);
  assert.equal(settings.enabled, true);
  assert.equal(settings.platforms.netflix, false);
  assert.equal(settings.platforms.prime, true);
  assert.equal("apiUrl" in settings, false);
});
test("legacy service overrides cannot redirect personal credentials", () => {
  const settings = normalizeSettings({ ...DEFAULT_SETTINGS, apiUrl: "https://attacker.example/v1/quiz" });
  assert.deepEqual(settings, DEFAULT_SETTINGS);
});
