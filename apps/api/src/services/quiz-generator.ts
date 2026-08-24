import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { QuizSchema, type Quiz, type QuizRequest } from "../contracts.js";
import { buildSpoilerPolicy, getSafeBoundarySeconds } from "./spoiler-policy.js";

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY
});

const modelName = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

export async function generateQuiz(request: QuizRequest): Promise<Quiz> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured.");
  }

  const context = request.context;
  const result = await generateObject({
    model: deepseek(modelName),
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
