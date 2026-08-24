import { netflixAdapter } from "./adapters/netflix";
import { primeVideoAdapter } from "./adapters/prime-video";
import { mountOverlay } from "./ui/overlay";
import type { QuizRequest } from "../shared/quiz";
const adapter = [netflixAdapter, primeVideoAdapter].find((candidate) => candidate.matches(new URL(location.href)));
if (adapter) { let lastContext = adapter.getContext(); let shown = false; const update = () => { const context = adapter.getContext(); if (JSON.stringify(context) !== JSON.stringify(lastContext)) { lastContext = context; void chrome.runtime.sendMessage({ type: "VIEWING_CONTEXT_UPDATED", context }); } const player = adapter.getPlayer(); if (!shown && player && !player.paused && player.currentTime >= 120) { shown = true; mountOverlay(adapter.platform, context.locale, () => chrome.runtime.sendMessage({ type: "REQUEST_QUIZ", request: { context: adapter.getContext(), spoilerLevel: "light" } satisfies QuizRequest })); } }; adapter.observeChanges(update); window.setInterval(update, 1000); }
