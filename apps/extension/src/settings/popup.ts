import "./styles.css";
import { loadSettings, SETTINGS_KEY } from "../shared/settings";

const enabled = document.querySelector<HTMLInputElement>("#enabled")!;
const count = document.querySelector<HTMLParagraphElement>("#daily-count")!;
const status = document.querySelector<HTMLParagraphElement>("#popup-status")!;
function showError(): void { status.hidden = false; status.textContent = "Impossible d’enregistrer. Réessaie."; status.dataset.error = "true"; }
async function refresh(): Promise<void> {
  const settings = await loadSettings();
  enabled.checked = settings.enabled;
  enabled.disabled = false;
  const state = await chrome.runtime.sendMessage({ type: "GET_POPUP_STATE" });
  const used = state?.dailyCount ?? 0;
  count.textContent = `${used} spoiler${used > 1 ? "s" : ""} sur ${settings.dailyLimit} aujourd’hui`;
}
enabled.addEventListener("change", async () => {
  enabled.disabled = true;
  try {
    const settings = await loadSettings();
    await chrome.storage.local.set({ [SETTINGS_KEY]: { ...settings, enabled: enabled.checked } });
  } catch { enabled.checked = !enabled.checked; showError(); }
  finally { enabled.disabled = false; }
});
document.querySelector("#open-settings")!.addEventListener("click", () => {
  void chrome.runtime.openOptionsPage().catch(showError);
});
chrome.storage.onChanged.addListener((_, area) => { if (area === "local") void refresh().catch(showError); });
void refresh().catch(showError);
