import { buildEpisodeKey } from "../shared/episode-key";
import type { Quiz, QuizEligibility, QuizRequest } from "../shared/quiz";
import { isPlaying } from "./adapters/base";
import { netflixAdapter } from "./adapters/netflix";
import { primeVideoAdapter } from "./adapters/prime-video";
import { DEFAULT_SPOILER_LEVEL, QUIZ_TRIGGER_SECONDS } from "./config";
import { mountOverlay } from "./ui/overlay";

const adapter = [netflixAdapter, primeVideoAdapter].find((candidate) => candidate.matches(new URL(location.href)));

if (adapter) {
  let lastContext = adapter.getContext();
  let shownEpisodeKey: string | undefined;
  let pendingEpisodeKey: string | undefined;

  const sendMessage = <T>(message: unknown): Promise<T | undefined> => {
    if (!chrome.runtime?.id) return Promise.resolve(undefined);
    return chrome.runtime.sendMessage(message).catch(() => undefined);
  };

  const showQuizWhenEligible = async (episodeKey: string): Promise<void> => {
    const eligibility = await sendMessage<QuizEligibility>({
      type: "CHECK_QUIZ_ELIGIBILITY",
      context: adapter.getContext()
    });

    if (pendingEpisodeKey === episodeKey) pendingEpisodeKey = undefined;
    const context = adapter.getContext();
    const player = adapter.getPlayer();
    if (buildEpisodeKey(context) !== episodeKey || !player || !isPlaying(player) || player.currentTime < QUIZ_TRIGGER_SECONDS) return;

    if (!eligibility?.eligible) {
      shownEpisodeKey = episodeKey;
      return;
    }

    shownEpisodeKey = episodeKey;
    player.pause();
    mountOverlay(
      adapter.platform,
      context.locale,
      async () => (await sendMessage<{ quiz?: Quiz; error?: string }>({
        type: "REQUEST_QUIZ",
        request: { context: adapter.getContext(), spoilerLevel: DEFAULT_SPOILER_LEVEL } satisfies QuizRequest
      })) ?? { error: "runtime_unavailable" },
      () => {
        if (player.isConnected && !player.ended) void player.play().catch(() => undefined);
      }
    );
  };

  const update = () => {
    const context = adapter.getContext();
    if (JSON.stringify(context) !== JSON.stringify(lastContext)) {
      lastContext = context;
      void sendMessage({ type: "VIEWING_CONTEXT_UPDATED", context });
    }

    const episodeKey = buildEpisodeKey(context);
    const player = adapter.getPlayer();
    if (
      shownEpisodeKey !== episodeKey
      && pendingEpisodeKey !== episodeKey
      && player
      && isPlaying(player)
      && player.currentTime >= QUIZ_TRIGGER_SECONDS
    ) {
      pendingEpisodeKey = episodeKey;
      void showQuizWhenEligible(episodeKey);
    }
  };

  adapter.observeChanges(update);
  window.setInterval(update, 1_000);
  update();
}
