import { buildEpisodeKey } from "../shared/episode-key";
import type { Quiz, QuizEligibility, QuizErrorCode, QuizRequest } from "../shared/quiz";
import { isPlaying } from "./adapters/base";
import { netflixAdapter } from "./adapters/netflix";
import { primeVideoAdapter } from "./adapters/prime-video";
import {
  DEFAULT_SPOILER_LEVEL,
  MAX_QUIZ_REQUEST_ATTEMPTS,
  QUIZ_PREFETCH_SECONDS,
  QUIZ_TRIGGER_SECONDS
} from "./config";
import { mountOverlay } from "./ui/overlay";

type QuizResult = { quiz?: Quiz; error?: QuizErrorCode };

const adapter = [netflixAdapter, primeVideoAdapter].find((candidate) => candidate.matches(new URL(location.href)));

if (adapter) {
  let lastContext = adapter.getContext();
  let shownEpisodeKey: string | undefined;
  let presentingEpisodeKey: string | undefined;
  const quizLoads = new Map<string, Promise<QuizResult>>();
  const requestAttempts = new Map<string, number>();
  const suppressedEpisodeKeys = new Set<string>();

  const sendMessage = <T>(message: unknown): Promise<T | undefined> => {
    if (!chrome.runtime?.id) return Promise.resolve(undefined);
    return chrome.runtime.sendMessage(message).catch(() => undefined);
  };

  const startQuizLoad = (episodeKey: string, checkEligibility = true): Promise<QuizResult> => {
    const existing = quizLoads.get(episodeKey);
    if (existing) return existing;

    const load = (async (): Promise<QuizResult> => {
      if (checkEligibility) {
        const eligibility = await sendMessage<QuizEligibility>({
          type: "CHECK_QUIZ_ELIGIBILITY",
          context: adapter.getContext()
        });
        if (!eligibility) return { error: "runtime_unavailable" };
        if (!eligibility.eligible) return { error: eligibility.reason };
      }

      const context = adapter.getContext();
      if (buildEpisodeKey(context) !== episodeKey) return { error: "unavailable" };
      requestAttempts.set(episodeKey, (requestAttempts.get(episodeKey) ?? 0) + 1);
      return (await sendMessage<QuizResult>({
        type: "REQUEST_QUIZ",
        request: {
          context: {
            ...context,
            currentTimeSeconds: Math.max(context.currentTimeSeconds, QUIZ_TRIGGER_SECONDS)
          },
          spoilerLevel: DEFAULT_SPOILER_LEVEL
        } satisfies QuizRequest
      })) ?? { error: "runtime_unavailable" };
    })();

    quizLoads.set(episodeKey, load);
    return load;
  };

  const presentQuizWhenReady = async (episodeKey: string): Promise<void> => {
    presentingEpisodeKey = episodeKey;
    try {
      let result = await startQuizLoad(episodeKey);
      if (
        !result.quiz
        && result.error === "unavailable"
        && (requestAttempts.get(episodeKey) ?? 0) < MAX_QUIZ_REQUEST_ATTEMPTS
      ) {
        quizLoads.delete(episodeKey);
        result = await startQuizLoad(episodeKey, false);
      }

      if (!result.quiz) {
        suppressedEpisodeKeys.add(episodeKey);
        return;
      }

      const context = adapter.getContext();
      const player = adapter.getPlayer();
      if (
        buildEpisodeKey(context) !== episodeKey
        || !player
        || !isPlaying(player)
        || player.currentTime < QUIZ_TRIGGER_SECONDS
      ) return;

      const claim = await sendMessage<QuizEligibility>({
        type: "CLAIM_QUIZ_PRESENTATION",
        context
      });
      if (!claim?.eligible) {
        suppressedEpisodeKeys.add(episodeKey);
        return;
      }

      const activePlayer = adapter.getPlayer();
      if (
        buildEpisodeKey(adapter.getContext()) !== episodeKey
        || !activePlayer
        || !isPlaying(activePlayer)
        || activePlayer.currentTime < QUIZ_TRIGGER_SECONDS
      ) return;

      shownEpisodeKey = episodeKey;
      activePlayer.pause();
      mountOverlay(adapter.platform, context.locale, result.quiz, () => {
        if (activePlayer.isConnected && !activePlayer.ended) void activePlayer.play().catch(() => undefined);
      });
    } finally {
      if (presentingEpisodeKey === episodeKey) presentingEpisodeKey = undefined;
    }
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
      shownEpisodeKey === episodeKey
      || suppressedEpisodeKeys.has(episodeKey)
      || !player
      || !isPlaying(player)
    ) return;

    if (player.currentTime >= QUIZ_PREFETCH_SECONDS) void startQuizLoad(episodeKey);
    if (player.currentTime >= QUIZ_TRIGGER_SECONDS && presentingEpisodeKey !== episodeKey) {
      void presentQuizWhenReady(episodeKey);
    }
  };

  adapter.observeChanges(update);
  window.setInterval(update, 1_000);
  update();
}
