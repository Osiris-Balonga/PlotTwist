export type ProviderId = "openai" | "deepseek" | "kimi" | "gemini" | "mistral" | "groq" | "openrouter";
export const PROVIDERS: Readonly<Record<ProviderId, { readonly label: string; readonly baseUrl: string }>>;
export const MODEL_SUGGESTIONS: Readonly<Record<ProviderId, readonly string[]>>;
