import type { ViewingContext } from "../../shared/viewing-context";

export function getLocale(): string {
  const pageLanguage = document.documentElement.lang.trim();
  return pageLanguage || navigator.languages[0] || navigator.language || "en";
}

export function getVideoTiming(video: HTMLVideoElement | null): Pick<ViewingContext, "currentTimeSeconds" | "durationSeconds"> {
  const duration = video?.duration;

  return {
    currentTimeSeconds: Math.floor(video?.currentTime ?? 0),
    ...(duration && Number.isFinite(duration) ? { durationSeconds: Math.floor(duration) } : {})
  };
}

export function observeDocument(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", onChange);

  return () => {
    observer.disconnect();
    window.removeEventListener("popstate", onChange);
  };
}

