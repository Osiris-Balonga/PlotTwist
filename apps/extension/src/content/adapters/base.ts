import type { ViewingContext } from "../../shared/viewing-context";

function getVisibleArea(video: HTMLVideoElement): number {
  const bounds = video.getBoundingClientRect();
  return bounds.width > 0 && bounds.height > 0 ? bounds.width * bounds.height : 0;
}

export function getActiveVideo(selector: string): HTMLVideoElement | null {
  return [...document.querySelectorAll<HTMLVideoElement>(selector)]
    .filter((video) => video.isConnected && !video.ended && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
    .sort((left, right) => {
      const playbackDifference = Number(left.paused) - Number(right.paused);
      if (playbackDifference !== 0) return playbackDifference;
      return getVisibleArea(right) - getVisibleArea(left);
    })[0] ?? null;
}

export function isPlaying(video: HTMLVideoElement): boolean {
  return !video.paused
    && !video.ended
    && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    && getVisibleArea(video) > 0;
}

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

export function getFirstText(selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const text = document.querySelector(selector)?.textContent?.trim();
    if (text) return text;
  }
  return undefined;
}

export function getEpisodeCoordinates(value?: string): Pick<ViewingContext, "season" | "episode"> {
  if (!value) return {};
  const match = value.match(/(?:season|saison)\s*(\d+).*?(?:episode|ep\.?|épisode|ép\.?)\s*(\d+)/i)
    ?? value.match(/S(\d+)\s*E(\d+)/i);
  if (!match) return {};
  return { season: Number(match[1]), episode: Number(match[2]) };
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
