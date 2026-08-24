import type { Quiz } from "../contracts.js";

type RandomSource = () => number;

export function shuffleQuizChoices(quiz: Quiz, random: RandomSource = Math.random): Quiz {
  const choices = quiz.choices.map((label, index) => ({
    label,
    correct: index === quiz.correctChoiceIndex
  }));

  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
  }

  return {
    ...quiz,
    choices: choices.map(({ label }) => label),
    correctChoiceIndex: choices.findIndex(({ correct }) => correct)
  };
}
