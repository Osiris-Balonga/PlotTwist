import { MAX_DAILY_SPOILERS } from "./limits";

export const SETTINGS_KEY = "preferences:v1";
export const QUIZ_CONFIG_REVISION_KEY = "quizConfigRevision:v1";
export const DEFAULT_API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8787/v1/quiz";
export type Settings = {
  enabled: boolean;
  spoilerLevel: "light" | "moderate" | "advanced";
  triggerSeconds: number;
  dailyLimit: number;
  locale: "auto" | "fr" | "en";
  platforms: { netflix: boolean; prime: boolean };
};
export const DEFAULT_SETTINGS: Settings = {
  enabled: true, spoilerLevel: "moderate", triggerSeconds: 120,
  dailyLimit: MAX_DAILY_SPOILERS, locale: "auto",
  platforms: { netflix: true, prime: true }
};

export function normalizeSettings(value: unknown): Settings {
  const candidate = value as Partial<Settings> | undefined;
  return {
    enabled: typeof candidate?.enabled === "boolean" ? candidate.enabled : true,
    spoilerLevel: ["light", "moderate", "advanced"].includes(candidate?.spoilerLevel ?? "") ? candidate!.spoilerLevel! : "moderate",
    triggerSeconds: [60, 120, 300, 600].includes(candidate?.triggerSeconds ?? 0) ? candidate!.triggerSeconds! : 120,
    dailyLimit: [1, 2, 3].includes(candidate?.dailyLimit ?? 0) ? candidate!.dailyLimit! : MAX_DAILY_SPOILERS,
    locale: ["auto", "fr", "en"].includes(candidate?.locale ?? "") ? candidate!.locale! : "auto",
    platforms: {
      netflix: typeof candidate?.platforms?.netflix === "boolean" ? candidate.platforms.netflix : true,
      prime: typeof candidate?.platforms?.prime === "boolean" ? candidate.platforms.prime : true
    }
  };
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY]);
}
