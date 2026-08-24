import assert from "node:assert/strict";
import test from "node:test";
import type { QuizRequest } from "../src/contracts.js";
import { buildSpoilerPolicy, getViewerProgressSeconds } from "../src/services/spoiler-policy.js";

const request: QuizRequest = {
  spoilerLevel: "light",
  context: {
    platform: "netflix",
    contentId: "42",
    title: "Example",
    season: 1,
    episode: 2,
    currentTimeSeconds: 120,
    url: "https://www.netflix.com/watch/42",
    locale: "fr-FR"
  }
};

test("normalizes viewer progress", () => {
  assert.equal(getViewerProgressSeconds(request), 120);
  assert.equal(getViewerProgressSeconds({ ...request, context: { ...request.context, currentTimeSeconds: 4.9 } }), 4);
});

test("requires an intentional future spoiler in the viewer locale", () => {
  const policy = buildSpoilerPolicy(request);
  assert.match(policy, /episode 2/);
  assert.match(policy, /second 120/);
  assert.match(policy, /after the viewer's current progress/);
  assert.match(policy, /question itself must reveal/);
  assert.match(policy, /death/);
  assert.match(policy, /Never merge two antagonists/);
  assert.match(policy, /light stays within the current episode/);
  assert.match(policy, /fr-FR/);
});
