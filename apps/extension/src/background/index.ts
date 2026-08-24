import { buildEpisodeKey } from "../shared/episode-key";
import { MAX_DAILY_SPOILERS } from "../shared/limits";
import type { Quiz, QuizEligibility, QuizErrorCode, QuizRequest } from "../shared/quiz";
import type { ViewingContext } from "../shared/viewing-context";

const API_URL = "http://localhost:8787/v1/quiz";
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
  type?: "VIEWING_CONTEXT_UPDATED" | "CHECK_QUIZ_ELIGIBILITY" | "CLAIM_QUIZ_PRESENTATION" | "REQUEST_QUIZ";
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

function getEligibility(state: DeliveryState, episodeKey: string): QuizEligibility {
  if (state.spoiledEpisodeKeys.includes(episodeKey)) {
    return { eligible: false, reason: "episode_already_spoiled" };
  }
  if (state.dailyCount >= MAX_DAILY_SPOILERS) {
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
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PlotTwist-Client-Id": installationId
      },
      body: JSON.stringify(request)
    });
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
    const state = await getState();
    const eligibility = getEligibility(state, episodeKey);
    if (!eligibility.eligible) return { error: eligibility.reason };

    const cacheKey = `quiz:v2:${episodeKey}:${request.context.locale}`;
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
    const eligibility = getEligibility(state, episodeKey);
    if (!eligibility.eligible) return eligibility;

    state.spoiledEpisodeKeys = [...new Set([...state.spoiledEpisodeKeys, episodeKey])];
    state.dailyCount += 1;
    await chrome.storage.local.set({ [DELIVERY_STATE_KEY]: state });
    return { eligible: true };
  });
}

chrome.runtime.onMessage.addListener((message: BackgroundMessage) => {
  if (message.type === "VIEWING_CONTEXT_UPDATED" && message.context) {
    return chrome.storage.session.set({ [CONTEXT_KEY]: message.context });
  }
  if (message.type === "CHECK_QUIZ_ELIGIBILITY" && message.context) {
    return withStorageLock(async () => getEligibility(await getState(), buildEpisodeKey(message.context!)));
  }
  if (message.type === "CLAIM_QUIZ_PRESENTATION" && message.context) {
    return claimQuizPresentation(message.context);
  }
  if (message.type === "REQUEST_QUIZ" && message.request) return prepareQuiz(message.request);
  return undefined;
});
