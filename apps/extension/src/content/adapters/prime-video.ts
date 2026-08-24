import { getLocale, getVideoTiming, observeDocument } from "./base";
import type { PlatformAdapter } from "./types";

const PRIME_PLAYER = ".atvwebplayersdk-video-surface video";

export const primeVideoAdapter: PlatformAdapter = {
  platform: "prime",
  matches: (url) => url.hostname.endsWith("primevideo.com"),
  getPlayer: () => document.querySelector<HTMLVideoElement>(PRIME_PLAYER),
  getContext() {
    const match = window.location.pathname.match(/\/detail\/([^/?]+)/);
    const heading = document.querySelector("h1")?.textContent?.trim();
    const video = this.getPlayer();

    return {
      platform: "prime",
      ...(match ? { contentId: match[1] } : {}),
      title: heading || document.title.replace(/\s*[-:]\s*Prime Video.*$/i, "").trim() || undefined,
      url: window.location.href,
      locale: getLocale(),
      ...getVideoTiming(video)
    };
  },
  observeChanges: observeDocument
};

