import "./styles.css";
import { initializeDisclosures, reveal } from "./motion";
import { DEFAULT_SETTINGS, loadSettings, SETTINGS_KEY, type Settings } from "../shared/settings";
import { PROVIDERS, MODEL_SUGGESTIONS, type ProviderId } from "@plottwist/providers";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => $<HTMLInputElement>(id);
const select = (id: string) => $<HTMLSelectElement>(id);
select("provider").replaceChildren(...Object.entries(PROVIDERS).map(([id, provider]) => new Option(provider.label, id)));
type Connection = { provider: string; model: string; hasKey: boolean };
let connection: Connection = { provider: "openai", model: "", hasKey: false };
let connectionDirty = false;
let discovering = 0;
const keyIcon = $("replace-key").querySelector("svg")!;
const refreshIcon = keyIcon.innerHTML;
function setKeyAction(editing: boolean): void {
  const label = editing ? "Annuler le remplacement" : "Remplacer la clé API";
  $("replace-key").setAttribute("aria-label", label);
  document.querySelector(".tooltip")!.textContent = label;
  keyIcon.innerHTML = editing ? '<path d="m6 6 12 12M6 18 18 6"/>' : refreshIcon;
}
function feedback(id: string, text: string, error = false): void {
  const changed = $(id).textContent !== text;
  $(id).textContent = text; $(id).dataset.error = String(error);
  if (changed && text) reveal($(id));
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : "Le service est indisponible. Réessaie."; }
async function message<T>(type: string, extra: Record<string, unknown> = {}): Promise<T> {
  const result = await chrome.runtime.sendMessage({ type, ...extra });
  if (result?.error) throw new Error(result.error);
  return result as T;
}
function describeIntensity(): void {
  const level = document.querySelector<HTMLInputElement>('input[name="spoilerLevel"]:checked')!.value;
  const descriptions: Record<string, string> = {
    light: "Uniquement la suite de l’épisode que tu regardes.",
    moderate: "Les révélations peuvent aller jusqu’à la fin de la saison en cours.",
    advanced: "Les révélations peuvent aller jusqu’à la fin de la série, même dans les saisons suivantes."
  };
  document.querySelector<HTMLElement>(".segmented")!.style.setProperty("--selected-index", String(["light", "moderate", "advanced"].indexOf(level)));
  $("intensity-description").textContent = descriptions[level]; reveal($("intensity-description"));
}
function fillPreferences(value: Settings): void {
  document.querySelector<HTMLInputElement>(`input[name="spoilerLevel"][value="${value.spoilerLevel}"]`)!.checked = true;
  select("trigger").value = String(value.triggerSeconds); select("daily-limit").value = String(value.dailyLimit);
  select("locale").value = value.locale; input("netflix").checked = value.platforms.netflix; input("prime").checked = value.platforms.prime;
  describeIntensity();
}
function candidateConfig(): Record<string, unknown> {
  const apiKey = input("api-key").value.trim();
  return { provider: select("provider").value, model: select("model").value, ...(apiKey ? { apiKey } : {}) };
}
function updateModels(models: string[], preferred = select("model").value): void {
  const placeholder = new Option("Choisir un modèle", "");
  select("model").replaceChildren(placeholder, ...models.map(model => new Option(model, model)));
  select("model").value = models.includes(preferred) ? preferred : "";
}
function suggestedModels(): string[] { return [...MODEL_SUGGESTIONS[select("provider").value as ProviderId]]; }
function fillConnection(value: Connection): void {
  const available = Array.from(select("model").options).map(option => option.value).filter(Boolean);
  connection = value; connectionDirty = false; discovering++;
  select("provider").value = value.provider;
  updateModels(value.hasKey ? [...new Set([...available, value.model].filter(Boolean))] : suggestedModels(), value.model);
  input("api-key").value = ""; input("api-key").disabled = value.hasKey;
  input("api-key").placeholder = value.hasKey ? "••••••••••••••••" : "Ajouter ta clé";
  $("replace-key").hidden = !value.hasKey; $("delete-key").hidden = !value.hasKey;
  setKeyAction(false);
}
async function discoverModels(): Promise<void> {
  if (!input("api-key").value.trim() && (!connection.hasKey || select("provider").value !== connection.provider)) return;
  const revision = ++discovering;
  const selected = select("model").value;
  feedback("connection-status", "Recherche des modèles disponibles…");
  try {
    const result = await message<{ models: string[] }>("CONNECTION_MODELS", { config: candidateConfig() });
    if (revision !== discovering) return;
    updateModels(result.models);
    feedback("connection-status", !result.models.length ? "Aucun modèle disponible pour cette clé."
      : selected && !result.models.includes(selected) ? "Le modèle choisi n’est pas disponible pour cette clé. Choisis-en un autre." : "");
  } catch (error) {
    if (revision === discovering) { updateModels(suggestedModels()); feedback("connection-status", errorMessage(error), true); }
  }
}
function setBusy(value: boolean): void { $("settings-form").inert = value; $<HTMLButtonElement>("save").disabled = value; }
document.querySelectorAll('input[name="spoilerLevel"]').forEach(radio => radio.addEventListener("change", describeIntensity));
$("connection-controls").addEventListener("input", () => { connectionDirty = true; });
select("provider").addEventListener("change", () => {
  discovering++; connectionDirty = true; updateModels(suggestedModels(), "");
  input("api-key").value = ""; input("api-key").disabled = false; input("api-key").placeholder = "Ajouter ta clé";
  $("replace-key").hidden = true; feedback("connection-status", "");
});
input("api-key").addEventListener("input", () => {
  discovering++;
  const selected = select("model").value;
  updateModels([...new Set([...suggestedModels(), selected].filter(Boolean))], selected);
});
input("api-key").addEventListener("change", () => void discoverModels());
$("replace-key").addEventListener("click", () => {
  const editing = input("api-key").disabled;
  input("api-key").disabled = !editing; input("api-key").value = "";
  input("api-key").placeholder = editing ? "Nouvelle clé API" : "••••••••••••••••";
  setKeyAction(editing);
  if (editing) input("api-key").focus(); else void discoverModels();
});
$("test-connection").addEventListener("click", async () => {
  setBusy(true);
  try {
    if (!select("model").value) { await discoverModels(); if (!select("model").value) throw new Error("Choisis un modèle dans la liste."); }
    feedback("connection-status", "Vérification de la connexion…");
    const result = await message<{ models: string[]; message: string }>("CONNECTION_TEST", { config: candidateConfig() });
    updateModels(result.models); feedback("connection-status", result.message);
  } catch (error) { feedback("connection-status", errorMessage(error), true); }
  finally { setBusy(false); }
});
$("settings-form").addEventListener("submit", async event => {
  event.preventDefault(); setBusy(true); feedback("save-status", "Enregistrement…");
  try {
    if (connectionDirty) {
      if (!select("model").value) throw new Error("Choisis un modèle disponible pour ta clé API.");
      const candidate = candidateConfig();
      await message("CONNECTION_SAVE", { config: candidate });
      fillConnection({ provider: String(candidate.provider), model: String(candidate.model), hasKey: true });
      feedback("connection-status", "Connexion enregistrée.");
    }
    const current = await loadSettings();
    const updated: Settings = {
      ...current,
      spoilerLevel: document.querySelector<HTMLInputElement>('input[name="spoilerLevel"]:checked')!.value as Settings["spoilerLevel"],
      triggerSeconds: Number(select("trigger").value), dailyLimit: Number(select("daily-limit").value),
      locale: select("locale").value as Settings["locale"], platforms: { netflix: input("netflix").checked, prime: input("prime").checked }
    };
    await chrome.storage.local.set({ [SETTINGS_KEY]: updated }); feedback("save-status", "Paramètres enregistrés.");
  } catch (error) { feedback("save-status", errorMessage(error), true); }
  finally { setBusy(false); }
});
$("delete-key").addEventListener("click", async () => {
  if (!window.confirm("Supprimer ta clé API de PlotTwist ? Les nouveaux quiz nécessiteront une nouvelle clé.")) return;
  setBusy(true);
  try { await message("CONNECTION_DELETE"); fillConnection({ provider: "openai", model: "", hasKey: false }); feedback("connection-status", "Ta clé a été supprimée."); }
  catch (error) { feedback("connection-status", errorMessage(error), true); }
  finally { setBusy(false); }
});
$("clear-cache").addEventListener("click", async () => {
  try { await message("CLEAR_LOCAL_DATA"); feedback("save-status", "Cache vidé."); }
  catch (error) { feedback("save-status", errorMessage(error), true); }
});
$("clear-history").addEventListener("click", async () => {
  if (!window.confirm("Effacer l’historique local ? Des spoilers déjà vus pourront réapparaître. Le compteur du jour est conservé.")) return;
  try { await message("CLEAR_LOCAL_DATA", { history: true }); feedback("save-status", "Historique local effacé."); }
  catch (error) { feedback("save-status", errorMessage(error), true); }
});
$("reset-settings").addEventListener("click", () => { fillPreferences(DEFAULT_SETTINGS); feedback("save-status", "Réglages par défaut rétablis. Enregistre pour les appliquer."); });
async function initialize(): Promise<void> {
  updateModels(suggestedModels());
  initializeDisclosures(); fillPreferences(await loadSettings()); setBusy(false);
  try {
    const stored = await message<Connection>("CONNECTION_GET");
    if (!connectionDirty) { fillConnection(stored); if (connection.hasKey) await discoverModels(); }
    else connection = stored;
  }
  catch (error) { feedback("connection-status", errorMessage(error), true); }
}
void initialize().catch(error => feedback("save-status", errorMessage(error), true));
