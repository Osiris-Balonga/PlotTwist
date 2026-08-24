import type { ViewingContext } from "../shared/viewing-context";

const CONTEXT_KEY = "activeViewingContext";

chrome.runtime.onMessage.addListener((message: { type?: string; context?: ViewingContext }) => {
  if (message.type !== "VIEWING_CONTEXT_UPDATED" || !message.context) return;

  return chrome.storage.session.set({ [CONTEXT_KEY]: message.context });
});
