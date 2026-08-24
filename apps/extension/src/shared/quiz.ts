import type { ViewingContext } from "./viewing-context";
export interface Quiz { hint: string; question: string; choices: string[]; correctChoiceIndex: number; reveal: string; safeUntilSeconds: number; }
export interface QuizRequest { context: ViewingContext; spoilerLevel: "light" | "moderate" | "advanced"; }
