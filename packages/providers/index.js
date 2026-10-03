// Shared by the settings picker and the server. Endpoints are publisher-owned.
const PROVIDERS = Object.freeze({
  openai: { label: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  deepseek: { label: "DeepSeek", baseUrl: "https://api.deepseek.com" },
  kimi: { label: "Kimi (Moonshot)", baseUrl: "https://api.moonshot.ai/v1" },
  gemini: { label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" },
  mistral: { label: "Mistral", baseUrl: "https://api.mistral.ai/v1" },
  groq: { label: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
  openrouter: { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" }
});
// Starter suggestions, not an entitlement list. Verify against the account before saving.
const MODEL_SUGGESTIONS = Object.freeze({
  openai: ["gpt-4.1-mini", "gpt-4.1"],
  deepseek: ["deepseek-flash", "deepseek-v4-pro"],
  kimi: ["kimi-k2.5"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
  mistral: ["mistral-small-latest", "mistral-medium-latest"],
  groq: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
  openrouter: ["openai/gpt-4.1-mini", "google/gemini-2.5-flash"]
});
module.exports = { PROVIDERS, MODEL_SUGGESTIONS };
