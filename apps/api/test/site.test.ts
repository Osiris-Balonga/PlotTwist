import assert from "node:assert/strict";
import test from "node:test";
import { renderHomePage, renderPrivacyPage } from "../src/site.js";

test("renders the supplied PlotTwist landing direction with optimized local assets", () => {
  const page = renderHomePage();

  assert.match(page, /PlotTwist — Interactive spoiler quizzes/);
  assert.match(page, /\/assets\/hero-background\.webp/);
  assert.match(page, /\/assets\/plottwist-mark\.png/);
  assert.match(page, /\/assets\/chrome\.svg/);
  assert.match(page, /\/assets\/github\.svg/);
  assert.match(page, /Animated preview of a PlotTwist spoiler quiz/);
  assert.doesNotMatch(page, /data:image\//);
  assert.doesNotMatch(page, /cdn\.jsdelivr\.net/);
});

test("keeps the privacy policy reachable within the redesigned brand system", () => {
  const page = renderPrivacyPage();

  assert.match(page, /Privacy policy/);
  assert.match(page, /What PlotTwist processes/);
  assert.match(page, /href="\/"/);
});
