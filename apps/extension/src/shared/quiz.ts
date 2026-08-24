import type { ViewingContext } from "./viewing-context";
export interface Quiz { hint: string; question: string; choices: string[]; correctChoiceIndex: number; reveal: string; viewerProgressSeconds: number; }
export interface QuizRequest { context: ViewingContext; spoilerLevel: "light" | "moderate" | "advanced"; }
export type QuizErrorCode = "daily_limit_reached" | "episode_already_spoiled" | "rate_limited" | "runtime_unavailable" | "unavailable";
export type QuizEligibility = { eligible: true } | { eligible: false; reason: Extract<QuizErrorCode, "daily_limit_reached" | "episode_already_spoiled"> };
