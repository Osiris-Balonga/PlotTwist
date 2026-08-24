import type { ViewingContext } from "../shared/viewing-context";
import type { Quiz, QuizRequest } from "../shared/quiz";

const CONTEXT_KEY = "activeViewingContext";

chrome.runtime.onMessage.addListener((message: { type?: string; context?: ViewingContext; request?: QuizRequest }) => {
  if (message.type === "VIEWING_CONTEXT_UPDATED" && message.context) return chrome.storage.session.set({ [CONTEXT_KEY]: message.context });
  if (message.type !== "REQUEST_QUIZ" || !message.request) return;
  return (async (): Promise<{ quiz?: Quiz; error?: string }> => {
    const request = message.request!; const key = `quiz:${request.context.contentId ?? request.context.title}:${Math.floor(request.context.currentTimeSeconds / 300)}:${request.context.locale}`;
    const cached = await chrome.storage.local.get(key); if (cached[key]) return { quiz: cached[key] as Quiz };
    try { const response = await fetch("http://localhost:8787/v1/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) }); if (!response.ok) throw new Error(); const { quiz } = await response.json() as { quiz: Quiz }; await chrome.storage.local.set({ [key]: quiz }); return { quiz }; } catch { return { error: "Unable to prepare a quiz right now." }; }
  })();
});
