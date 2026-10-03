import { DEFAULT_API_URL } from "../shared/settings";
const CREDENTIAL_KEY = "personalConnectionCredential:v1";
export type ConnectionMessage = { type: string; config?: unknown };
let credentialLoad: Promise<string> | undefined;

export function connectionCredential(): Promise<string> {
  credentialLoad ??= (async () => {
    const stored = await chrome.storage.local.get(CREDENTIAL_KEY);
    if (typeof stored[CREDENTIAL_KEY] === "string" && /^[a-f0-9]{64}$/.test(stored[CREDENTIAL_KEY])) return stored[CREDENTIAL_KEY] as string;
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
    await chrome.storage.local.set({ [CREDENTIAL_KEY]: token });
    return token;
  })();
  return credentialLoad;
}
async function call(endpoint: string, method = "GET", config?: unknown): Promise<unknown> {
  const url = new URL(`/v1/connection${endpoint}`, DEFAULT_API_URL);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Le service doit utiliser HTTPS.");
  let response: Response;
  let payload: { error?: string };
  try {
    response = await fetch(url, { method, redirect: "error", signal: AbortSignal.timeout(25_000),
      headers: { Authorization: `Bearer ${await connectionCredential()}`, "Content-Type": "application/json" },
      ...(config === undefined ? {} : { body: JSON.stringify(config) }) });
    payload = await response.json();
  } catch { throw new Error("Impossible de joindre PlotTwist. Vérifie ta connexion et réessaie."); }
  if (!response.ok) throw new Error(payload.error || "Le service est indisponible.");
  return payload;
}
export function handleConnectionMessage(message: ConnectionMessage): Promise<unknown> {
  if (message.type === "CONNECTION_GET") return call("");
  if (message.type === "CONNECTION_MODELS") return call("/models", "POST", message.config);
  if (message.type === "CONNECTION_TEST") return call("/test", "POST", message.config);
  if (message.type === "CONNECTION_SAVE") return call("", "PUT", message.config);
  if (message.type === "CONNECTION_DELETE") return call("", "DELETE");
  throw new Error("Requête inconnue.");
}
