import { buildEpisodeKey } from "../shared/episode-key";
import { MAX_DAILY_SPOILERS } from "../shared/limits";
import type { Quiz, QuizEligibility, QuizErrorCode, QuizRequest } from "../shared/quiz";
import type { ViewingContext } from "../shared/viewing-context";
import { DEFAULT_API_URL, loadSettings, SETTINGS_KEY, QUIZ_CONFIG_REVISION_KEY } from "../shared/settings";
import { handleConnectionMessage, connectionCredential, type ConnectionMessage } from "./connection";
const storageReady = chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });

const CONTEXT_KEY = "activeViewingContext";
const DELIVERY_STATE_KEY = "quizDeliveryState:v2";
const LEGACY_DELIVERY_STATE_KEY = "quizDeliveryState:v1";
const INSTALLATION_ID_KEY = "anonymousInstallationId:v1";

type DeliveryState = {
  spoiledEpisodeKeys: string[];
  dailyDate: string;
  dailyCount: number;
};

type BackgroundMessage = {
  type?: string;
  context?: ViewingContext;
  request?: QuizRequest;
};

type QuizResult = { quiz?: Quiz; error?: QuizErrorCode };

let storageQueue: Promise<void> = Promise.resolve();

function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeState(value: unknown): DeliveryState {
  const candidate = value as Partial<DeliveryState> | undefined;
  const dailyDate = todayKey();
  return {
    spoiledEpisodeKeys: Array.isArray(candidate?.spoiledEpisodeKeys)
      ? candidate.spoiledEpisodeKeys.filter((key): key is string => typeof key === "string")
      : [],
    dailyDate,
    dailyCount: candidate?.dailyDate === dailyDate && Number.isInteger(candidate.dailyCount)
      ? Math.max(0, candidate.dailyCount ?? 0)
      : 0
  };
}

async function getState(): Promise<DeliveryState> {
  const stored = await chrome.storage.local.get([DELIVERY_STATE_KEY, LEGACY_DELIVERY_STATE_KEY]);
  if (stored[DELIVERY_STATE_KEY]) return normalizeState(stored[DELIVERY_STATE_KEY]);

  const legacy = normalizeState(stored[LEGACY_DELIVERY_STATE_KEY]);
  const migrated = {
    ...legacy,
    spoiledEpisodeKeys: [...new Set(legacy.spoiledEpisodeKeys.map((key) => key.replace(/:s\d+:e\d+$/i, "")))],
    dailyCount: 0
  };
  await chrome.storage.local.set({ [DELIVERY_STATE_KEY]: migrated });
  return migrated;
}

function getEligibility(state: DeliveryState, episodeKey: string, dailyLimit = MAX_DAILY_SPOILERS): QuizEligibility {
  if (state.spoiledEpisodeKeys.includes(episodeKey)) {
    return { eligible: false, reason: "episode_already_spoiled" };
  }
  if (state.dailyCount >= dailyLimit) {
    return { eligible: false, reason: "daily_limit_reached" };
  }
  return { eligible: true };
}

function withStorageLock<T>(task: () => Promise<T>): Promise<T> {
  const result = storageQueue.then(task, task);
  storageQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function getInstallationId(): Promise<string> {
  const stored = await chrome.storage.local.get(INSTALLATION_ID_KEY);
  if (typeof stored[INSTALLATION_ID_KEY] === "string") return stored[INSTALLATION_ID_KEY];
  const installationId = crypto.randomUUID();
  await chrome.storage.local.set({ [INSTALLATION_ID_KEY]: installationId });
  return installationId;
}

function isQuiz(value: unknown): value is Quiz {
  const quiz = value as Partial<Quiz> | undefined;
  return Boolean(
    quiz
    && typeof quiz.hint === "string"
    && typeof quiz.question === "string"
    && Array.isArray(quiz.choices)
    && quiz.choices.length === 3
    && quiz.choices.every((choice) => typeof choice === "string")
    && Number.isInteger(quiz.correctChoiceIndex)
    && (quiz.correctChoiceIndex ?? -1) >= 0
    && (quiz.correctChoiceIndex ?? 3) <= 2
    && typeof quiz.reveal === "string"
  );
}

async function fetchQuiz(request: QuizRequest, installationId: string): Promise<QuizResult> {
  try {
    const response = await fetch(DEFAULT_API_URL, {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await connectionCredential()}`,
        "X-PlotTwist-Client-Id": installationId
      },
      body: JSON.stringify(request)
    });
    if (response.status === 401) return { error: "connection_required" };
    if (response.status === 429) return { error: "rate_limited" };
    if (!response.ok) return { error: "unavailable" };
    const payload = await response.json() as { quiz?: unknown };
    return isQuiz(payload.quiz) ? { quiz: payload.quiz } : { error: "unavailable" };
  } catch {
    return { error: "unavailable" };
  }
}

async function prepareQuiz(request: QuizRequest): Promise<QuizResult> {
  return withStorageLock(async () => {
    const episodeKey = buildEpisodeKey(request.context);
    const settings = await loadSettings();
    if (!settings.enabled || !settings.platforms[request.context.platform]) return { error: "disabled" };
    const state = await getState();
    const eligibility = getEligibility(state, episodeKey, settings.dailyLimit);
    if (!eligibility.eligible) return { error: eligibility.reason };

    request = { ...request, spoilerLevel: settings.spoilerLevel, context: { ...request.context, locale: settings.locale === "auto" ? request.context.locale : settings.locale } };
    const cacheKey = `quiz:v3:${episodeKey}:${request.context.locale}:${settings.spoilerLevel}:${settings.triggerSeconds}:${DEFAULT_API_URL}`;
    const cached = await chrome.storage.local.get(cacheKey);
    let quiz = isQuiz(cached[cacheKey]) ? cached[cacheKey] : undefined;
    if (!quiz) {
      const installationId = await getInstallationId();
      const result = await fetchQuiz(request, installationId);
      if (!result.quiz) return result;
      quiz = result.quiz;
      await chrome.storage.local.set({ [cacheKey]: quiz });
    }

    return { quiz };
  });
}

async function claimQuizPresentation(context: ViewingContext): Promise<QuizEligibility> {
  return withStorageLock(async () => {
    const episodeKey = buildEpisodeKey(context);
    const state = await getState();
    const settings = await loadSettings();
    if (!settings.enabled || !settings.platforms[context.platform]) return { eligible: false, reason: "disabled" };
    const eligibility = getEligibility(state, episodeKey, settings.dailyLimit);
    if (!eligibility.eligible) return eligibility;

    state.spoiledEpisodeKeys = [...new Set([...state.spoiledEpisodeKeys, episodeKey])];
    state.dailyCount += 1;
    await chrome.storage.local.set({ [DELIVERY_STATE_KEY]: state });
    return { eligible: true };
  });
}

async function handleMessage(message: BackgroundMessage & ConnectionMessage, sender: chrome.runtime.MessageSender): Promise<unknown> {
  await storageReady;
  const trusted = sender.id === chrome.runtime.id && Boolean(sender.url?.startsWith(chrome.runtime.getURL("")));
  if (message.type?.startsWith("CONNECTION_")) {
    if (!trusted) throw new Error("Accès refusé.");
    if (["CONNECTION_SAVE", "CONNECTION_DELETE"].includes(message.type)) return withStorageLock(async () => {
      const result = await handleConnectionMessage(message);
      const stored = await chrome.storage.local.get(null);
      await chrome.storage.local.remove(Object.keys(stored).filter((key) => key.startsWith("quiz:")));
      await chrome.storage.local.set({ [QUIZ_CONFIG_REVISION_KEY]: crypto.randomUUID() });
      return result;
    });
    return handleConnectionMessage(message);
  }
  if (message.type === "GET_PREFERENCES") return loadSettings();
  if (message.type === "GET_POPUP_STATE" && trusted) return withStorageLock(async () => ({ dailyCount: (await getState()).dailyCount }));
  if (message.type === "CLEAR_LOCAL_DATA" && trusted) {
    return withStorageLock(async () => {
      const all = await chrome.storage.local.get(null);
      const keys = Object.keys(all).filter((key) => key.startsWith("quiz:"));
      await chrome.storage.local.remove(keys);
      if ((message as unknown as { history?: boolean }).history) {
        const state = await getState();
        await chrome.storage.local.set({ [DELIVERY_STATE_KEY]: { ...state, spoiledEpisodeKeys: [] } });
        await chrome.storage.local.remove(LEGACY_DELIVERY_STATE_KEY);
      }
      return { ok: true };
    });
  }
  if (message.type === "VIEWING_CONTEXT_UPDATED" && message.context) {
    return chrome.storage.session.set({ [CONTEXT_KEY]: message.context });
  }
  if (message.type === "CHECK_QUIZ_ELIGIBILITY" && message.context) {
    return withStorageLock(async () => {
      const settings = await loadSettings();
      if (!settings.enabled || !settings.platforms[message.context!.platform]) return { eligible: false, reason: "disabled" };
      return getEligibility(await getState(), buildEpisodeKey(message.context!), settings.dailyLimit);
    });
  }
  if (message.type === "CLAIM_QUIZ_PRESENTATION" && message.context) {
    return claimQuizPresentation(message.context);
  }
  if (message.type === "REQUEST_QUIZ" && message.request) return prepareQuiz(message.request);
  return undefined;
}

// Callback responses also work on Chrome versions predating Promise listeners.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  void handleMessage(message, sender).then(respond).catch((error) => respond({ error: error instanceof Error ? error.message : "Service indisponible." }));
  return true;
});

// Only sanitized preferences are shared with streaming-page scripts.
void chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || (!changes[SETTINGS_KEY] && !changes[QUIZ_CONFIG_REVISION_KEY])) return;
  void loadSettings().then(async (settings) => {
    const tabs = await chrome.tabs.query({ url: ["https://*.netflix.com/*", "https://*.primevideo.com/*"] });
    await Promise.allSettled(tabs.filter(tab => tab.id !== undefined).map(tab => chrome.tabs.sendMessage(tab.id!, { type: "PREFERENCES_CHANGED", settings })));
  });
});
