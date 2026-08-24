import { getActiveVideo, getEpisodeCoordinates, getFirstText, getLocale, getVideoTiming, observeDocument } from "./base";
import type { PlatformAdapter } from "./types";

const NETFLIX_PLAYER = ".watch-video video, [data-uia='watch-video'] video";

export const netflixAdapter: PlatformAdapter = {
  platform: "netflix",
  matches: (url) => url.hostname.endsWith("netflix.com"),
  getPlayer: () => getActiveVideo(NETFLIX_PLAYER),
  getContext() {
    const match = window.location.pathname.match(/^\/watch\/(\d+)/);
    const video = this.getPlayer();
    const title = getFirstText(["[data-uia='video-title']", ".video-title h4", ".video-title"]);
    const episodeLabel = getFirstText(["[data-uia='video-title'] span", ".video-title span", "[data-uia*='episode-title']"]);

    return {
      platform: "netflix",
      ...(match ? { contentId: match[1] } : {}),
      title: title || document.title.replace(/\s*-\s*Netflix$/i, "").trim() || undefined,
      ...(episodeLabel ? { episodeTitle: episodeLabel } : {}),
      ...getEpisodeCoordinates(episodeLabel),
      url: window.location.href,
      locale: getLocale(),
      ...getVideoTiming(video)
    };
  },
  observeChanges: observeDocument
};
