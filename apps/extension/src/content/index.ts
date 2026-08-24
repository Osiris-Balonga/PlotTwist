import { netflixAdapter } from "./adapters/netflix";
import { primeVideoAdapter } from "./adapters/prime-video";
import type { PlatformAdapter } from "./adapters/types";
import { mountOverlay } from "./ui/overlay";
import type { QuizRequest } from "../shared/quiz";

const adapters: PlatformAdapter[] = [netflixAdapter, primeVideoAdapter];
const adapter = adapters.find((candidate) => candidate.matches(new URL(window.location.href)));

if (adapter) {
  let lastContext = adapter.getContext();
  mountOverlay(adapter.platform, lastContext.locale, () => chrome.runtime.sendMessage({ type: "REQUEST_QUIZ", request: { context: adapter.getContext(), spoilerLevel: "light" } satisfies QuizRequest }));

  const publishContext = () => {
    const nextContext = adapter.getContext();
    if (JSON.stringify(nextContext) === JSON.stringify(lastContext)) return;

    lastContext = nextContext;
    void chrome.runtime.sendMessage({ type: "VIEWING_CONTEXT_UPDATED", context: nextContext });
  };

  adapter.observeChanges(publishContext);
  window.setInterval(publishContext, 5_000);
  void chrome.runtime.sendMessage({ type: "VIEWING_CONTEXT_UPDATED", context: lastContext });
}
