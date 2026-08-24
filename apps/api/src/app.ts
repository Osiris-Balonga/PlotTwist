import type { IncomingMessage, ServerResponse } from "node:http";
import { QuizRequestSchema } from "./contracts.js";
import { generateQuiz } from "./services/quiz-generator.js";
import { getAnonymousClientKey, quizRateLimiter } from "./services/rate-limit.js";
import { renderHomePage, renderPrivacyPage } from "./site.js";

function json(response: ServerResponse, status: number, payload: unknown, headers: Record<string, string> = {}): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-PlotTwist-Client-Id",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function html(response: ServerResponse, body: string): void {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=300"
  });
  response.end(body);
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (request.method === "GET" && url.pathname === "/") return html(response, renderHomePage());
  if (request.method === "GET" && url.pathname === "/privacy") return html(response, renderPrivacyPage());
  if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { status: "ok" });
  if (request.method === "OPTIONS" && url.pathname.startsWith("/v1/")) return json(response, 204, {});
  if (request.method !== "POST" || url.pathname !== "/v1/quiz") return json(response, 404, { error: "Not found." });

  const payload = await readJson(request).catch(() => undefined);
  const parsed = QuizRequestSchema.safeParse(payload);
  if (!parsed.success) return json(response, 422, { error: "Invalid quiz request.", details: parsed.error.flatten() });

  const rateLimit = quizRateLimiter.consume(getAnonymousClientKey(request));
  const rateLimitHeaders = {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1_000))
  };
  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1_000));
    return json(response, 429, { error: "Daily quiz request limit reached.", code: "rate_limited" }, {
      ...rateLimitHeaders,
      "Retry-After": String(retryAfterSeconds)
    });
  }

  try {
    const quiz = await generateQuiz(parsed.data);
    return json(response, 200, { quiz }, rateLimitHeaders);
  } catch (error) {
    console.error("Quiz generation failed", error);
    return json(response, 503, { error: "Quiz generation is temporarily unavailable." }, rateLimitHeaders);
  }
}

export default handleRequest;
