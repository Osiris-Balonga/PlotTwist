import { netflixAdapter } from "./adapters/netflix";
import { primeVideoAdapter } from "./adapters/prime-video";
import { isPlaying } from "./adapters/base";
import { QUIZ_TRIGGER_SECONDS } from "./config";
import { mountOverlay } from "./ui/overlay";
import type { QuizRequest } from "../shared/quiz";

const adapter = [netflixAdapter, primeVideoAdapter].find((candidate) => candidate.matches(new URL(location.href)));

if (adapter) {
  let lastContext = adapter.getContext();
  let shown = false;
  const sendMessage = <T>(message: unknown): Promise<T | undefined> => {
    if (!chrome.runtime?.id) return Promise.resolve(undefined);
    return chrome.runtime.sendMessage(message).catch(() => undefined);
  };
  const update = () => {
    const context = adapter.getContext();
    if (JSON.stringify(context) !== JSON.stringify(lastContext)) {
      lastContext = context;
      void sendMessage({ type: "VIEWING_CONTEXT_UPDATED", context });
    }
    const player = adapter.getPlayer();
    if (!shown && player && isPlaying(player) && player.currentTime >= QUIZ_TRIGGER_SECONDS) {
      shown = true;
      player.pause();
      mountOverlay(
        adapter.platform,
        context.locale,
        async () => (await sendMessage<{ quiz?: import("../shared/quiz").Quiz; error?: string }>({
          type: "REQUEST_QUIZ",
          request: { context: adapter.getContext(), spoilerLevel: "light" } satisfies QuizRequest
        })) ?? { error: "runtime_unavailable" },
        () => {
          if (player.isConnected && !player.ended) void player.play().catch(() => undefined);
        }
      );
    }
  };
  adapter.observeChanges(update);
  window.setInterval(update, 1_000);
  update();
}
