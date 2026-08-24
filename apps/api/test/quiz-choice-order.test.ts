import assert from "node:assert/strict";
import test from "node:test";
import type { Quiz } from "../src/contracts.js";
import { shuffleQuizChoices } from "../src/services/quiz-choice-order.js";

const quiz: Quiz = {
  hint: "A future betrayal is revealed.",
  question: "Who betrays the team?",
  choices: ["The correct character", "Distractor one", "Distractor two"],
  correctChoiceIndex: 0,
  reveal: "The correct character betrays the team.",
  viewerProgressSeconds: 120
};

function sequenceRandom(...values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}

test("shuffleQuizChoices can place the correct answer in every position", () => {
  const first = shuffleQuizChoices(quiz, sequenceRandom(0.99, 0.99));
  const second = shuffleQuizChoices(quiz, sequenceRandom(0.99, 0));
  const third = shuffleQuizChoices(quiz, sequenceRandom(0, 0));

  assert.equal(first.correctChoiceIndex, 0);
  assert.equal(second.correctChoiceIndex, 1);
  assert.equal(third.correctChoiceIndex, 2);
});

test("shuffleQuizChoices keeps the correct label aligned with its index", () => {
  const shuffled = shuffleQuizChoices(quiz, sequenceRandom(0, 0));

  assert.deepEqual(new Set(shuffled.choices), new Set(quiz.choices));
  assert.equal(shuffled.choices[shuffled.correctChoiceIndex], "The correct character");
});
