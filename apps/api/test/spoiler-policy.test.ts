import assert from "node:assert/strict";
import test from "node:test";
import type { QuizRequest } from "../src/contracts.js";
import { buildSpoilerPolicy, getSafeBoundarySeconds } from "../src/services/spoiler-policy.js";

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

test("keeps a ten-second safety margin", () => {
  assert.equal(getSafeBoundarySeconds(request), 110);
  assert.equal(getSafeBoundarySeconds({ ...request, context: { ...request.context, currentTimeSeconds: 4 } }), 0);
});

test("binds the generated quiz to progress and locale", () => {
  const policy = buildSpoilerPolicy(request);
  assert.match(policy, /episode 2/);
  assert.match(policy, /second 110/);
  assert.match(policy, /fr-FR/);
});
