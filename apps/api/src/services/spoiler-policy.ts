import type { QuizRequest } from "../contracts.js";

export function getSafeBoundarySeconds(request: QuizRequest): number {
  const watchedSeconds = Math.floor(request.context.currentTimeSeconds);
  return Math.max(0, watchedSeconds - 10);
}

export function buildSpoilerPolicy(request: QuizRequest): string {
  const boundary = getSafeBoundarySeconds(request);
  const episodeScope = request.context.season && request.context.episode
    ? `season ${request.context.season}, episode ${request.context.episode}`
    : "the current title";

  return [
    "Spoiler safety is mandatory.",
    `Only use facts revealed in ${episodeScope} before second ${boundary}.`,
    "Do not mention future episodes, unresolved outcomes, deaths, twists, or character arcs beyond this boundary.",
    "If the available context is insufficient to safely create a quiz, ask a broad comprehension question instead of inferring unrevealed facts.",
    `Write every user-facing string in locale ${request.context.locale}.`,
    "Return exactly three plausible choices and reveal only the explanation appropriate for the requested spoiler level."
  ].join(" ");
}
