import { createHash, createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { PROVIDERS, type ProviderId } from "@plottwist/providers";

export { PROVIDERS };
export const ConnectionSchema = z.object({
  provider: z.enum(Object.keys(PROVIDERS) as [ProviderId, ...ProviderId[]]),
  model: z.string().trim().max(150).regex(/^[\w.:/\-]*$/).default(""),
  apiKey: z.string().trim().min(1).max(1000).optional()
}).strict();
export type Connection = { provider: keyof typeof PROVIDERS; model: string; apiKey: string };

export function connectionIdentity(authorization?: string): string | undefined {
  if (!authorization || !/^Bearer [a-f0-9]{64}$/.test(authorization)) return undefined;
  return createHash("sha256").update(authorization.slice(7)).digest("hex");
}
function encryptionKey(): Buffer {
  const key = Buffer.from(process.env.PLOTTWIST_CONFIG_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("Secure storage is not configured.");
  return key;
}
function directory(): string | undefined {
  if (process.env.VERCEL) return undefined;
  if (process.env.PLOTTWIST_CONFIG_DIRECTORY) return path.resolve(process.env.PLOTTWIST_CONFIG_DIRECTORY);
  return undefined;
}
export function storageReady(): boolean {
  try {
    encryptionKey();
    if (process.env.PLOTTWIST_CONFIG_REDIS_URL && process.env.PLOTTWIST_CONFIG_REDIS_TOKEN) return new URL(process.env.PLOTTWIST_CONFIG_REDIS_URL).protocol === "https:";
    return Boolean(directory());
  } catch { return false; }
}
export function sealConnection(identity: string, connection: Connection): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`plottwist:connection:v1:${identity}`));
  const data = Buffer.concat([cipher.update(JSON.stringify(connection)), cipher.final()]);
  return JSON.stringify({ iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") });
}
export function unsealConnection(identity: string, encrypted: string): Connection {
  const envelope = JSON.parse(encrypted);
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(envelope.iv, "base64"));
  cipher.setAAD(Buffer.from(`plottwist:connection:v1:${identity}`));
  cipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const data = Buffer.concat([cipher.update(Buffer.from(envelope.data, "base64")), cipher.final()]);
  const parsed = ConnectionSchema.parse(JSON.parse(data.toString("utf8")));
  if (!parsed.apiKey) throw new Error("Stored key is missing.");
  return parsed as Connection;
}
function storageKey(identity: string): string {
  if (!/^[a-f0-9]{64}$/.test(identity)) throw new Error("Invalid connection identity.");
  return `plottwist:connection:v1:${identity}`;
}
async function redis(command: string[]): Promise<unknown> {
  const response = await fetch(process.env.PLOTTWIST_CONFIG_REDIS_URL!, {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${process.env.PLOTTWIST_CONFIG_REDIS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(command)
  });
  if (!response.ok) throw new Error("Storage unavailable.");
  const payload = await response.json() as { result?: unknown; error?: unknown };
  if (payload.error) throw new Error("Storage unavailable.");
  return payload.result;
}
export async function loadConnection(identity: string): Promise<Connection | undefined> {
  const key = storageKey(identity);
  if (!storageReady()) throw new Error("Secure storage is not configured.");
  let encrypted: unknown;
  if (process.env.PLOTTWIST_CONFIG_REDIS_URL) encrypted = await redis(["GET", key]);
  else {
    try { encrypted = await readFile(path.join(directory()!, `${identity}.json`), "utf8"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  return typeof encrypted === "string" ? unsealConnection(identity, encrypted) : undefined;
}
export async function saveConnection(identity: string, config: Connection): Promise<void> {
  const key = storageKey(identity);
  if (!storageReady()) throw new Error("Secure storage is not configured.");
  const encrypted = sealConnection(identity, config);
  if (process.env.PLOTTWIST_CONFIG_REDIS_URL) { await redis(["SET", key, encrypted]); return; }
  await mkdir(directory()!, { recursive: true });
  const filename = path.join(directory()!, `${identity}.json`);
  const temporary = `${filename}.${randomBytes(8).toString("hex")}.tmp`;
  await writeFile(temporary, encrypted, { mode: 0o600 });
  await rename(temporary, filename);
}
export async function deleteConnection(identity: string): Promise<void> {
  const key = storageKey(identity);
  if (!storageReady()) throw new Error("Secure storage is not configured.");
  if (process.env.PLOTTWIST_CONFIG_REDIS_URL) { await redis(["DEL", key]); return; }
  try { await unlink(path.join(directory()!, `${identity}.json`)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
export async function resolveConnection(identity: string, value: unknown): Promise<Connection> {
  const parsed = ConnectionSchema.parse(value);
  const current = await loadConnection(identity);
  if (!parsed.apiKey && current?.provider !== parsed.provider) throw new Error("Ajoute ta clé API pour ce fournisseur.");
  const apiKey = parsed.apiKey ?? current?.apiKey;
  if (!apiKey) throw new Error("Ajoute ta clé API pour continuer.");
  return { ...parsed, apiKey };
}
export async function listModels(config: Connection): Promise<string[]> {
  // OpenRouter's catalogue is public; validate the personal key separately.
  if (config.provider === "openrouter") {
    const authentication = await fetch(`${PROVIDERS.openrouter.baseUrl}/auth/key`, {
      headers: { Authorization: `Bearer ${config.apiKey}` }, redirect: "error", signal: AbortSignal.timeout(15_000)
    });
    if (!authentication.ok) throw new Error("Connexion refusée. Vérifie ta clé API et le fournisseur choisi.");
  }
  const response = await fetch(`${PROVIDERS[config.provider].baseUrl}/models`, {
    headers: { Authorization: `Bearer ${config.apiKey}` }, redirect: "error", signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error("Connexion refusée. Vérifie ta clé API et le fournisseur choisi.");
  const payload = await response.json() as { data?: { id?: unknown }[] };
  if (!Array.isArray(payload.data)) throw new Error("La liste des modèles est indisponible. Réessaie.");
  return [...new Set(payload.data.map(model => model.id).filter((id): id is string =>
    typeof id === "string" && id.length <= 150 && /^[\w.:/\-]+$/.test(id)
    && !/embedding|whisper|tts|dall-e|moderation|transcri|rerank|sora|realtime/i.test(id)
    && (config.provider !== "openai" || /^(gpt-|chatgpt-|o\d)/.test(id))
  ))].sort();
}
