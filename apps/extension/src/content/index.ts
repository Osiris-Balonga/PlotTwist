import { buildEpisodeKey } from "../shared/episode-key";
import type { Quiz, QuizEligibility, QuizErrorCode, QuizRequest } from "../shared/quiz";
import { isPlaying } from "./adapters/base";
import { netflixAdapter } from "./adapters/netflix";
import { primeVideoAdapter } from "./adapters/prime-video";
import { MAX_QUIZ_REQUEST_ATTEMPTS } from "./config";
import { DEFAULT_SETTINGS, normalizeSettings } from "../shared/settings";
import { mountOverlay } from "./ui/overlay";

type QuizResult = { quiz?: Quiz; error?: QuizErrorCode };

const adapter = [netflixAdapter, primeVideoAdapter].find((candidate) => candidate.matches(new URL(location.href)));

if (adapter) {
  let settings = DEFAULT_SETTINGS;
  let settingsReady = false;
  let settingsRevision = 0;
  const enabled = () => settingsReady && settings.enabled && settings.platforms[adapter.platform];
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
      if (!enabled()) return { error: "disabled" };
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
            currentTimeSeconds: Math.max(context.currentTimeSeconds, settings.triggerSeconds),
            locale: settings.locale === "auto" ? context.locale : settings.locale
          },
          spoilerLevel: settings.spoilerLevel
        } satisfies QuizRequest
      })) ?? { error: "runtime_unavailable" };
    })();

    quizLoads.set(episodeKey, load);
    return load;
  };

  const presentQuizWhenReady = async (episodeKey: string): Promise<void> => {
    const revision = settingsRevision;
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
        if (revision === settingsRevision && result.error !== "disabled") suppressedEpisodeKeys.add(episodeKey);
        return;
      }
      if (revision !== settingsRevision || !enabled()) return;

      const context = adapter.getContext();
      const player = adapter.getPlayer();
      if (
        buildEpisodeKey(context) !== episodeKey
        || !player
        || !isPlaying(player)
        || player.currentTime < settings.triggerSeconds
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
        || revision !== settingsRevision || !enabled()
        || !activePlayer
        || !isPlaying(activePlayer)
        || activePlayer.currentTime < settings.triggerSeconds
      ) return;

      shownEpisodeKey = episodeKey;
      activePlayer.pause();
      mountOverlay(adapter.platform, settings.locale === "auto" ? context.locale : settings.locale, result.quiz, () => {
        if (activePlayer.isConnected && !activePlayer.ended) void activePlayer.play().catch(() => undefined);
      });
    } finally {
      if (presentingEpisodeKey === episodeKey) presentingEpisodeKey = undefined;
    }
  };

  const update = () => {
    if (!enabled()) return;
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

    if (player.currentTime >= Math.max(0, settings.triggerSeconds - 60)) void startQuizLoad(episodeKey);
    if (player.currentTime >= settings.triggerSeconds && presentingEpisodeKey !== episodeKey) {
      void presentQuizWhenReady(episodeKey);
    }
  };

  adapter.observeChanges(update);
  window.setInterval(update, 1_000);
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (sender.id !== chrome.runtime.id || message.type !== "PREFERENCES_CHANGED") return;
    settings = normalizeSettings(message.settings);
    settingsRevision++;
    quizLoads.clear(); requestAttempts.clear(); suppressedEpisodeKeys.clear();
    update();
  });
  void sendMessage<unknown>({ type: "GET_PREFERENCES" }).then((stored) => { settings = normalizeSettings(stored); settingsReady = true; update(); });
}
