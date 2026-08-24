import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { QuizSchema, type Quiz, type QuizRequest } from "../contracts.js";
import { buildSpoilerPolicy, getSafeBoundarySeconds } from "./spoiler-policy.js";

const provider = createOpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY
});

const modelName = process.env.LLM_MODEL;

export async function generateQuiz(request: QuizRequest): Promise<Quiz> {
  if (!process.env.LLM_API_KEY || !process.env.LLM_BASE_URL || !modelName) {
    throw new Error("LLM_API_KEY, LLM_BASE_URL, and LLM_MODEL must be configured.");
  }

  const context = request.context;
  const result = await generateObject({
    model: provider(modelName),
    mode: "json",
    schema: QuizSchema,
    system: [
      "You create concise, entertaining streaming-video quizzes.",
      buildSpoilerPolicy(request)
    ].join("\n\n"),
    prompt: JSON.stringify({
      platform: context.platform,
      contentId: context.contentId,
      title: context.title,
      season: context.season,
      episode: context.episode,
      episodeTitle: context.episodeTitle,
      safeUntilSeconds: getSafeBoundarySeconds(request),
      spoilerLevel: request.spoilerLevel
    })
  });

  return result.object;
}
