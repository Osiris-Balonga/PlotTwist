import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { QuizSchema, type Quiz, type QuizRequest } from "../contracts.js";
import { shuffleQuizChoices } from "./quiz-choice-order.js";
import { buildSpoilerPolicy, getViewerProgressSeconds } from "./spoiler-policy.js";
import { PROVIDERS, type Connection } from "./connections.js";

export async function generateQuiz(request: QuizRequest, config: Connection): Promise<Quiz> {
  if (!config.apiKey || !config.model) {
    throw new Error("Personal connection is not configured.");
  }
  const provider = createOpenAI({
    baseURL: PROVIDERS[config.provider].baseUrl, apiKey: config.apiKey,
    fetch: (url, options) => fetch(url, { ...options, redirect: "error" })
  });

  const context = request.context;
  const result = await generateObject({
    model: provider(config.model),
    abortSignal: AbortSignal.timeout(25_000),
    mode: "json",
    schema: QuizSchema,
    system: [
      "You create concise, playful streaming-video quizzes whose purpose is to spoil a real future plot event.",
      buildSpoilerPolicy(request)
    ].join("\n\n"),
    prompt: JSON.stringify({
      platform: context.platform,
      contentId: context.contentId,
      title: context.title,
      season: context.season,
      episode: context.episode,
      episodeTitle: context.episodeTitle,
      viewerProgressSeconds: getViewerProgressSeconds(request),
      durationSeconds: context.durationSeconds,
      sourceUrl: context.url,
      spoilerLevel: request.spoilerLevel
    })
  });

  return shuffleQuizChoices(result.object);
}
