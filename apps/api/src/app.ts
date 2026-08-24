import type { IncomingMessage, ServerResponse } from "node:http";
import { QuizRequestSchema } from "./contracts.js";
import { generateQuiz } from "./services/quiz-generator.js";

function json(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { status: "ok" });
  if (request.method === "OPTIONS" && url.pathname.startsWith("/v1/")) return json(response, 204, {});
  if (request.method !== "POST" || url.pathname !== "/v1/quiz") return json(response, 404, { error: "Not found." });

  const payload = await readJson(request).catch(() => undefined);
  const parsed = QuizRequestSchema.safeParse(payload);
  if (!parsed.success) return json(response, 422, { error: "Invalid quiz request.", details: parsed.error.flatten() });

  try {
    const quiz = await generateQuiz(parsed.data);
    return json(response, 200, { quiz });
  } catch (error) {
    console.error("Quiz generation failed", error);
    return json(response, 503, { error: "Quiz generation is temporarily unavailable." });
  }
}
