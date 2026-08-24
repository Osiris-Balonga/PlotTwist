import type { QuizRequest } from "../contracts.js";

export function getViewerProgressSeconds(request: QuizRequest): number {
  return Math.max(0, Math.floor(request.context.currentTimeSeconds));
}

export function buildSpoilerPolicy(request: QuizRequest): string {
  const progress = getViewerProgressSeconds(request);
  const episodeScope = request.context.season && request.context.episode
    ? `season ${request.context.season}, episode ${request.context.episode}`
    : "the current title";

  return [
    "Intentional spoilers are mandatory: this is not a spoiler-safe quiz.",
    `The viewer is at second ${progress} of ${episodeScope}.`,
    "Choose one well-established canonical event that happens after the viewer's current progress.",
    "The question itself must reveal a meaningful part of that future event, such as a death, betrayal, identity, alliance, or major reversal, while withholding exactly one fact answered by the choices.",
    "For example, reveal that a named character will die and ask who kills them; do not merely ask a spoiler-free comprehension or trivia question.",
    "Before writing, silently verify that every named character, action, cause, and outcome belongs to the same canonical event.",
    "Never merge two antagonists, victims, deaths, or confrontations into one question. Never invent an event.",
    "If any detail is uncertain, choose a simpler future event from the current episode that you can recall with high confidence.",
    `Write every user-facing string in locale ${request.context.locale}.`,
    "Return exactly three distinct and plausible choices.",
    "The reveal must use one or two sentences, restate only the same event and correct choice, and introduce no secondary plot detail.",
    `Use spoiler intensity ${request.spoilerLevel}: light stays within the current episode, moderate may use a later event in the current season, and advanced may use a major later twist.`
  ].join(" ");
}
