import { getActiveVideo, getEpisodeCoordinates, getFirstText, getLocale, getVideoTiming, observeDocument } from "./base";
import type { PlatformAdapter } from "./types";

const PRIME_PLAYER = ".atvwebplayersdk-video-surface video, .atvwebplayersdk-player-container video";

export const primeVideoAdapter: PlatformAdapter = {
  platform: "prime",
  matches: (url) => url.hostname.endsWith("primevideo.com"),
  getPlayer: () => getActiveVideo(PRIME_PLAYER),
  getContext() {
    const match = window.location.pathname.match(/\/detail\/([^/?]+)/);
    const heading = getFirstText([".atvwebplayersdk-title-text", "[class*='title-text']", "h1"]);
    const episodeLabel = getFirstText([".atvwebplayersdk-subtitle-text", "[class*='subtitle-text']", "[class*='episode-title']"]);
    const video = this.getPlayer();

    return {
      platform: "prime",
      ...(match ? { contentId: match[1] } : {}),
      title: heading || document.title.replace(/\s*[-:]\s*Prime Video.*$/i, "").trim() || undefined,
      ...(episodeLabel ? { episodeTitle: episodeLabel } : {}),
      ...getEpisodeCoordinates(episodeLabel),
      url: window.location.href,
      locale: getLocale(),
      ...getVideoTiming(video)
    };
  },
  observeChanges: observeDocument
};
