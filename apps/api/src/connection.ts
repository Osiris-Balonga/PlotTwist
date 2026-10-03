import type { IncomingMessage, ServerResponse } from "node:http";
import { connectionIdentity, deleteConnection, listModels, loadConnection, resolveConnection, saveConnection, storageReady } from "./services/connections.js";

async function readBody(request: IncomingMessage): Promise<unknown> {
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of request) {
    size += Buffer.byteLength(chunk); if (size > 8192) throw new Error("Request too large.");
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function handleConnectionRequest(request: IncomingMessage, response: ServerResponse, pathname: string): Promise<void> {
  const reply = (status: number, payload: unknown) => {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(payload));
  };
  const identity = connectionIdentity(request.headers.authorization);
  if (!identity) return reply(401, { error: "Connexion non reconnue. Réouvre l’extension." });
  if (!storageReady()) return reply(503, { error: "Le service PlotTwist est temporairement indisponible. Réessaie plus tard." });
  try {
    if (pathname === "/v1/connection" && request.method === "GET") {
      const config = await loadConnection(identity);
      return reply(200, { provider: config?.provider ?? "openai", model: config?.model ?? "", hasKey: Boolean(config?.apiKey) });
    }
    if (pathname === "/v1/connection" && request.method === "DELETE") { await deleteConnection(identity); return reply(200, { deleted: true }); }
    if (request.method !== "POST" && request.method !== "PUT") return reply(404, { error: "Not found." });
    const candidate = await resolveConnection(identity, await readBody(request));
    const models = await listModels(candidate);
    if (pathname === "/v1/connection/models" && request.method === "POST") return reply(200, { models });
    if (!candidate.model || !models.includes(candidate.model)) return reply(422, { error: "Choisis un modèle disponible pour ta clé API.", models });
    if (pathname === "/v1/connection/test" && request.method === "POST") return reply(200, { models, message: "Ta clé est valide et le modèle est disponible." });
    if (pathname === "/v1/connection" && request.method === "PUT") { await saveConnection(identity, candidate); return reply(200, { saved: true }); }
    return reply(404, { error: "Not found." });
  } catch (error) {
    const safe = ["Ajoute ta clé API pour ce fournisseur.", "Ajoute ta clé API pour continuer.", "Connexion refusée. Vérifie ta clé API et le fournisseur choisi.", "La liste des modèles est indisponible. Réessaie."];
    return reply(422, { error: error instanceof Error && safe.includes(error.message) ? error.message : "Impossible de configurer la connexion. Vérifie les champs et réessaie." });
  }
}
