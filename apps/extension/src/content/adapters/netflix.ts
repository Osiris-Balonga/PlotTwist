import { getActiveVideo, getLocale, getVideoTiming, observeDocument } from "./base";
import type { PlatformAdapter } from "./types";

const NETFLIX_PLAYER = ".watch-video video, [data-uia='watch-video'] video";

export const netflixAdapter: PlatformAdapter = {
  platform: "netflix",
  matches: (url) => url.hostname.endsWith("netflix.com"),
  getPlayer: () => getActiveVideo(NETFLIX_PLAYER),
  getContext() {
    const match = window.location.pathname.match(/^\/watch\/(\d+)/);
    const video = this.getPlayer();

    return {
      platform: "netflix",
      ...(match ? { contentId: match[1] } : {}),
      title: document.title.replace(/\s*-\s*Netflix$/i, "").trim() || undefined,
      url: window.location.href,
      locale: getLocale(),
      ...getVideoTiming(video)
    };
  },
  observeChanges: observeDocument
};
